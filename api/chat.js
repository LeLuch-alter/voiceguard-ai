import { readFileSync } from 'fs';

// Company knowledge base is loaded from knowledge.md (editable without changing code).
// Read once on cold start and cached.
let COMPANY_KNOWLEDGE = '';
try {
  COMPANY_KNOWLEDGE = readFileSync(new URL('../knowledge.md', import.meta.url), 'utf8').slice(0, 12000).trim();
} catch (e) {
  COMPANY_KNOWLEDGE = '';
}

// CORS restriction: by default allow only localhost and *.vercel.app.
// For your own domain set ALLOWED_ORIGINS (comma-separated) in environment variables.
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

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
}

// Privacy: messages are not logged or stored anywhere on the server —
// stateless function, it simply proxies the request to GROQ.
export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(200).json({ reply: 'ERROR: API key not found in environment' });

  const { message, history = [], lang = 'en' } = req.body || {};

  // Guard against oversized/invalid requests.
  if (typeof message !== 'string' || !message.trim() || message.length > 4000) {
    return res.status(400).json({ reply: 'Некорректное сообщение.' });
  }

  const langNote =
    lang === 'ru' ? 'Always respond in Russian.' :
    lang === 'kz' ? 'Always respond in Kazakh.' :
    'Always respond in English.';

  // Company name can be overridden via the COMPANY_NAME environment variable.
  const companyName = process.env.COMPANY_NAME || 'компании';

  const systemPrompt = `Ты — вежливый и профессиональный ИИ-оператор ${companyName}.
  Ты помогаешь клиентам узнать об услугах, ценах, условиях и оставить заявку.
  Ты общаешься спокойно, дружелюбно и по делу.
  ${langNote}

  --- ПРАВИЛА ОБЩЕНИЯ ---
  - Используй информацию из раздела «БАЗА ЗНАНИЙ КОМПАНИИ» (ниже) как основной источник правды.
  - Отвечай только в рамках информации о компании, её услугах и заявках.
  - Если точной информации нет в базе знаний (например, конкретной цены или наличия) — не выдумывай. Скажи, что уточнишь у менеджера, и предложи оставить заявку.
  - Если клиент просит соединить с человеком/оператором, недоволен или ты не можешь помочь после нескольких попыток — предложи связаться с живым оператором (кнопка «Связаться с оператором» в меню) и оставить имя и номер телефона.
  - Всегда вежлив, спокоен и профессионален.
  - Когда клиент хочет оставить заявку или чтобы с ним связались — ОБЯЗАТЕЛЬНО сначала спроси его имя и номер телефона. Не говори "менеджер свяжется", пока не получил имя и номер.
  - После того как клиент дал имя и номер — подтверди заявку и скажи, что менеджер свяжется с ним в ближайшее время.
  - Не пиши **жирным**, "__" и другие спецсимволы — только обычный текст.
  - Не используй эмодзи — только текст.
  - Используй абзацы для структурирования информации.
  - Если вопрос не по теме компании — вежливо переведи разговор обратно к услугам.
  - Всегда отвечай на языке клиента.`;

  const knowledgeBlock = COMPANY_KNOWLEDGE
    ? `\n\n--- БАЗА ЗНАНИЙ КОМПАНИИ (источник правды) ---\n${COMPANY_KNOWLEDGE}`
    : '';

  const messages = [
    { role: 'system', content: systemPrompt + knowledgeBlock },
    ...history.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text || m.content || '',
    })),
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages,
        max_tokens: 400,
        temperature: 0.6,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ reply: `Groq error: ${data.error.message}` });
    }

    const reply = data.choices?.[0]?.message?.content
      || "Sorry, I couldn't process that. Please try again.";

    // If the client left a phone number — send a Telegram notification
    const hasPhone = /(\+?7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/.test(message);
    if (hasPhone) {
      await sendTelegram(
        `<b>Новая заявка от клиента!</b>\n\n` +
        `Сообщение:\n${message}`
      );
    }

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(200).json({ reply: `Server error: ${err.message}` });
  }
}
