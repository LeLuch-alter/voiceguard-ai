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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(200).json({ text: '', error: 'API key not found' });

  const { audio, mime = 'audio/webm', lang = 'en' } = req.body || {};
  if (!audio) return res.status(200).json({ text: '', error: 'No audio' });

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
