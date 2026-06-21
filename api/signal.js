const UPSTASH_URL = process.env.UPSTASH_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_TOKEN;
const SECRET = process.env.SECRET_KEY || 'wllm-booking-2024';

async function kv(path) {
  const res = await fetch(`${UPSTASH_URL}/${path}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
  });
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://wllm.dk');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    if (req.query.key !== SECRET) return res.status(401).end();
    await kv(`set/booking_signal/${Date.now()}/ex/60`);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    const { result } = await kv('get/booking_signal');
    if (result) {
      await kv('del/booking_signal');
      return res.status(200).json({ show: true });
    }
    return res.status(200).json({ show: false });
  }

  res.status(405).end();
};
