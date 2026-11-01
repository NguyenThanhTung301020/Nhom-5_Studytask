const ENDPOINT = 'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode'

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors })

    const { email } = await request.json().catch(() => ({}))
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ error: 'Email không hợp lệ' }, { status: 400, headers: cors })
    }

    const res = await fetch(`${ENDPOINT}?key=${env.FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
    })
    const data = await res.json()

    // Ghi log để lấy kết quả cho báo cáo
    console.log('Identity Toolkit:', res.status, JSON.stringify(data))

    // Trả kết quả chung, không để lộ email nào có tài khoản
    return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 400, headers: cors })
  },
}