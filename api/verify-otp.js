export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { sessionId, otp } = req.body;
    const API_KEY = process.env.TWOFACTOR_API_KEY;

    const url = `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Status === 'Success') {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ success: false, message: data.Details });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
