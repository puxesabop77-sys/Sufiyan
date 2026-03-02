exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  try {
    const { phone, otp } = JSON.parse(event.body);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_VERIFY_SID;

    const toPhone = `+91${phone}`;
    const url = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;

    const params = new URLSearchParams();
    params.append('To', toPhone);
    params.append('Code', otp);

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();

    if (data.status === 'approved') {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid OTP' }) };
    }
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: error.message }) };
  }
};
