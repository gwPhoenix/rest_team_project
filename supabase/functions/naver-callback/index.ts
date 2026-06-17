import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://gwphoenix.github.io/rest_team_project/'

  const url   = new URL(req.url)
  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const clientId       = Deno.env.get('NAVER_CLIENT_ID')!
  const clientSecret   = Deno.env.get('NAVER_CLIENT_SECRET')!

  // ── state 검증 ─────────────────────────────────────────────
  const cookieState = (req.headers.get('cookie') ?? '')
    .split(';')
    .map(c => c.trim().split('='))
    .find(([k]) => k === 'naver_state')
    ?.[1]

  if (!code || !state || state !== cookieState) {
    return Response.redirect(`${siteUrl}?error=invalid_state`, 302)
  }

  // ── 1. 네이버 토큰 교환 ────────────────────────────────────
  const tokenText = await fetch(
    `https://nid.naver.com/oauth2.0/token?${new URLSearchParams({
      grant_type: 'authorization_code', client_id: clientId,
      client_secret: clientSecret, code, state,
    })}`
  ).then(r => r.text())

  let tokenData: Record<string, string>
  try { tokenData = JSON.parse(tokenText) }
  catch { return Response.redirect(`${siteUrl}?error=token_parse&raw=${encodeURIComponent(tokenText.slice(0,100))}`, 302) }

  if (!tokenData.access_token) {
    return Response.redirect(`${siteUrl}?error=token_failed`, 302)
  }

  // ── 2. 네이버 유저 정보 ────────────────────────────────────
  const profileText = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  }).then(r => r.text())

  let naverUser: Record<string, string>
  try { naverUser = JSON.parse(profileText).response }
  catch { return Response.redirect(`${siteUrl}?error=profile_parse&raw=${encodeURIComponent(profileText.slice(0,100))}`, 302) }

  if (!naverUser?.id) {
    return Response.redirect(`${siteUrl}?error=no_user_id`, 302)
  }

  const syntheticEmail = `naver_${naverUser.id}@oauth.naver`

  // ── 3. Supabase 유저 생성 or 조회 (SDK) ───────────────────
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email:         syntheticEmail,
    email_confirm: true,
    app_metadata:  { provider: 'naver', providers: ['naver'] },
    user_metadata: {
      full_name:   naverUser.name ?? naverUser.nickname ?? '',
      avatar_url:  naverUser.profile_image ?? null,
      provider:    'naver',
      naver_email: naverUser.email ?? null,
    },
  })

  if (createErr && !createErr.message.toLowerCase().includes('already')) {
    return Response.redirect(`${siteUrl}?error=user_create_failed&msg=${encodeURIComponent(createErr.message)}`, 302)
  }

  // ── 4. 로그인 링크 발급 (SDK) ──────────────────────────────
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type:    'magiclink',
    email:   syntheticEmail,
    options: { redirectTo: siteUrl },
  })

  if (linkErr || !linkData?.properties?.action_link) {
    return Response.redirect(`${siteUrl}?error=link_failed&msg=${encodeURIComponent(linkErr?.message ?? 'no_action_link')}`, 302)
  }

  return Response.redirect(linkData.properties.action_link, 302)
})
