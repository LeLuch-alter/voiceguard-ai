# Voice AI

AI operator (voice and text chat assistant) for commercial companies. The client
opens the page, immediately enters the chat, and communicates with the AI ​​via voice or text: learns about
services and prices, and submits a request. This project is universal and harmful to any company.

**Demo:** https://voiceguard-ai-beta.vercel.app/

The project's three pillars are: **Voice** (voice) **Guard** (protection) **AI** (operator).

## Features

- **Voice and text.** Voice input (microphone → speech recognition) and voice-over responses.

Automatic recording stop on silence (VAD) — you can speak without holding down the button.
- **No login required.** Chat opens immediately. History is stored locally in the browser, without a database.
- **Privacy (Security).** Audio and messaging are region-independent. Explicit agreement on
microphone, "do not store history" mode, CORS restrictions, security headers.
- **Human in the loop.** If the AI ​​fails, the client leaves their name and phone number with the operator.

in Telegram with the context of the conversation.
- **Knowledge base.** The AI ​​responds based on the 'knowledge.md' file, which the company maintains.

with its services, prices, and FAQs; it doesn't invent what's not in the file.
- **Website widget.** Harm on any website is caused by clicking on a single line of code.
- **Themes and languages.** Three theme designs (gray/blue/white) and three language interfaces and
responses: RU/EN/KZ.
- **Minimalistic interface** with pure HTML/CSS/JS, no frames or assembly.

## Technologies

- **Frontend:** a single `index.html` file (vanilla JS, no npm or build step).
- **Backend:** serverless functions in `api/` (Vercel Functions format, ESM).
- **LLM:** GROQ API (model `openai/gpt-oss-120b`).
- **Speech recognition (STT):** GROQ Whisper ("whisper-big-v3-turbo").
- **TTS:** browser-based speech synthesis.
- **Hosting:** Vercel.

## Structure

```
index.html Entire frontend: chat, voice, topics, languages, privacy
embed.js Embeddable chat widget for the company website
Knowledge.md Company knowledge base (source of truth for AI)
api/chat.js Proxy to GROQ (text responses) + knowledge base + tickets
api/transcribe.js Speech recognition via GROQ Whisper
api/escalate.js Operator escalation (Telegram notification)
vercel.json Security headers
.env.example Environment usage example
ROADMAP.md Work plan
```

## Company customization (knowledge base)

AI is responsible for the basis of the `knowledge.md` file – fill it with information about your company
(services, prices, business hours, contacts, private questions) in plain text. What's not in the file?
I'm not making this up; I suggest you submit a request. After changing the file, redeploy the project.

## Widget on a company website

To add a chat button to someone else's website as a floating button, insert one line of text before the </body>:

```html
<script src="https://voiceguard-ai-beta.vercel.app/embed.js" data-color="#2563eb"></script>
```

The `data-color` attribute (optional) sets the color of the button, matching the company's branding.

## Environment Variables

Set as part of Vercel (environment variables) or in `.env` for local execution.
Secrets in repositories are not committed.

| Variable | Purpose | Required |
|---|---|---|
| `GROQ_API_KEY` | GROQ API key (chat and speech recognition) | Yes |
| `COMPANY_NAME` | Company name for Prompt II | No |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for ticket/escalation notifications | No |
| `TELEGRAM_CHAT_ID` | Chat/channel ID for registration | No |
| `ALLOWED_ORIGINS` | Allowed origins for the API (CORS), comma-separated | No |

## Local Run

Static files can be accessed directly, but the `/api/*` endpoints and microphone only work under the
Versel environment (HTTPS). For full-fledged development:

``` bash
npm i -g vercel
Versel developer
```

A `.env` file with `GROQ_API_KEY` is required (see `.env.example`).

## Deployment to Vercel

1. Connect the repository to Vercel (Import Project).
2. Add the environment variables from the table above.
3. Deploy. Stats and functions from `api/` are automatically picked up.

## License

Massachusetts Institute of Technology.
