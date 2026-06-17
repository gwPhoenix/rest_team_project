Deno.serve(async () => {
  const clientId = Deno.env.get('NAVER_CLIENT_ID')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')

  if (!clientId || !supabaseUrl) {
    return new Response('서버 환경변수가 설정되지 않았습니다.', { status: 500 })
  }

  const redirectUri = `${supabaseUrl}/functions/v1/naver-callback`
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  })

  return new Response(null, {
    status: 302,
    headers: {
      'Location': `https://nid.naver.com/oauth2.0/authorize?${params}`,
      'Set-Cookie': `naver_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=300`,
    },
  })
})
