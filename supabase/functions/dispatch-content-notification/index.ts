// Server-side dispatcher that broadcasts a "new content" email to ALL users.
// Triggered from a Postgres trigger (via pg_net) when:
//   - kind=vacancy: a vacancy row becomes status='live' and notified_at IS NULL
//   - kind=bar_challenge: a bar_challenges row becomes status='approved' and notified_at IS NULL
//
// Auth: requires the SUPABASE_SERVICE_ROLE_KEY as bearer (the trigger uses the
// vault-stored key 'email_queue_service_role_key'). No admin caller required —
// the DB trigger is the trust boundary.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://locus.legal'

interface Body {
  kind?: 'vacancy' | 'bar_challenge'
  id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Service-role bearer required. Accept either byte-equality with the env
  // key OR any JWT whose `role` claim is `service_role` (vault key may differ
  // after rotation but still identifies as service role).
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  let authorized = false
  if (token) {
    if (token === SERVICE_KEY) {
      authorized = true
    } else {
      const parts = token.split('.')
      if (parts.length >= 2) {
        try {
          const payload = parts[1].replaceAll('-', '+').replaceAll('_', '/')
            .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
          const claims = JSON.parse(atob(payload)) as Record<string, unknown>
          if (claims?.role === 'service_role') authorized = true
        } catch { /* fall through */ }
      }
    }
  }
  if (!authorized) return json({ error: 'unauthorized' }, 401)

  let body: Body = {}
  try { body = await req.json() } catch { /* allow */ }
  const { kind, id } = body
  if (!kind || !id) return json({ error: 'kind and id required' }, 400)
  if (kind !== 'vacancy' && kind !== 'bar_challenge') {
    return json({ error: 'invalid kind' }, 400)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  // 1. Load source row + idempotency guard.
  let templateName: string
  let templateData: Record<string, unknown>
  let table: string

  if (kind === 'vacancy') {
    table = 'vacancies'
    const { data: v } = await admin
      .from('vacancies')
      .select('id, firm_name, role, location, stipend, description, status, notified_at, opportunity_type')
      .eq('id', id)
      .maybeSingle()
    if (!v) return json({ error: 'vacancy not found' }, 404)
    if (v.notified_at) return json({ ok: true, skipped: 'already_notified' })
    if (v.status !== 'live') return json({ ok: true, skipped: 'not_live' })

    templateName = 'new-vacancy'
    templateData = {
      firmName: v.firm_name,
      role: v.role,
      opportunityType: v.opportunity_type || 'internship',
      location: v.location || undefined,
      stipend: v.stipend || undefined,
      description: v.description || undefined,
      vacancyUrl: `${SITE_URL}/vacancies`,
    }
  } else {
    table = 'bar_challenges'
    const { data: c } = await admin
      .from('bar_challenges')
      .select('id, title, area_of_law, difficulty, question_type, status, notified_at')
      .eq('id', id)
      .maybeSingle()
    if (!c) return json({ error: 'challenge not found' }, 404)
    if (c.notified_at) return json({ ok: true, skipped: 'already_notified' })
    if (c.status !== 'approved') return json({ ok: true, skipped: 'not_approved' })

    templateName = 'new-bar-challenge'
    templateData = {
      title: c.title,
      areaOfLaw: c.area_of_law,
      difficulty: c.difficulty,
      questionType: c.question_type,
      challengeUrl: `${SITE_URL}/the-bar`,
    }
  }

  // 2. Page through all users.
  const recipients: string[] = []
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) return json({ error: 'failed to list users', details: error.message }, 500)
    const users = data?.users || []
    for (const u of users) if (u.email) recipients.push(u.email.toLowerCase())
    if (users.length < perPage) break
    page += 1
    if (page > 50) break
  }
  const unique = Array.from(new Set(recipients))

  // 3. Filter suppressed.
  let allowed = unique
  if (unique.length) {
    const { data: suppressed } = await admin
      .from('suppressed_emails').select('email').in('email', unique)
    const blocked = new Set((suppressed || []).map((r: any) => r.email))
    allowed = unique.filter((e) => !blocked.has(e))
  }

  // 4. Enqueue.
  let queued = 0
  let failed = 0
  for (const email of allowed) {
    try {
      const r = await invokeSend({
        templateName,
        recipientEmail: email,
        idempotencyKey: `${kind}-notify-${id}-${email}`,
        templateData,
      })
      if (r.ok) queued += 1
      else { console.error('enqueue failed', email, r.error, r.body); failed += 1 }
    } catch (e) {
      console.error('enqueue threw', email, e); failed += 1
    }
  }

  // 5. Stamp notified_at.
  await admin.from(table).update({ notified_at: new Date().toISOString() }).eq('id', id)

  return json({
    ok: true, kind, id,
    total_users: unique.length,
    suppressed_skipped: unique.length - allowed.length,
    queued, failed,
  })
})

async function invokeSend(payload: Record<string, unknown>) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
      },
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    let parsed: unknown = null
    try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
    if (!res.ok) return { ok: false, status: res.status, error: `sender ${res.status}`, body: parsed }
    return { ok: true, status: res.status, body: parsed }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), body: null }
  }
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
