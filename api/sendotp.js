// /api/send-otp.js — Vercel Serverless Function
// Sends OTP via 2Factor.in voice call

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { phone } = req.body;
  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }

  const TWOFACTOR_KEY = process.env.TWOFACTOR_API_KEY;
  const SUPABASE_URL  = process.env.SUPABASE_URL;
  const SUPABASE_KEY  = process.env.SUPABASE_ANON_KEY;

  if (!TWOFACTOR_KEY) return res.status(500).json({ success: false, message: 'OTP service not configured' });

  try {
    // 1. Check if phone already registered in Supabase
    const checkResp = await fetch(
      `${SUPABASE_URL}/rest/v1/nexus_users?phone=eq.${phone}&select=id`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const existing = await checkResp.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'NUMBER_EXISTS' });
    }

    // 2. Send OTP via 2Factor.in voice call
    const otpResp = await fetch(
      `https://2factor.in/API/V1/${TWOFACTOR_KEY}/SMS/+91${phone}/AUTOGEN`,
      { method: 'GET' }
    );
    const otpData = await otpResp.json();

    if (otpData.Status === 'Success') {
      const sessionId = otpData.Details;

      // 3. Log OTP send in Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/nexus_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          phone,
          action: 'OTP_SENT',
          otp_session: sessionId,
          ts: new Date().toISOString(),
          device: req.headers['user-agent']?.slice(0, 100) || 'unknown'
        })
      });

      return res.status(200).json({ success: true, sessionId, method: 'sms' });
    } else {
      return res.status(502).json({ success: false, message: otpData.Details || 'OTP send failed' });
    }
  } catch (err) {
    console.error('send-otp error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
        }
