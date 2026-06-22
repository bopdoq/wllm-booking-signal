const UPSTASH_URL = process.env.UPSTASH_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_TOKEN;
const SECRET = process.env.SECRET_KEY || 'wllm-booking-2024';

async function kv(path, method = 'GET', body = null) {
  const res = await fetch(`${UPSTASH_URL}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  });
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST ?key=xxx → gem booking signal (fra workflow)
  if (req.method === 'POST' && req.query.type !== 'formdata') {
    if (req.query.key !== SECRET) return res.status(401).end();
    await kv(`set/booking_signal/${Date.now()}/ex/300`);
    return res.status(200).json({ ok: true });
  }

  // POST ?type=formdata → gem kontaktdata fra formular
  if (req.method === 'POST' && req.query.type === 'formdata') {
    if (req.query.key !== SECRET) return res.status(401).end();
    const { name, phone, email } = req.body;
    await kv(`set/booking_formdata/${JSON.stringify({ name, phone, email })}/ex/600`);
    return res.status(200).json({ ok: true });
  }

  // GET ?type=formdata → Voice AI henter kontaktdata
  if (req.method === 'GET' && req.query.type === 'formdata') {
    const { result } = await kv('get/booking_formdata');
    if (result) {
      await kv('del/booking_formdata');
      return res.status(200).json({ success: true, data: JSON.parse(result) });
    }
    return res.status(200).json({ success: false });
  }

  // GET → polling for popup signal (uændret)
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
