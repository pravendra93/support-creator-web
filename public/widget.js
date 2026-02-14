/**
 * Assistra Chat Widget — v2 (Web3.0 Design)
 * Embeddable chat widget for client websites.
 *
 * Usage:
 *   <script
 *     src="https://dev.assistra.app/widget.js"
 *     data-api-key="sk_live_..."
 *     async>
 *   </script>
 */
(function () {
  "use strict";

  // ── Prevent double-init ───────────────────────────────────────────────
  if (window.__assistraWidgetLoaded) return;
  window.__assistraWidgetLoaded = true;

  // ── Read config from script tag ────────────────────────────────────────
  var scriptTag =
    document.currentScript ||
    (function () {
      var scripts = document.querySelectorAll('script[data-api-key]');
      return scripts[scripts.length - 1];
    })();

  var API_KEY = scriptTag && scriptTag.getAttribute("data-api-key");
  if (!API_KEY) {
    console.error("[Assistra Widget] Missing data-api-key attribute.");
    return;
  }

  // Allow explicit backend URL overrides for local development
  var BACKEND_URL_OVERRIDE = scriptTag.getAttribute("data-backend-url");
  var CHAT_URL_OVERRIDE = scriptTag.getAttribute("data-chat-url");

  // Derive API base from script src (production: api.dev.assistra.app)
  var scriptSrc = scriptTag.src || "";
  var urlObj;
  try { urlObj = new URL(scriptSrc); } catch (e) { urlObj = null; }

  var BACKEND_BASE;
  if (BACKEND_URL_OVERRIDE) {
    BACKEND_BASE = BACKEND_URL_OVERRIDE.replace(/\/$/, "");
  } else if (urlObj) {
    BACKEND_BASE = urlObj.protocol + "//api." + urlObj.host;
  } else {
    BACKEND_BASE = "";
  }

  var CHAT_API_BASE = CHAT_URL_OVERRIDE ? CHAT_URL_OVERRIDE.replace(/\/$/, "") : BACKEND_BASE;

  // ── State ──────────────────────────────────────────────────────────────
  var state = {
    isOpen: false,
    isLoading: true,
    isInitError: false,
    isSending: false,
    sessionId: null,
    messages: [],
    config: null,
    branding: null,
  };

  // ── DOM references ─────────────────────────────────────────────────────
  var host, shadow, container;

  // ── Initialization ─────────────────────────────────────────────────────
  function init() {
    host = document.createElement("div");
    host.id = "assistra-widget-host";
    host.style.cssText = "position:fixed;bottom:0;right:0;z-index:2147483647;";
    document.body.appendChild(host);
    shadow = host.attachShadow({ mode: "open" });

    // Google Fonts
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    shadow.appendChild(link);

    var style = document.createElement("style");
    style.textContent = getStyles();
    shadow.appendChild(style);

    container = document.createElement("div");
    container.id = "aw-root";
    shadow.appendChild(container);

    fetchWidgetConfig();
  }

  // ── Fetch config ───────────────────────────────────────────────────────
  function fetchWidgetConfig() {
    state.isLoading = true;
    render();

    var domain = window.location.hostname;
    var url = BACKEND_BASE + "/v1/widget/init-by-key?key=" + encodeURIComponent(API_KEY) + "&domain=" + encodeURIComponent(domain);

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data.status === "disabled") {
          host.style.display = "none";
          return;
        }
        state.config = data.chatbot || {};
        state.branding = data.branding || {};
        state.isLoading = false;
        state.isInitError = false;

        var welcomeMsg = state.config.welcome_message || state.branding.welcome_message || "Hey there! 👋 How can I help you today?";
        state.messages = [{ role: "assistant", text: welcomeMsg }];

        updateDynamicStyles();
        render();
      })
      .catch(function (err) {
        console.error("[Assistra Widget] Init failed:", err);
        state.isLoading = false;
        state.isInitError = true;
        state.config = {
          name: "AI Assistant",
          primary_color: "#6366f1",
          background_color: "#0f0f1a",
          position: "bottom-right",
        };
        state.messages = [{ role: "assistant", text: "Hey there! 👋 How can I help you today?" }];
        render();
      });
  }

  // ── Send message ───────────────────────────────────────────────────────
  function sendMessage(text) {
    if (!text.trim() || state.isSending) return;

    state.messages.push({ role: "user", text: text.trim() });
    state.isSending = true;
    render();
    scrollToBottom();

    var payload = { query: text.trim() };
    if (state.sessionId) payload.session_id = state.sessionId;

    fetch(CHAT_API_BASE + "/v1/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        state.sessionId = data.session_id || state.sessionId;
        state.messages.push({ role: "assistant", text: data.answer || data.reply || "I couldn't process that. Please try again." });
        state.isSending = false;
        render();
        scrollToBottom();
      })
      .catch(function (err) {
        console.error("[Assistra Widget] Chat error:", err);
        state.messages.push({ role: "assistant", text: "Oops! Something went wrong. Please try again." });
        state.isSending = false;
        render();
        scrollToBottom();
      });
  }

  // ── Toggle ─────────────────────────────────────────────────────────────
  function toggleChat() {
    state.isOpen = !state.isOpen;
    render();
    if (state.isOpen) {
      setTimeout(scrollToBottom, 100);
      setTimeout(function () {
        var input = shadow.querySelector("#aw-input");
        if (input) input.focus();
      }, 200);
    }
  }

  function scrollToBottom() {
    var msgs = shadow.querySelector("#aw-messages");
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Dynamic style updates ──────────────────────────────────────────────
  function updateDynamicStyles() {
    var pc = (state.config && state.config.primary_color) || "#6366f1";
    var existingDynamic = shadow.querySelector("#aw-dynamic-styles");
    if (existingDynamic) existingDynamic.remove();

    // Compute a lighter tint for gradients
    var s = document.createElement("style");
    s.id = "aw-dynamic-styles";
    s.textContent =
      ':host { --aw-primary: ' + pc + '; }' +
      '#aw-fab { background: linear-gradient(135deg, ' + pc + ' 0%, ' + shiftColor(pc, 40) + ' 50%, ' + shiftColor(pc, 80) + ' 100%) !important; }' +
      '#aw-header { background: linear-gradient(135deg, ' + pc + ' 0%, ' + shiftColor(pc, 30) + ' 50%, ' + shiftColor(pc, 60) + ' 100%) !important; }' +
      '#aw-send-btn { background: linear-gradient(135deg, ' + pc + ', ' + shiftColor(pc, 40) + ') !important; }' +
      '.aw-msg-user .aw-msg-bubble { background: linear-gradient(135deg, ' + pc + ', ' + shiftColor(pc, 30) + ') !important; }' +
      '.aw-input-wrapper:focus-within { border-color: ' + pc + '; box-shadow: 0 0 0 3px ' + pc + '22, 0 0 20px ' + pc + '15; }' +
      '.aw-typing-dot { background: ' + pc + ' !important; }';
    shadow.appendChild(s);
  }

  // Shift hue of a hex color
  function shiftColor(hex, degrees) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    h = ((h * 360 + degrees) % 360) / 360;

    function hue2rgb(p, q, t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    var rr, gg, bb;
    if (s === 0) { rr = gg = bb = l; }
    else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      rr = hue2rgb(p, q, h + 1 / 3);
      gg = hue2rgb(p, q, h);
      bb = hue2rgb(p, q, h - 1 / 3);
    }
    return '#' +
      Math.round(rr * 255).toString(16).padStart(2, '0') +
      Math.round(gg * 255).toString(16).padStart(2, '0') +
      Math.round(bb * 255).toString(16).padStart(2, '0');
  }

  // ── Escape HTML ────────────────────────────────────────────────────────
  function esc(str) {
    var d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Time helper ────────────────────────────────────────────────────────
  function getTimeString() {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
  }

  // ── Render ─────────────────────────────────────────────────────────────
  function render() {
    if (!container) return;
    var pc = (state.config && state.config.primary_color) || "#6366f1";
    var name = (state.config && state.config.name) || (state.branding && state.branding.brand_name) || "AI Assistant";
    var logoUrl = (state.config && state.config.logo_url) || (state.branding && state.branding.logo_url);
    var position = (state.config && state.config.position) || "bottom-right";

    var positionStyle = position === "bottom-left"
      ? "left: 24px; right: auto;"
      : "right: 24px; left: auto;";

    var fabPositionStyle = position === "bottom-left"
      ? "left: 24px; right: auto;"
      : "right: 24px; left: auto;";

    // Build messages HTML
    var msgsHtml = "";
    for (var i = 0; i < state.messages.length; i++) {
      var m = state.messages[i];
      var isUser = m.role === "user";
      msgsHtml +=
        '<div class="aw-msg ' + (isUser ? "aw-msg-user" : "aw-msg-assistant") + '">' +
        (isUser ? '' : '<div class="aw-msg-avatar">' + (logoUrl ? '<img src="' + esc(logoUrl) + '" alt="" />' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>') + '</div>') +
        '<div class="aw-msg-content">' +
        '<div class="aw-msg-bubble">' + esc(m.text) + '</div>' +
        '</div>' +
        '</div>';
    }

    // Typing indicator
    if (state.isSending) {
      msgsHtml +=
        '<div class="aw-msg aw-msg-assistant">' +
        '<div class="aw-msg-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div>' +
        '<div class="aw-msg-content">' +
        '<div class="aw-msg-bubble aw-typing">' +
        '<div class="aw-typing-dots">' +
        '<span class="aw-typing-dot"></span>' +
        '<span class="aw-typing-dot"></span>' +
        '<span class="aw-typing-dot"></span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    }

    // Avatar for header
    var avatarHtml = logoUrl
      ? '<img src="' + esc(logoUrl) + '" alt="" class="aw-header-avatar" />'
      : '<div class="aw-header-avatar-default"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg></div>';

    var html = '';

    // Chat window
    if (state.isOpen) {
      html +=
        '<div id="aw-window" style="' + positionStyle + '">' +
        // Animated mesh background overlay
        '<div class="aw-mesh-bg"></div>' +
        // Header
        '<div id="aw-header">' +
        '<div class="aw-header-left">' +
        avatarHtml +
        '<div class="aw-header-info">' +
        '<div class="aw-header-name">' + esc(name) + '</div>' +
        '<div class="aw-header-status">' +
        '<span class="aw-status-pulse"></span>' +
        '<span>Online now</span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<button id="aw-close" aria-label="Close chat">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '</div>' +
        // Messages
        '<div id="aw-messages">' + msgsHtml + '</div>' +
        // Input area
        '<div id="aw-input-area">' +
        '<div class="aw-input-wrapper">' +
        '<input type="text" id="aw-input" placeholder="Ask me anything..." autocomplete="off" />' +
        '<button id="aw-send-btn" aria-label="Send message">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>' +
        '</button>' +
        '</div>' +
        '<div class="aw-footer">' +
        '<span class="aw-footer-text">Powered by</span>' +
        '<a href="https://assistra.app" target="_blank" rel="noopener" class="aw-footer-link">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>' +
        'Assistra' +
        '</a>' +
        '</div>' +
        '</div>' +
        '</div>';
    }

    // FAB
    html +=
      '<button id="aw-fab" style="' + fabPositionStyle + '" aria-label="' + (state.isOpen ? 'Close' : 'Open') + ' chat">' +
      '<div class="aw-fab-glow"></div>' +
      (state.isOpen
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>'
      ) +
      (!state.isOpen ? '<span class="aw-fab-badge"></span>' : '') +
      '</button>';

    container.innerHTML = html;

    // Bind events
    var fab = shadow.querySelector("#aw-fab");
    if (fab) fab.addEventListener("click", toggleChat);

    var closeBtn = shadow.querySelector("#aw-close");
    if (closeBtn) closeBtn.addEventListener("click", toggleChat);

    var input = shadow.querySelector("#aw-input");
    var sendBtn = shadow.querySelector("#aw-send-btn");

    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage(input.value);
          input.value = "";
        }
      });
    }
    if (sendBtn && input) {
      sendBtn.addEventListener("click", function () {
        sendMessage(input.value);
        input.value = "";
      });
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────
  function getStyles() {
    return '\
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");\
      \
      :host {\
        --aw-primary: #6366f1;\
        --aw-dark: #0c0c1d;\
        --aw-dark-2: #12122a;\
        --aw-dark-3: #1a1a3e;\
        --aw-surface: #16163a;\
        --aw-surface-2: #1e1e4a;\
        --aw-border: rgba(255,255,255,0.06);\
        --aw-text: #e8e8f0;\
        --aw-text-dim: #8888a8;\
        --aw-radius: 20px;\
      }\
      \
      *, *::before, *::after {\
        box-sizing: border-box;\
        margin: 0;\
        padding: 0;\
      }\
      \
      /* ═══════════════════════════════════════ FAB ═══════════════════════════ */\
      #aw-fab {\
        position: fixed;\
        bottom: 24px;\
        width: 62px;\
        height: 62px;\
        border-radius: 50%;\
        border: none;\
        cursor: pointer;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        color: #fff;\
        z-index: 2147483647;\
        transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;\
        box-shadow:\
          0 4px 24px rgba(99,102,241,0.4),\
          0 0 0 0 rgba(99,102,241,0.3);\
        font-family: "Inter", system-ui, -apple-system, sans-serif;\
        overflow: visible;\
        animation: aw-fab-entrance 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards;\
      }\
      @keyframes aw-fab-entrance {\
        from { transform: scale(0) rotate(-90deg); opacity: 0; }\
        to   { transform: scale(1) rotate(0deg); opacity: 1; }\
      }\
      #aw-fab:hover {\
        transform: scale(1.08) translateY(-2px);\
        box-shadow:\
          0 8px 32px rgba(99,102,241,0.5),\
          0 0 60px rgba(99,102,241,0.15);\
      }\
      #aw-fab:active { transform: scale(0.95); }\
      \
      .aw-fab-glow {\
        position: absolute;\
        inset: -4px;\
        border-radius: 50%;\
        background: inherit;\
        opacity: 0.35;\
        filter: blur(12px);\
        z-index: -1;\
        animation: aw-glow-pulse 3s ease-in-out infinite;\
      }\
      @keyframes aw-glow-pulse {\
        0%, 100% { opacity: 0.3; transform: scale(1); }\
        50% { opacity: 0.5; transform: scale(1.15); }\
      }\
      \
      .aw-fab-badge {\
        position: absolute;\
        top: -2px;\
        right: -2px;\
        width: 14px;\
        height: 14px;\
        background: #22c55e;\
        border-radius: 50%;\
        border: 2.5px solid #0c0c1d;\
        animation: aw-badge-pulse 2s infinite;\
      }\
      @keyframes aw-badge-pulse {\
        0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }\
        50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }\
      }\
      \
      /* ═══════════════════════════════ CHAT WINDOW ═══════════════════════════ */\
      #aw-window {\
        position: fixed;\
        bottom: 100px;\
        width: 400px;\
        max-width: calc(100vw - 24px);\
        height: 580px;\
        max-height: calc(100vh - 130px);\
        border-radius: var(--aw-radius);\
        overflow: hidden;\
        display: flex;\
        flex-direction: column;\
        background: var(--aw-dark);\
        border: 1px solid var(--aw-border);\
        box-shadow:\
          0 25px 80px rgba(0,0,0,0.5),\
          0 0 0 1px rgba(255,255,255,0.04),\
          0 0 80px rgba(99,102,241,0.08);\
        animation: aw-window-in 0.45s cubic-bezier(0.34,1.56,0.64,1);\
        z-index: 2147483646;\
        font-family: "Inter", system-ui, -apple-system, sans-serif;\
      }\
      @keyframes aw-window-in {\
        from { opacity: 0; transform: translateY(24px) scale(0.92); }\
        to   { opacity: 1; transform: translateY(0) scale(1); }\
      }\
      \
      /* Mesh gradient bg */\
      .aw-mesh-bg {\
        position: absolute;\
        top: 0; left: 0; right: 0;\
        height: 200px;\
        pointer-events: none;\
        z-index: 0;\
        opacity: 0.07;\
        background:\
          radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%),\
          radial-gradient(circle at 80% 30%, #a855f7 0%, transparent 50%),\
          radial-gradient(circle at 50% 80%, #06b6d4 0%, transparent 50%);\
        animation: aw-mesh-float 8s ease-in-out infinite;\
      }\
      @keyframes aw-mesh-float {\
        0%, 100% { transform: translateY(0) scale(1); opacity: 0.07; }\
        50% { transform: translateY(-10px) scale(1.05); opacity: 0.12; }\
      }\
      \
      /* ═══════════════════════════════ HEADER ═══════════════════════════════ */\
      #aw-header {\
        padding: 20px 20px 18px;\
        display: flex;\
        align-items: center;\
        justify-content: space-between;\
        color: #fff;\
        flex-shrink: 0;\
        position: relative;\
        z-index: 2;\
        border-bottom: 1px solid rgba(255,255,255,0.06);\
      }\
      #aw-header::after {\
        content: "";\
        position: absolute;\
        bottom: 0;\
        left: 20px;\
        right: 20px;\
        height: 1px;\
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);\
      }\
      .aw-header-left {\
        display: flex;\
        align-items: center;\
        gap: 14px;\
      }\
      .aw-header-avatar {\
        width: 42px;\
        height: 42px;\
        border-radius: 14px;\
        object-fit: cover;\
        border: 2px solid rgba(255,255,255,0.15);\
      }\
      .aw-header-avatar-default {\
        width: 42px;\
        height: 42px;\
        border-radius: 14px;\
        background: rgba(255,255,255,0.08);\
        backdrop-filter: blur(20px);\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        color: rgba(255,255,255,0.7);\
        border: 1px solid rgba(255,255,255,0.1);\
      }\
      .aw-header-name {\
        font-weight: 700;\
        font-size: 15px;\
        letter-spacing: -0.01em;\
        line-height: 1.2;\
      }\
      .aw-header-status {\
        font-size: 12px;\
        color: rgba(255,255,255,0.5);\
        display: flex;\
        align-items: center;\
        gap: 6px;\
        font-weight: 500;\
      }\
      .aw-status-pulse {\
        width: 7px;\
        height: 7px;\
        border-radius: 50%;\
        background: #22c55e;\
        display: inline-block;\
        position: relative;\
      }\
      .aw-status-pulse::after {\
        content: "";\
        position: absolute;\
        inset: -3px;\
        border-radius: 50%;\
        border: 1.5px solid #22c55e;\
        animation: aw-ring 2s infinite;\
      }\
      @keyframes aw-ring {\
        0% { transform: scale(0.8); opacity: 1; }\
        100% { transform: scale(1.6); opacity: 0; }\
      }\
      \
      #aw-close {\
        background: rgba(255,255,255,0.06);\
        border: 1px solid rgba(255,255,255,0.08);\
        color: rgba(255,255,255,0.5);\
        width: 34px;\
        height: 34px;\
        border-radius: 10px;\
        cursor: pointer;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        transition: all 0.2s;\
      }\
      #aw-close:hover {\
        background: rgba(255,255,255,0.1);\
        color: #fff;\
        border-color: rgba(255,255,255,0.15);\
      }\
      \
      /* ═══════════════════════════════ MESSAGES ════════════════════════════ */\
      #aw-messages {\
        flex: 1;\
        overflow-y: auto;\
        padding: 20px 16px;\
        display: flex;\
        flex-direction: column;\
        gap: 16px;\
        background: var(--aw-dark);\
        scroll-behavior: smooth;\
        position: relative;\
        z-index: 1;\
      }\
      #aw-messages::-webkit-scrollbar { width: 3px; }\
      #aw-messages::-webkit-scrollbar-track { background: transparent; }\
      #aw-messages::-webkit-scrollbar-thumb {\
        background: rgba(255,255,255,0.08);\
        border-radius: 10px;\
      }\
      \
      .aw-msg {\
        display: flex;\
        gap: 10px;\
        animation: aw-msg-in 0.4s cubic-bezier(0.34,1.56,0.64,1);\
      }\
      @keyframes aw-msg-in {\
        from { opacity: 0; transform: translateY(12px) scale(0.97); }\
        to   { opacity: 1; transform: translateY(0) scale(1); }\
      }\
      .aw-msg-user {\
        justify-content: flex-end;\
      }\
      .aw-msg-assistant {\
        justify-content: flex-start;\
      }\
      \
      .aw-msg-avatar {\
        width: 30px;\
        height: 30px;\
        border-radius: 10px;\
        background: var(--aw-surface-2);\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        flex-shrink: 0;\
        color: var(--aw-text-dim);\
        border: 1px solid var(--aw-border);\
        margin-top: 2px;\
      }\
      .aw-msg-avatar img {\
        width: 100%;\
        height: 100%;\
        border-radius: 10px;\
        object-fit: cover;\
      }\
      \
      .aw-msg-content {\
        max-width: 78%;\
      }\
      .aw-msg-bubble {\
        padding: 12px 16px;\
        font-size: 13.5px;\
        line-height: 1.6;\
        word-wrap: break-word;\
        white-space: pre-wrap;\
        letter-spacing: 0.01em;\
      }\
      .aw-msg-user .aw-msg-content {\
        max-width: 78%;\
      }\
      .aw-msg-user .aw-msg-bubble {\
        color: #fff;\
        border-radius: 16px 16px 4px 16px;\
        font-weight: 500;\
      }\
      .aw-msg-assistant .aw-msg-bubble {\
        background: var(--aw-surface);\
        color: var(--aw-text);\
        border-radius: 16px 16px 16px 4px;\
        border: 1px solid var(--aw-border);\
      }\
      \
      /* ── Typing indicator ── */\
      .aw-typing {\
        padding: 16px 20px !important;\
      }\
      .aw-typing-dots {\
        display: flex;\
        align-items: center;\
        gap: 4px;\
      }\
      .aw-typing-dot {\
        width: 7px;\
        height: 7px;\
        border-radius: 50%;\
        opacity: 0.5;\
        animation: aw-bounce 1.4s infinite;\
      }\
      .aw-typing-dot:nth-child(2) { animation-delay: 0.15s; }\
      .aw-typing-dot:nth-child(3) { animation-delay: 0.3s; }\
      @keyframes aw-bounce {\
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }\
        30% { transform: translateY(-5px); opacity: 1; }\
      }\
      \
      /* ═══════════════════════════════ INPUT AREA ═══════════════════════════ */\
      #aw-input-area {\
        padding: 14px 16px 12px;\
        background: var(--aw-dark-2);\
        border-top: 1px solid var(--aw-border);\
        flex-shrink: 0;\
        position: relative;\
        z-index: 1;\
      }\
      .aw-input-wrapper {\
        display: flex;\
        align-items: center;\
        gap: 8px;\
        background: var(--aw-surface);\
        border-radius: 14px;\
        padding: 4px 4px 4px 16px;\
        border: 1px solid var(--aw-border);\
        transition: all 0.3s ease;\
      }\
      #aw-input {\
        flex: 1;\
        border: none;\
        outline: none;\
        background: transparent;\
        font-size: 13.5px;\
        color: var(--aw-text);\
        padding: 10px 0;\
        font-family: "Inter", system-ui, -apple-system, sans-serif;\
        letter-spacing: 0.01em;\
      }\
      #aw-input::placeholder {\
        color: var(--aw-text-dim);\
      }\
      #aw-send-btn {\
        width: 36px;\
        height: 36px;\
        border-radius: 11px;\
        border: none;\
        cursor: pointer;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        color: #fff;\
        flex-shrink: 0;\
        transition: all 0.2s;\
      }\
      #aw-send-btn:hover {\
        filter: brightness(1.15);\
        transform: scale(1.05);\
      }\
      #aw-send-btn:active { transform: scale(0.9); }\
      \
      .aw-footer {\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        gap: 5px;\
        padding-top: 10px;\
      }\
      .aw-footer-text {\
        font-size: 11px;\
        color: var(--aw-text-dim);\
        opacity: 0.5;\
      }\
      .aw-footer-link {\
        font-size: 11px;\
        color: var(--aw-text-dim);\
        text-decoration: none;\
        font-weight: 600;\
        display: flex;\
        align-items: center;\
        gap: 3px;\
        opacity: 0.5;\
        transition: opacity 0.2s;\
      }\
      .aw-footer-link:hover {\
        opacity: 0.8;\
      }\
      \
      /* ═══════════════════════════════ MOBILE ═══════════════════════════════ */\
      @media (max-width: 480px) {\
        #aw-window {\
          width: calc(100vw - 16px);\
          height: calc(100dvh - 100px);\
          bottom: 88px;\
          left: 8px !important;\
          right: 8px !important;\
          border-radius: 16px;\
          max-height: calc(100dvh - 100px);\
        }\
        #aw-fab {\
          bottom: 16px;\
          width: 56px;\
          height: 56px;\
        }\
      }\
    ';
  }

  // ── Boot ───────────────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
