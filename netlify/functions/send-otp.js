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
    const fromPhone  = process.env.TWILIO_PHONE;

    const body = `🔐 NEXUS Security Alert\n\nYour One-Time Password (OTP) is:\n\n[ ${otp} ]\n\nValid for 10 minutes only.\nDo NOT share this code with anyone.\n\n— Team NEXUS\n👨‍💻 Powered by Sufiyan Absar`;
    const toPhone = `+91${phone}`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const params = new URLSearchParams();
    params.append('To', toPhone);
    params.append('From', fromPhone);
    params.append('Body', body);

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

    if (data.sid) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: JSON.stringify(data) }) };
    }
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: error.message }) };
  }
};
