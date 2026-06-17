import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const clientId       = Deno.env.get('NAVER_CLIENT_ID')!
  const clientSecret   = Deno.env.get('NAVER_CLIENT_SECRET')!
  const siteUrl        = Deno.env.get('SITE_URL') ?? 'https://gwphoenix.github.io/rest_team_project/'

  // ── state 검증 (CSRF 방지) ──────────────────────────────────
  const cookieState = (req.headers.get('cookie') ?? '')
    .split(';')
    .map(c => c.trim().split('='))
    .find(([k]) => k === 'naver_state')
    ?.[1]

  if (!code || !state || state !== cookieState) {
    return Response.redirect(`${siteUrl}?error=invalid_state`, 302)
  }

  // ── 네이버 액세스 토큰 교환 ────────────────────────────────
  const tokenUrl = `https://nid.naver.com/oauth2.0/token?${new URLSearchParams({
    grant_type:    'authorization_code',
    client_id:     clientId,
    client_secret: clientSecret,
    code,
    state,
  })}`

  const tokenRes  = await fetch(tokenUrl)
  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    return Response.redirect(`${siteUrl}?error=token_failed`, 302)
  }

  // ── 네이버 유저 정보 조회 ──────────────────────────────────
  const profileRes  = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const profileData = await profileRes.json()
  const naverUser   = profileData.response

  if (!naverUser?.id) {
    return Response.redirect(`${siteUrl}?error=no_user_id`, 302)
  }

  // 네이버 고유 ID 기반 가상 이메일 — 다른 소셜 로그인과 완전히 별개 유저로 처리
  const syntheticEmail = `naver_${naverUser.id}@oauth.naver`

  // ── Supabase 유저 생성 or 기존 유저 조회 ───────────────────
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email:         syntheticEmail,
    email_confirm: true,
    user_metadata: {
      full_name:  naverUser.name ?? naverUser.nickname ?? '',
      avatar_url: naverUser.profile_image ?? null,
      provider:   'naver',
      naver_email: naverUser.email ?? null,
    },
  })

  let userEmail = syntheticEmail

  if (createErr) {
    // 이미 가입된 네이버 유저면 기존 유저 그대로 사용
    if (!createErr.message.toLowerCase().includes('already')) {
      return Response.redirect(`${siteUrl}?error=user_create_failed`, 302)
    }
  }

  // ── 로그인 링크 발급 ────────────────────────────────────────
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type:    'magiclink',
    email:   userEmail,
    options: { redirectTo: siteUrl },
  })

  if (linkErr || !linkData) {
    return Response.redirect(`${siteUrl}?error=link_failed`, 302)
  }

  return Response.redirect(linkData.properties.action_link, 302)
})
