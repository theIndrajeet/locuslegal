// Admin broadcast: send a markdown-rendered email to a chosen audience segment.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tiny safe markdown→HTML (paragraphs, bold, italic, links, line breaks)
function mdToHtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const blocks = md.trim().split(/\n{2,}/)
  return blocks.map(b => {
    let html = esc(b)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color:#0A0A0A;text-decoration:underline">$1</a>')
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    html = html.replace(/\n/g, '<br/>')
    return `<p style="margin:0 0 14px">${html}</p>`
  }).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Auth: caller must be admin
  const authHeader = req.headers.get('authorization') || ''
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(url, serviceKey)
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()
  if (!roles) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const body = await req.json().catch(() => ({}))
  const { subject, bodyMarkdown, ctaLabel, ctaUrl, segment, broadcastId } = body as {
    subject?: string; bodyMarkdown?: string; ctaLabel?: string; ctaUrl?: string;
    segment?: 'all' | 'beta' | 'applicants'; broadcastId?: string;
  }

  if (!subject || !bodyMarkdown) {
    return new Response(JSON.stringify({ error: 'subject_and_body_required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const id = broadcastId || crypto.randomUUID()
  const bodyHtml = mdToHtml(bodyMarkdown)

  // Build recipient list per segment
  let userIds: string[] = []
  if (segment === 'beta') {
    const { data } = await supabase.from('beta_testers').select('user_id').not('user_id', 'is', null)
    userIds = (data || []).map((r: any) => r.user_id).filter(Boolean)
  } else if (segment === 'applicants') {
    const { data } = await supabase.from('profiles').select('id').gt('applications_count', 0).limit(10000)
    userIds = (data || []).map((p: any) => p.id)
  } else {
    const { data } = await supabase.from('profiles').select('id').limit(10000)
    userIds = (data || []).map((p: any) => p.id)
  }

  const { data: { users } = { users: [] } } = await supabase.auth.admin.listUsers({ perPage: 1000 }) as any
  const emailMap = new Map<string, string>((users || []).map((u: any) => [u.id, u.email]).filter(([, e]) => !!e))

  let queued = 0
  for (const uid of userIds) {
    const email = emailMap.get(uid)
    if (!email) continue
    const { error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'broadcast',
        recipientEmail: email,
        idempotencyKey: `broadcast-${id}-${uid}`,
        templateData: { subject, bodyHtml, ctaLabel, ctaUrl },
      },
    })
    if (!error) queued++
  }

  // Log broadcast
  await supabase.from('update_broadcasts').insert({
    id, subject, body_markdown: bodyMarkdown, body_html: bodyHtml,
    cta_label: ctaLabel, cta_url: ctaUrl, status: 'sent',
    sent_at: new Date().toISOString(), recipient_count: queued,
    created_by: user.id, sent_by: user.id,
  })

  return new Response(JSON.stringify({ ok: true, queued, broadcastId: id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
