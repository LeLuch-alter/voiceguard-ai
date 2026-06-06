// VoiceGuard AI is an embeddable chat widget.
// Connect to the company's website in one line:
// <script src="https://voiceguard-ai-beta.vercel.app/embed.js" data-color="#2563eb"></script>
// A floating button will appear in the lower right corner; clicking it opens the chat.
(function () {
  if (window.__vgWidgetLoaded) return;
  window.__vgWidgetLoaded = true;

  var script = document.currentScript;
  var origin = '';
  try { origin = new URL(script.src).origin; } catch (e) { origin = ''; }
  var chatUrl = origin + '/?embed=1';
  var primary = (script && script.getAttribute('data-color')) || '#2563eb';

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  var css =
    '.vg-launcher{position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;background:' + primary + ';color:#fff;box-shadow:0 6px 24px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;z-index:2147483000;transition:transform .15s}' +
    '.vg-launcher:hover{transform:scale(1.06)}' +
    '.vg-launcher svg{width:26px;height:26px}' +
    '.vg-frame{position:fixed;bottom:88px;right:20px;width:390px;height:640px;max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);border:none;border-radius:18px;box-shadow:0 16px 48px rgba(0,0,0,.3);z-index:2147483000;display:none;background:#1f2124;overflow:hidden}' +
    '.vg-frame.vg-open{display:block;animation:vgUp .25s ease}' +
    '@keyframes vgUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}' +
    '@media(max-width:640px){.vg-frame{width:calc(100vw - 24px);height:calc(100vh - 96px);right:12px;bottom:78px}.vg-launcher{bottom:16px;right:16px}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var iframe = document.createElement('iframe');
  iframe.className = 'vg-frame';
  iframe.src = chatUrl;
  iframe.allow = 'microphone';
  iframe.title = 'VoiceGuard AI';
  document.body.appendChild(iframe);

  var btn = document.createElement('button');
  btn.className = 'vg-launcher';
  btn.setAttribute('aria-label', 'VoiceGuard AI');
  btn.innerHTML = ICON_CHAT;
  document.body.appendChild(btn);

  var open = false;
  btn.addEventListener('click', function () {
    open = !open;
    iframe.classList.toggle('vg-open', open);
    btn.innerHTML = open ? ICON_CLOSE : ICON_CHAT;
  });
})();
