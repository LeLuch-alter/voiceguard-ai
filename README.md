# VoiceGuard AI

An AI operator (voice and text chat assistant) for businesses. The client
opens the page, immediately enters the chat, and communicates with the AI ​​via voice or text: learns about
services and prices, and submits a request. The project is universal and can be customized for any company.

**Demo:** https://voiceguard-ai-beta.vercel.app/

The name reflects the three pillars of the project: **Voice** (voice) **Guard** (protection) **AI** (operator).

## Features

- **Voice and text.** Voice input (microphone → speech recognition) and voice-over responses.
Auto-stop recording on silence (VAD) — you can speak without holding the button.
- **No login required.** Chat opens immediately. History is stored locally in the browser, without a database.
- **Privacy (Guard).** Audio and chat messages are not stored on the server. Explicit consent for
microphone, "do not store history" mode, CORS restrictions, security headers.
- **Human in the loop.** When the AI ​​fails, the client leaves their name and phone number—the operator
receives a notification in Telegram with the context of the conversation.
- **Knowledge base.** The AI ​​responds based on the `knowledge.md` file, which the company populates
with its services, prices, and FAQs; it doesn't invent what's not in the file.
- **Website widget.** Embeds a floating chat button on any website with a single line of code.
- **Themes and languages.** Three design themes (gray / blue / white) and three interface and
response languages: RU / EN / KZ.
- **Minimalistic interface** based on pure HTML/CSS/JS, without frameworks or assembly.

## Technologies

- **Frontend:** a single `index.html` file (vanilla JS, no npm or build step).
- **Backend:** serverless functions in `api/` (Vercel Functions format, ESM).
- **LLM:** GROQ API (model `openai/gpt-oss-120b`).
- **Speech recognition (STT):** GROQ Whisper (`whisper-large-v3-turbo`).
- **TTS:** browser-based SpeechSynthesis.
- **Hosting:** Vercel.

## Structure

```
index.html Entire frontend: chat, voice, topics, languages, privacy
embed.js Embeddable chat widget for the company website
knowledge.md Company knowledge base (source of truth for AI)
api/chat.js Proxy to GROQ (text responses) + knowledge base + tickets
api/transcribe.js Speech recognition via GROQ Whisper
api/escalate.js Escalation to an operator (notification in Telegram)
api/geo.js Country detection for auto-language (CIS — Russian, otherwise English)
vercel.json Security headers
.env.example Example of environment variables
ROADMAP.md Work plan
```

## Company customization (knowledge base)

The AI ​​responds based on the `knowledge.md` file – fill it with information about your company
(services, prices, business hours, contacts, frequently asked questions) in plain text. What's not in the file –
the AI ​​doesn't make things up; it suggests submitting a ticket. After changing the file, redeploy the project.

## Widget on a company website

To add a chat button to someone else's website as a floating button, insert one line before `</body>`:

```html
<script src="https://voiceguard-ai-beta.vercel.app/embed.js" data-color="#2563eb"></script>
```

The `data-color` attribute (optional) sets the button color to match the company brand.

## Environment Variables

Set in Vercel settings (Environment Variables) or in `.env` for local running.
Secrets are not committed to the repository.

| Variable | Purpose | Required |
|---|---|---|
| `GROQ_API_KEY` | GROQ API key (chat and speech recognition) | Yes |
| `COMPANY_NAME` | Company name for AI prompt | No |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for ticket/escalation notifications | No |
| `TELEGRAM_CHAT_ID` | Chat/channel ID for notifications | No |
| `ALLOWED_ORIGINS` | Allowed origins for the API (CORS), comma-separated | No |

## Local Run

Static files can be accessed directly, but the `/api/*` endpoints and microphone only work in the Vercel environment (HTTPS). For full-fledged development:

```bash
npm i -g vercel
vercel dev
```

A `.env` file with `GROQ_API_KEY` is required (see `.env.example`).

## Deploy to Vercel

1. Connect the repository to Vercel (Import Project).
2. Add the environment variables from the table above.
3. Deploy. Stats and functions from `api/` will be automatically deployed.

## License

MIT.