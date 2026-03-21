export default async function handler(req) {
  // Handle CORS preflight
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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
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
    const { phone } = body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid phone number' }), { status: 400, headers: CORS });
    }

    // 1. Check duplicate
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/nexus_users?phone=eq.${phone}&select=id`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const existing = await checkRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return new Response(JSON.stringify({ success: false, message: 'NUMBER_EXISTS' }), { status: 200, headers: CORS });
    }

    // 2. Send OTP
    if (!TWOFACTOR_KEY) {
      // Dev mode — no real OTP
      return new Response(JSON.stringify({ success: true, sessionId: 'DEV_' + Date.now(), method: 'dev' }), { status: 200, headers: CORS });
    }

    const otpRes = await fetch(`https://2factor.in/API/V1/${TWOFACTOR_KEY}/SMS/+91${phone}/AUTOGEN`);
    const otpData = await otpRes.json();

    if (otpData.Status === 'Success') {
      // 3. Log
      await fetch(`${SUPABASE_URL}/rest/v1/nexus_logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'return=minimal' },
        body: JSON.stringify({ phone, action: 'OTP_SENT', otp_session: otpData.Details, ts: new Date().toISOString() })
      });
      return new Response(JSON.stringify({ success: true, sessionId: otpData.Details, method: 'sms' }), { status: 200, headers: CORS });
    } else {
      return new Response(JSON.stringify({ success: false, message: otpData.Details || 'OTP send failed' }), { status: 200, headers: CORS });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message || 'Server error' }), { status: 500, headers: CORS });
  }
}

export const config = { runtime: 'edge' };
