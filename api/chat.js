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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(200).json({ reply: 'ERROR: API key not found in environment' });

  const { message, history = [], lang = 'en' } = req.body;

  const langNote =
    lang === 'ru' ? 'Always respond in Russian.' :
    lang === 'kz' ? 'Always respond in Kazakh.' :
    'Always respond in English.';

  // Название компании можно переопределить переменной окружения COMPANY_NAME.
  const companyName = process.env.COMPANY_NAME || 'компании';

  const systemPrompt = `Ты — вежливый и профессиональный ИИ-оператор ${companyName}.
  Ты помогаешь клиентам узнать об услугах, ценах, условиях и оставить заявку.
  Ты общаешься спокойно, дружелюбно и по делу.
  ${langNote}

  --- ПРАВИЛА ОБЩЕНИЯ ---
  - Отвечай только в рамках информации о компании, её услугах и заявках.
  - Если ты не знаешь точную информацию (например, конкретную цену или наличие) — не выдумывай. Скажи, что уточнишь у менеджера, и предложи оставить заявку.
  - Всегда вежлив, спокоен и профессионален.
  - Когда клиент хочет оставить заявку или чтобы с ним связались — ОБЯЗАТЕЛЬНО сначала спроси его имя и номер телефона. Не говори "менеджер свяжется", пока не получил имя и номер.
  - После того как клиент дал имя и номер — подтверди заявку и скажи, что менеджер свяжется с ним в ближайшее время.
  - Не пиши **жирным**, "__" и другие спецсимволы — только обычный текст.
  - Не используй эмодзи — только текст.
  - Используй абзацы для структурирования информации.
  - Если вопрос не по теме компании — вежливо переведи разговор обратно к услугам.
  - Всегда отвечай на языке клиента.`;

  const messages = [
    { role: 'system', content: systemPrompt },
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

    // Если клиент оставил телефон — отправляем уведомление в Telegram
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
