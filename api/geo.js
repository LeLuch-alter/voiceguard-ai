// Returns the visitor country code from Vercel's geolocation header.
// Used by the frontend to auto-pick the interface language (CIS -> Russian, else English).
function applyCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin) {
    const ok = allowed.length
      ? allowed.includes(origin)
      : /^(https?:\/\/localhost(:\d+)?|https:\/\/[a-z0-9-]+\.vercel\.app)$/i.test(origin);
    if (ok) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.setHeader('Cache-Control', 'no-store');
  const country = req.headers['x-vercel-ip-country'] || '';
  return res.status(200).json({ country });
}
