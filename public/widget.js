/**
 * Assistra Chat Widget
 * Embeddable chat widget that connects to the Assistra backend.
 *
 * Usage:
 *   <script src="https://your-domain.com/widget.js" data-api-key="sk_live_..." async></script>
 *
 * Flow:
 *   1. Reads data-api-key from the <script> tag
 *   2. Calls /v1/widget/init on the backend to get branding + ephemeral token
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
    if (!API_KEY) {
        console.error("[Assistra] Missing data-api-key attribute on widget script tag.");
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
    let tenantId = null;
    let messages = [];
    let isLoading = false;

    // ── Styles ──
    const STYLES = `
    #assistra-widget-container * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }

    #assistra-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--assistra-primary, #000000);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      z-index: 2147483646;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    #assistra-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
    }

    #assistra-bubble svg {
      width: 28px;
      height: 28px;
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
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 520px;
      max-height: calc(100vh - 140px);
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(16px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    #assistra-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .assistra-header {
      background: var(--assistra-primary, #000000);
      color: white;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .assistra-header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .assistra-header-info h3 {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.2;
    }

    .assistra-header-info p {
      font-size: 12px;
      opacity: 0.8;
      margin-top: 2px;
    }

    .assistra-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8f9fa;
    }

    .assistra-messages::-webkit-scrollbar {
      width: 5px;
    }

    .assistra-messages::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 10px;
    }

    .assistra-msg {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      animation: assistra-fade-in 0.2s ease;
    }

    @keyframes assistra-fade-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .assistra-msg.bot {
      align-self: flex-start;
      background: white;
      color: #1a1a1a;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }

    .assistra-msg.user {
      align-self: flex-end;
      background: var(--assistra-primary, #000000);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .assistra-msg.typing {
      align-self: flex-start;
      background: white;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      display: flex;
      gap: 4px;
      padding: 14px 18px;
    }

    .assistra-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #aaa;
      animation: assistra-bounce 1.4s infinite ease-in-out;
    }

    .assistra-dot:nth-child(2) { animation-delay: 0.16s; }
    .assistra-dot:nth-child(3) { animation-delay: 0.32s; }

    @keyframes assistra-bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    .assistra-input-area {
      padding: 12px 16px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 8px;
      align-items: center;
      background: white;
      flex-shrink: 0;
    }

    .assistra-input-area input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #e0e0e0;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      background: #f8f9fa;
    }

    .assistra-input-area input:focus {
      border-color: var(--assistra-primary, #000000);
      background: white;
    }

    .assistra-input-area input::placeholder {
      color: #999;
    }

    .assistra-send-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--assistra-primary, #000000);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.2s;
    }

    .assistra-send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .assistra-send-btn svg {
      width: 18px;
      height: 18px;
    }

    .assistra-powered {
      text-align: center;
      padding: 6px;
      font-size: 11px;
      color: #aaa;
      background: white;
      flex-shrink: 0;
    }

    .assistra-powered a {
      color: #888;
      text-decoration: none;
    }

    .assistra-powered a:hover {
      text-decoration: underline;
    }

    .assistra-error {
      padding: 12px 16px;
      background: #fef2f2;
      color: #991b1b;
      font-size: 13px;
      text-align: center;
      border-top: 1px solid #fecaca;
    }

    @media (max-width: 440px) {
      #assistra-panel {
        right: 8px;
        bottom: 90px;
        width: calc(100vw - 16px);
        height: calc(100vh - 110px);
        border-radius: 12px;
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

    // ── Initialize widget ──
    async function initWidget() {
        try {
            // Call init-by-key which resolves tenant from API key
            const params = new URLSearchParams({ key: API_KEY });
            const hostname = window.location.hostname;
            if (hostname && hostname !== "localhost") {
                params.set("domain", hostname);
            }

            const resp = await fetch(`${BACKEND_URL}/v1/widget/init-by-key?${params.toString()}`);

            if (!resp.ok) {
                const errText = await resp.text();
                throw new Error(`Init failed (${resp.status}): ${errText}`);
            }

            const data = await resp.json();
            branding = data.branding || {};
            ephemeralToken = data.ephemeral_token;
            tenantId = data.tenant_id;
        } catch (err) {
            console.warn("[Assistra] Widget init failed, using defaults:", err.message);
            branding = {};
        }

        render();
    }

    // ── Render widget DOM ──
    function render() {
        const primaryColor = branding.primary_color || "#000000";
        const brandName = branding.brand_name || "Support";
        const welcomeMsg = branding.welcome_message || "Hi! 👋 How can I help you today?";

        injectStyles(primaryColor);

        // Container
        const container = document.createElement("div");
        container.id = "assistra-widget-container";

        // Chat panel
        const panel = document.createElement("div");
        panel.id = "assistra-panel";
        panel.innerHTML = `
      <div class="assistra-header">
        <div class="assistra-header-avatar">💬</div>
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
            const resp = await fetch(`${CHAT_URL}/v1/chat/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ASST-API-Key": API_KEY
                },
                body: JSON.stringify({
                    query: query,
                    session_id: sessionId
                })
            });

            if (!resp.ok) {
                const errText = await resp.text();
                throw new Error(errText || `HTTP ${resp.status}`);
            }

            const data = await resp.json();
            sessionId = data.session_id;

            isLoading = false;
            messages.push({ sender: "bot", text: data.answer });
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
