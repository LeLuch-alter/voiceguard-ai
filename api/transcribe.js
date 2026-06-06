// Распознавание речи (STT) через GROQ Whisper.
// Принимает POST { audio: base64, mime: string, lang: 'ru'|'en'|'kz' }
// и возвращает { text }. Аудио на сервере не сохраняется.

// ISO-639-1 коды для подсказки языка Whisper. kz -> kk (казахский).
const LANG_MAP = { ru: 'ru', en: 'en', kz: 'kk' };

// Расширение файла по mime — OpenAI/GROQ определяют формат по имени файла.
function extFromMime(mime = '') {
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'm4a';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

// Ограничение CORS: по умолчанию только localhost и *.vercel.app.
// Свой домен — через переменную ALLOWED_ORIGINS (список через запятую).
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

// Приватность: аудио используется только для распознавания и нигде не сохраняется —
// после ответа GROQ буфер исчезает вместе с завершением функции.
export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(200).json({ text: '', error: 'API key not found' });

  const { audio, mime = 'audio/webm', lang = 'en' } = req.body || {};
  if (!audio || typeof audio !== 'string') return res.status(200).json({ text: '', error: 'No audio' });
  if (audio.length > 8000000) return res.status(413).json({ text: '', error: 'Audio too large' });

  try {
    const buffer = Buffer.from(audio, 'base64');
    const blob = new Blob([buffer], { type: mime });

    const form = new FormData();
    form.append('file', blob, `audio.${extFromMime(mime)}`);
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');
    const code = LANG_MAP[lang];
    if (code) form.append('language', code);

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });

    const data = await response.json();
    if (data.error) {
      return res.status(200).json({ text: '', error: data.error.message });
    }
    return res.status(200).json({ text: (data.text || '').trim() });
  } catch (err) {
    return res.status(200).json({ text: '', error: err.message });
  }
}
