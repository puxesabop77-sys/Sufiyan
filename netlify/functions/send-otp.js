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
    const API_KEY = process.env.FAST2SMS_API_KEY;
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${API_KEY}&variables_values=${otp}&route=otp&numbers=${phone}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.return === true) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: JSON.stringify(data) }) };
    }
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: error.message }) };
  }
};
