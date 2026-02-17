/**
 * Assistra Chat Widget
 * Embeddable chat widget that connects to the Assistra backend.
 *
 * Usage:
 *   <script src="https://your-domain.com/widget.js" data-api-key="sk_live_..." async></script>
 *   
 *   OR (for preview without API Key):
 *   <script src="https://your-domain.com/widget.js" data-tenant-id="uuid..." async></script>
 *
 * Flow:
 *   1. Reads data-api-key OR data-tenant-id from the <script> tag
 *   2. Calls /v1/widget/init (or init-by-key) on the backend to get branding + ephemeral token
 *   3. Renders a floating chat bubble
 *   4. On click, opens a chat panel and sends messages to /v1/chat/ on the chat service
 */
(function () {
  "use strict";

  // ── Prevent double-init ──
  if (window.__assistraWidgetLoaded) return;
  window.__assistraWidgetLoaded = true;

  // ── Read config from script tag ──
  const scriptTag = document.currentScript || (function () {
    const scripts = document.getElementsByTagName("script");
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf("widget.js") !== -1) return scripts[i];
    }
    return null;
  })();

  if (!scriptTag) {
    console.error("[Assistra] Could not find widget script tag.");
    return;
  }

  const API_KEY = scriptTag.getAttribute("data-api-key");
  const TENANT_ID_ATTR = scriptTag.getAttribute("data-tenant-id");

  if (!API_KEY && !TENANT_ID_ATTR) {
    console.error("[Assistra] Missing data-api-key or data-tenant-id attribute on widget script tag.");
    return;
  }

  // Backend URLs – auto-detect from script src origin, or use data attributes
  const scriptOrigin = new URL(scriptTag.src).origin;
  const BACKEND_URL = scriptTag.getAttribute("data-backend-url") || scriptOrigin.replace(/:3000$/, ":8000");
  const CHAT_URL = scriptTag.getAttribute("data-chat-url") || scriptOrigin.replace(/:3000$/, ":8001");

  // ── State ──
  let isOpen = false;
  let sessionId = null;
  let branding = {};
  let ephemeralToken = null;
  let tenantId = TENANT_ID_ATTR || null;
  let messages = [];
  let isLoading = false;

  // ── Styles (Premium Web3 Theme) ──
  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

    #assistra-widget-container * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #assistra-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--assistra-primary, #6366f1);
      background-image: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
      z-index: 2147483646;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    #assistra-bubble:hover {
      transform: scale(1.05) translateY(-2px);
      box-shadow: 0 12px 40px rgba(99, 102, 241, 0.5);
    }

    #assistra-bubble svg {
      width: 30px;
      height: 30px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      transition: transform 0.3s ease;
    }

    #assistra-bubble.open svg.chat-icon {
      display: none;
    }

    #assistra-bubble.open svg.close-icon {
      display: block;
    }

    #assistra-bubble:not(.open) svg.close-icon {
      display: none;
    }

    #assistra-panel {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 400px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: calc(100vh - 140px);
      
      /* Dark Glass Background */
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 0 0 1px rgba(255, 255, 255, 0.05),
        0 24px 60px rgba(0, 0, 0, 0.6);
      
      border-radius: 24px;
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      
      color: #f8fafc;
    }

    #assistra-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .assistra-header {
      background: rgba(255, 255, 255, 0.03);
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
    }

    .assistra-header-avatar {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--assistra-primary, #6366f1), #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    .assistra-header-avatar svg {
      width: 24px;
      height: 24px;
    }

    .assistra-header-info h3 {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: #fff;
      margin: 0;
    }

    .assistra-header-info p {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
      font-weight: 500;
      margin-bottom: 0;
    }

    .assistra-messages {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: transparent;
    }

    .assistra-messages::-webkit-scrollbar {
      width: 6px;
    }

    .assistra-messages::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }

    .assistra-msg {
      max-width: 85%;
      padding: 14px 18px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.6;
      word-wrap: break-word;
      animation: assistra-fade-in 0.3s cubic-bezier(0.2, 0.9, 0.2, 1);
    }

    @keyframes assistra-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .assistra-msg.bot {
      align-self: flex-start;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: #e2e8f0;
      border-bottom-left-radius: 4px;
    }

    .assistra-msg.user {
      align-self: flex-end;
      background: linear-gradient(135deg, var(--assistra-primary, #6366f1) 0%, #8b5cf6 100%);
      color: white;
      border-bottom-right-radius: 4px;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
      border: 1px solid rgba(255,255,255,0.1);
    }

    .assistra-msg.typing {
      align-self: flex-start;
      background: rgba(30, 41, 59, 0.6);
      border-bottom-left-radius: 4px;
      padding: 16px 20px;
      display: flex;
      gap: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .assistra-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
      animation: assistra-bounce 1.4s infinite ease-in-out;
    }

    .assistra-dot:nth-child(2) { animation-delay: 0.16s; }
    .assistra-dot:nth-child(3) { animation-delay: 0.32s; }

    @keyframes assistra-bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    .assistra-input-area {
      padding: 20px;
      background: rgba(255, 255, 255, 0.02);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      gap: 12px;
      align-items: center;
      flex-shrink: 0;
    }

    .assistra-input-area input {
      flex: 1;
      padding: 14px 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 30px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
      background: rgba(0, 0, 0, 0.3);
      color: white;
    }

    .assistra-input-area input:focus {
      border-color: var(--assistra-primary, #6366f1);
      background: rgba(0, 0, 0, 0.5);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .assistra-input-area input::placeholder {
      color: #64748b;
    }

    .assistra-send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--assistra-primary, #6366f1), #8b5cf6);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .assistra-send-btn:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    }

    .assistra-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(0.5);
    }

    .assistra-send-btn svg {
      width: 20px;
      height: 20px;
    }

    .assistra-powered {
      text-align: center;
      padding: 10px;
      font-size: 11px;
      color: #64748b;
      background: transparent;
      flex-shrink: 0;
      letter-spacing: 0.02em;
    }

    .assistra-powered a {
      color: #94a3b8;
      text-decoration: none;
      font-weight: 600;
    }

    .assistra-powered a:hover {
      text-decoration: underline;
      color: white;
    }

    .assistra-error {
      padding: 12px 16px;
      background: rgba(220, 38, 38, 0.1);
      color: #f87171;
      font-size: 13px;
      text-align: center;
      border-top: 1px solid rgba(220, 38, 38, 0.2);
    }

    @media (max-width: 440px) {
      #assistra-panel {
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
        border: none;
      }
      #assistra-bubble {
        display: none;
      }
    }
  `;

  // ── Inject styles ──
  function injectStyles(primaryColor) {
    const style = document.createElement("style");
    style.id = "assistra-widget-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);

    document.documentElement.style.setProperty("--assistra-primary", primaryColor || "#000000");
  }

  // ── SVG Icons ──
  const CHAT_ICON = '<svg class="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  const CLOSE_ICON = '<svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  const SEND_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  const BOT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path><path d="M9 12h.01"></path><path d="M15 12h.01"></path></svg>';

  // ── Initialize widget ──
  async function initWidget() {
    try {
      let url;
      const hostname = window.location.hostname;
      const params = new URLSearchParams();

      if (hostname && hostname !== "localhost") {
        params.set("domain", hostname);
      }

      if (API_KEY) {
        params.set("key", API_KEY);
        url = `${BACKEND_URL}/v1/widget/init-by-key?${params.toString()}`;
      } else if (TENANT_ID_ATTR) {
        params.set("tenant_id", TENANT_ID_ATTR);
        url = `${BACKEND_URL}/v1/widget/init?${params.toString()}`;
      }

      const resp = await fetch(url);

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Init failed (${resp.status}): ${errText}`);
      }

      const data = await resp.json();
      branding = data.branding || {};
      ephemeralToken = data.ephemeral_token;
      // Capture tenantId if returned
      if (data.tenant_id) tenantId = data.tenant_id;
    } catch (err) {
      console.warn("[Assistra] Widget init failed, using defaults:", err.message);
      branding = {};
    }

    render();
  }

  // ── Render widget DOM ──
  function render() {
    const primaryColor = branding.primary_color || "#6366f1"; // Default to purple/blue if missing
    const brandName = branding.brand_name || "Support";
    const welcomeMsg = branding.welcome_message || "Hi! 👋 I'm your AI assistant. How can I help you today?";

    injectStyles(primaryColor);

    // Container
    const container = document.createElement("div");
    container.id = "assistra-widget-container";

    // Chat panel
    const panel = document.createElement("div");
    panel.id = "assistra-panel";
    panel.innerHTML = `
      <div class="assistra-header">
        <div class="assistra-header-avatar">${BOT_ICON}</div>
        <div class="assistra-header-info">
          <h3>${escapeHtml(brandName)}</h3>
          <p>Typically replies instantly</p>
        </div>
      </div>
      <div class="assistra-messages" id="assistra-messages"></div>
      <div class="assistra-input-area">
        <input type="text" id="assistra-input" placeholder="Type a message..." autocomplete="off" />
        <button class="assistra-send-btn" id="assistra-send" disabled>
          ${SEND_ICON}
        </button>
      </div>
      <div class="assistra-powered">
        Powered by <a href="https://assistra.app" target="_blank" rel="noopener">Assistra</a>
      </div>
    `;

    // Bubble
    const bubble = document.createElement("button");
    bubble.id = "assistra-bubble";
    bubble.innerHTML = CHAT_ICON + CLOSE_ICON;
    bubble.setAttribute("aria-label", "Open chat");

    container.appendChild(panel);
    container.appendChild(bubble);
    document.body.appendChild(container);

    // Add welcome message
    messages.push({ sender: "bot", text: welcomeMsg });
    renderMessages();

    // ── Event listeners ──
    bubble.addEventListener("click", toggleChat);

    const input = document.getElementById("assistra-input");
    const sendBtn = document.getElementById("assistra-send");

    input.addEventListener("input", function () {
      sendBtn.disabled = !this.value.trim();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && this.value.trim()) {
        sendMessage();
      }
    });

    sendBtn.addEventListener("click", sendMessage);
  }

  // ── Toggle chat ──
  function toggleChat() {
    isOpen = !isOpen;
    const panel = document.getElementById("assistra-panel");
    const bubble = document.getElementById("assistra-bubble");

    if (isOpen) {
      panel.classList.add("open");
      bubble.classList.add("open");
      bubble.setAttribute("aria-label", "Close chat");
      const input = document.getElementById("assistra-input");
      setTimeout(() => input && input.focus(), 300);
    } else {
      panel.classList.remove("open");
      bubble.classList.remove("open");
      bubble.setAttribute("aria-label", "Open chat");
    }
  }

  // ── Send message ──
  async function sendMessage() {
    const input = document.getElementById("assistra-input");
    const query = input.value.trim();
    if (!query || isLoading) return;

    input.value = "";
    document.getElementById("assistra-send").disabled = true;

    // Add user message
    messages.push({ sender: "user", text: query });
    renderMessages();

    // Show typing
    isLoading = true;
    renderMessages();

    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (API_KEY) headers["ASST-API-Key"] = API_KEY;
      if (ephemeralToken) headers["x-widget-token"] = ephemeralToken;

      const resp = await fetch(`${CHAT_URL}/v1/chat/`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          query: query,
          session_id: sessionId,
          tenant_id: tenantId
        })
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      sessionId = data.session_id;

      isLoading = false;
      // Support both 'answer' and 'reply'
      messages.push({ sender: "bot", text: data.answer || data.reply });
      renderMessages();

    } catch (err) {
      console.error("[Assistra] Chat error:", err);
      isLoading = false;
      messages.push({ sender: "bot", text: "Sorry, something went wrong. Please try again." });
      renderMessages();
    }
  }

  // ── Render messages ──
  function renderMessages() {
    const container = document.getElementById("assistra-messages");
    if (!container) return;

    let html = "";
    for (const msg of messages) {
      const cls = msg.sender === "user" ? "user" : "bot";
      html += `<div class="assistra-msg ${cls}">${escapeHtml(msg.text)}</div>`;
    }

    if (isLoading) {
      html += `<div class="assistra-msg typing">
        <div class="assistra-dot"></div>
        <div class="assistra-dot"></div>
        <div class="assistra-dot"></div>
      </div>`;
    }

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  // ── Escape HTML ──
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Boot ──
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWidget);
  } else {
    initWidget();
  }
})();
