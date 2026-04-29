// Admin-only dispatcher for the "Updates" broadcast.
// - Verifies the caller is an admin (defense in depth on top of RLS).
// - Reads users via auth.admin.listUsers (paginated).
// - For each non-suppressed recipient, invokes send-transactional-email
//   with the 'updates-broadcast' template and an idempotency key.
// - Updates the broadcast row with the final recipient count and status.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DispatchBody {
  broadcastId?: string
  testEmail?: string // when set, sends only to this email (no DB updates)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

  // 1. Auth: caller must be an admin.
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'unauthorized' }, 401)

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'unauthorized' }, 401)
  const callerId = userData.user.id
  const callerEmail = userData.user.email || ''

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: roleRow } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', callerId)
    .eq('role', 'admin')
    .maybeSingle()
  if (!roleRow) return json({ error: 'forbidden' }, 403)

  // 2. Parse body.
  let body: DispatchBody = {}
  try { body = await req.json() } catch { /* allow empty */ }
  const { broadcastId, testEmail } = body

  // ---- TEST MODE ----
  if (testEmail) {
    if (!broadcastId) return json({ error: 'broadcastId required for test send' }, 400)
    const { data: bc } = await admin
      .from('update_broadcasts').select('*').eq('id', broadcastId).maybeSingle()
    if (!bc) return json({ error: 'broadcast not found' }, 404)

    const result = await invokeSend(admin, {
      templateName: 'updates-broadcast',
      recipientEmail: testEmail,
      idempotencyKey: `updates-test-${broadcastId}-${testEmail}`,
      templateData: buildTemplateData(bc),
    })
    if (!result.ok) {
      console.error('test send failed', result)
      return json({ ok: false, test: true, error: result.error ?? 'send failed', details: result.body }, 502)
    }
    return json({ ok: true, test: true, result })
  }

  // ---- FULL BROADCAST MODE ----
  if (!broadcastId) return json({ error: 'broadcastId required' }, 400)

  const { data: bc, error: bcErr } = await admin
    .from('update_broadcasts').select('*').eq('id', broadcastId).maybeSingle()
  if (bcErr || !bc) return json({ error: 'broadcast not found' }, 404)
  if (bc.status === 'sent' || bc.status === 'sending') {
    return json({ error: `broadcast already ${bc.status}` }, 409)
  }

  await admin.from('update_broadcasts')
    .update({ status: 'sending', sent_by: callerId })
    .eq('id', broadcastId)

  // 3. Page through users.
  const recipients: string[] = []
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      await admin.from('update_broadcasts')
        .update({ status: 'failed' }).eq('id', broadcastId)
      return json({ error: 'failed to list users', details: error.message }, 500)
    }
    const users = data?.users || []
    for (const u of users) {
      if (u.email) recipients.push(u.email.toLowerCase())
    }
    if (users.length < perPage) break
    page += 1
    if (page > 50) break // safety: max 50k users
  }

  // De-duplicate.
  const unique = Array.from(new Set(recipients))

  // 4. Filter out suppressed addresses.
  let allowed = unique
  if (unique.length) {
    const { data: suppressed } = await admin
      .from('suppressed_emails').select('email').in('email', unique)
    const blocked = new Set((suppressed || []).map((r: any) => r.email))
    allowed = unique.filter((e) => !blocked.has(e))
  }

  const templateData = buildTemplateData(bc)

  // 5. Enqueue one send per recipient (the queue dispatcher handles delivery & retries).
  let queued = 0
  let failed = 0
  for (const email of allowed) {
    try {
      const r = await invokeSend(admin, {
        templateName: 'updates-broadcast',
        recipientEmail: email,
        idempotencyKey: `updates-${broadcastId}-${email}`,
        templateData,
      })
      if (r.ok) queued += 1
      else {
        console.error('enqueue failed', email, r.error, r.body)
        failed += 1
      }
    } catch (e) {
      console.error('enqueue threw', email, e)
      failed += 1
    }
  }

  const finalStatus = failed === allowed.length && allowed.length > 0 ? 'failed' : 'sent'
  await admin.from('update_broadcasts').update({
    status: finalStatus,
    recipient_count: queued,
    sent_at: new Date().toISOString(),
  }).eq('id', broadcastId)

  return json({
    ok: true,
    total_users: unique.length,
    suppressed_skipped: unique.length - allowed.length,
    queued,
    failed,
    triggered_by: callerEmail,
  })
})

function buildTemplateData(bc: any) {
  return {
    subject: bc.subject,
    bodyHtml: bc.body_html,
    ctaLabel: bc.cta_label || undefined,
    ctaUrl: bc.cta_url || undefined,
    preheader: bc.preheader || undefined,
  }
}

async function invokeSend(
  client: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string; body: unknown }> {
  try {
    const { data, error } = await client.functions.invoke('send-transactional-email', {
      body: payload,
    })
    if (error) {
      return { ok: false, error: error.message ?? String(error), body: data ?? null }
    }
    return { ok: true, body: data ?? null }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), body: null }
  }
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
