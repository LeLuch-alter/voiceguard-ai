// Speech-to-text (STT) via GROQ Whisper.
// Accepts POST { audio: base64, mime: string, lang: 'ru'|'en'|'kz' }
// and returns { text }. Audio is not stored on the server.

// ISO-639-1 codes to hint Whisper's language. kz -> kk (Kazakh).
const LANG_MAP = { ru: 'ru', en: 'en', kz: 'kk' };

// File extension from mime — OpenAI/GROQ detect the format by file name.
function extFromMime(mime = '') {
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'm4a';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

// CORS restriction: by default only localhost and *.vercel.app.
// Your own domain — via the ALLOWED_ORIGINS variable (comma-separated list).
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

// Privacy: audio is used only for recognition and is never stored —
// the buffer disappears when the function finishes after GROQ responds.
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
