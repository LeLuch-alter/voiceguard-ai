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

  const systemPrompt = `You are VoiceGuard AI — intelligent assistant for Aikyn&Dimash's company.
You help clients choose courses, answer questions honestly, never pressure or lie.
If client wants to pay or speak to a manager — say a human will contact them soon.
${langNote}

--- НАШИ КУРСЫ И ЦЕНЫ ---
1. Курс Python — 60 000 тг/месяц, длительность 3 месяца, уровень: с нуля
2. Курс Дизайн (Figma) — 30 000 тг/месяц, длительность 2 месяца, уровень: с нуля
3. Курс Excel — 25 000 тг/месяц, длительность 1 месяц, уровень: любой
4. Курс Английский — 40 000 тг/месяц, длительность 3 месяца, уровень: с нуля
5. Курс Инвестиции — 30 000 тг/месяц, длительность 2 месяца, уровень: любой

---требования к клиенту---
- Возраст от 16 лет
- Наличие смартфона или компьютера с интернетом
- Желание учиться и развиваться
- Готовность уделять 1-2 часа в день на занятия

---преимущества наших курсов---
- Практические задания и проекты
- Поддержка от опытных преподавателей
- Гибкий график занятий
- Сертификат по окончании курса

---правила общения---
- Всегда будь вежливым и дружелюбным
- Не навязывай курсы, помогай выбрать лучший вариант
- Если клиент хочет оплатить или связаться с менеджером — скажи, что с ними скоро свяжутся
- Не используй сложные термины, объясняй просто и понятно
- Не используй таблицы, списки или форматирование — отвечай простым текстом
- Не отвечай долгими абзацами — будь кратким и по делу 

--- FAQ ---
- Рассрочка? Да, 3 месяца без процентов
- Где занятия? Онлайн и офлайн (Алматы, ул. Абая 10)
- Режим работы: 09:00-18:00, Пн-Сб
- Контакт: +7 707 851 23 45 (WhatsApp, Telegram)
- Скидки? 10% за 3 мес, 20% за 6 мес
- Возврат? Да, в течение 7 дней`;

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

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(200).json({ reply: `Server error: ${err.message}` });
  }
}