// Escalation to a human operator: the client leaves name + phone,
// the operator receives a Telegram notification with the conversation context.
// Nothing is stored on the server — stateless function.

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function escapeHtml(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  return r.ok;
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { name, phone, message = '', history = [] } = req.body || {};

  if (typeof name !== 'string' || !name.trim() || name.length > 100) {
    return res.status(400).json({ ok: false, error: 'name' });
  }
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return res.status(400).json({ ok: false, error: 'phone' });
  }

  const context = (Array.isArray(history) ? history.slice(-6) : [])
    .map(m => `${m.role === 'assistant' ? 'ИИ' : 'Клиент'}: ${escapeHtml((m.text || m.content || '').slice(0, 300))}`)
    .join('\n');

  const text =
    `<b>ЭСКАЛАЦИЯ — клиент просит оператора</b>\n\n` +
    `Имя: ${escapeHtml(name)}\n` +
    `Телефон: ${escapeHtml(phone)}\n` +
    (message ? `Сообщение: ${escapeHtml(String(message).slice(0, 500))}\n` : '') +
    (context ? `\n--- последние реплики ---\n${context}` : '');

  try {
    await sendTelegram(text);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: true });
  }
}
