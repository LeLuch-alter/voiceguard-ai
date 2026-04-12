export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
 
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
4. Курс Английский — 40 000 тг/месяц, длительность 3 месяца, уровень: с нуля(A0-B2)
5. Курс Инвестиции — 30 000 тг/месяц, длительность 2 месяца, уровень: любой

--- ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ ---
- Есть ли рассрочка? Да, 3 месяца без процентов
- Где проходят занятия? Онлайн и офлайн (Алматы, ул. Абая 10)
- Режим работы: 09:00–18:00, Пн–Сб
- Контакт менеджера: +7 707 851 23 45 (WhatsApp, Telegram) — всегда рад помочь!
- Какие есть скидки? При оплате за 3 месяца — скидка 10%, при оплате за 6 месяцев — скидка 20%
- Могу ли я вернуть деньги? Да, в течение первых 7 дней после оплаты, если курс не подошёл

--- ПРАВИЛА ОБЩЕНИЯ ---
- Всегда вежлив и честен
- Не навязывай покупку, просто предоставляй информацию
- Если не знаешь ответа — скажи что уточнишь у менеджера
- Не придумывай цены или условия которых нет выше`;
 
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
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages,
        max_tokens: 512,
        temperature: 0.7,
      }),
    });
 
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content
      || "Sorry, I couldn't process that. Please try again.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ reply: 'Server error. Please try again.' });
  }
}