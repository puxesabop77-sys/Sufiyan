export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  const CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nbwqsinimvcstnifryqp.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5id3FzaW5pbXZjc3RuaWZyeXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzA3MDIsImV4cCI6MjA4OTY0NjcwMn0.ROFbHUyWX0MpkU7nurmng0upFQwJ_44uRvI8i3Tz338';
  const TWOFACTOR_KEY = process.env.TWOFACTOR_API_KEY;

  try {
    const body = await req.json();
    const { sessionId, otp } = body;

    // Dev mode
    if (sessionId && sessionId.startsWith('DEV_')) {
      return new Response(JSON.stringify({ success: otp === '123456' }), { status: 200, headers: CORS });
    }

    if (!sessionId || !otp || otp.length !== 6) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid input' }), { status: 400, headers: CORS });
    }

    if (!TWOFACTOR_KEY) {
      return new Response(JSON.stringify({ success: false, message: '2Factor not configured' }), { status: 200, headers: CORS });
    }

    const verifyRes = await fetch(`https://2factor.in/API/V1/${TWOFACTOR_KEY}/SMS/VERIFY/${sessionId}/${otp}`);
    const verifyData = await verifyRes.json();

    if (verifyData.Status === 'Success' && verifyData.Details === 'OTP Matched') {
      await fetch(`${SUPABASE_URL}/rest/v1/nexus_logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'return=minimal' },
        body: JSON.stringify({ action: 'OTP_VERIFIED', otp_session: sessionId, ts: new Date().toISOString() })
      });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: CORS });
    } else {
      return new Response(JSON.stringify({ success: false, message: verifyData.Details || 'OTP mismatch' }), { status: 200, headers: CORS });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: CORS });
  }
}

export const config = { runtime: 'edge' };
      
