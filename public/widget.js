/**
 * Assistra Chat Widget
 * Premium Web3 Design v17.0 - "The Web3 Connect"
 * 
 * Features:
 * - Ultra-Minimal Integrated Header (Brand Logo + Name)
 * - 3D Sphere Bot Avatars
 * - Vibrant Wallet-Style Bubbles
 * - Minimalist Pill Input with Integrated Send
 */
(function () {
  "use strict";

  if (window.__assistraWidgetLoaded) return;
  window.__assistraWidgetLoaded = true;

  const scriptTag = document.currentScript || (function () {
    const scripts = document.getElementsByTagName("script");
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.includes("widget.js")) return scripts[i];
    }
    return null;
  })();

  if (!scriptTag) return;

  const API_KEY = scriptTag.getAttribute("data-api-key");
  const TENANT_ID_ATTR = scriptTag.getAttribute("data-tenant-id");
  const scriptOrigin = new URL(scriptTag.src).origin;
  const BACKEND_URL = scriptTag.getAttribute("data-backend-url") || scriptOrigin.replace(/:3000$/, ":8000");
  const CHAT_URL = scriptTag.getAttribute("data-chat-url") || scriptOrigin.replace(/:3000$/, ":8001");

  let isOpen = false;
  let sessionId = null;
  let branding = {};
  let ephemeralToken = null;
  let tenantId = TENANT_ID_ATTR || null;

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

    #asst-web3-root {
      --primary-grad: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      --glass-bg: rgba(10, 10, 12, 0.65);
      --glass-border: 1px solid rgba(255, 255, 255, 0.08);
      --glass-blur: blur(20px);
      --neon-glow: 0 0 20px rgba(99, 102, 241, 0.4);
      --font-main: 'Sora', sans-serif;
      
      position: fixed;
      bottom: 0;
      right: 0;
      z-index: 2147483647;
      font-family: var(--font-main);
      -webkit-font-smoothing: antialiased;
    }

    #asst-web3-root * { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── FAB Trigger ── */
    #asst-web3-trigger {
      position: fixed;
      bottom: 32px;
      right: 32px;
      width: 64px;
      height: 64px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      z-index: 1000;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .asst-web3-orb {
      position: absolute;
      inset: 0;
      background: var(--primary-grad);
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(99, 102, 241, 0.6);
      transition: all 0.4s ease;
    }

    #asst-web3-trigger:hover .asst-web3-orb { 
      transform: scale(1.05) rotate(3deg); 
      box-shadow: 0 0 25px rgba(168, 85, 247, 0.6);
    }
    
    #asst-web3-trigger.open .asst-web3-orb { 
      transform: scale(0.9); 
      border-radius: 50%; 
      background: #1e1e24; 
    }

    .asst-web3-icon { position: relative; z-index: 2; width: 28px; height: 28px; color: white; transition: all 0.3s; }
    #asst-web3-trigger.open .asst-web3-icon { transform: rotate(90deg) scale(0); opacity: 0; }

    /* ── Chat Panel (Glassmorphism) ── */
    #asst-web3-panel {
      position: fixed;
      bottom: 110px;
      right: 32px;
      width: 400px;
      height: 700px;
      max-height: min(800px, calc(100vh - 140px));
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: var(--glass-border);
      border-radius: 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), var(--neon-glow);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px) scale(0.96);
      transform-origin: bottom right;
      transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    }

    #asst-web3-panel.open { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }

    /* ── Header ── */
    .asst-web3-header {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.01);
    }

    .asst-back-arrow {
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.2s;
    }
    .asst-back-arrow:hover { color: white; }

    .asst-brand-logo {
      width: 40px; height: 40px;
      background: var(--primary-grad);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .asst-brand-name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(to right, #ffffff 20%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 20px rgba(165, 180, 252, 0.3);
      flex: 1;
    }

    /* ── Messages ── */
    .asst-web3-body {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .asst-web3-body::-webkit-scrollbar { width: 4px; }
    .asst-web3-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    .asst-msg-group { display: flex; align-items: flex-end; gap: 12px; max-width: 85%; }
    .asst-bot-group { align-self: flex-start; }
    .asst-user-group { align-self: flex-end; justify-content: flex-end; max-width: 80%; }

    .asst-bot-sphere {
      width: 28px; height: 28px;
      background: var(--primary-grad);
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
    }

    .asst-bubble {
      padding: 14px 20px;
      font-size: 15px;
      line-height: 1.5;
      font-weight: 400;
      border-radius: 20px;
    }

    .asst-bot-bubble {
      background: linear-gradient(180deg, rgba(30, 30, 40, 0.8) 0%, rgba(20, 20, 25, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: #e2e8f0;
      border-bottom-left-radius: 4px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .asst-user-bubble {
      background: rgba(255, 255, 255, 0.08); /* New transparent glass style */
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }

    /* ── Footer ── */
    .asst-web3-footer {
      padding: 20px 24px 0 24px;
      background: rgba(0,0,0,0.2);
    }

    .asst-input-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 30px;
      padding: 4px;
      display: flex;
      align-items: center;
      transition: all 0.2s;
      margin-bottom: 16px;
      min-height: 48px;
    }
    .asst-input-pill:focus-within {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(99, 102, 241, 0.3);
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.1);
    }

    #asst-web3-input {
      flex: 1;
      background: transparent;
      border: none;
      color: white;
      font-size: 15px;
      font-family: inherit;
      outline: none;
      height: 100%;
      padding: 12px 20px;
    }
    #asst-web3-input::placeholder { color: rgba(255,255,255,0.3); }

    #asst-web3-send {
      width: 40px; height: 40px;
      background: var(--primary-grad);
      border-radius: 50%;
      border: none;
      color: white;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
      margin-right: 8px;
      flex-shrink: 0;
    }
    #asst-web3-send svg { width: 18px; height: 18px; fill: white; }
    #asst-web3-send:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5); }
    #asst-web3-send:active:not(:disabled) { transform: translateY(0); }
    #asst-web3-send:disabled { opacity: 0.5; filter: grayscale(1); cursor: not-allowed; }

    @media (max-width: 500px) {
      #asst-web3-panel { bottom: 0; right: 0; width: 100%; height: 100dvh; border-radius: 0; max-height: none; background: #050505; }
      #asst-web3-trigger { display: none; }
    }
  `;

  const ICONS = {
    chat: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>`,
    back: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>`,
    send: `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`
  };

  function injectStyles() {
    const id = "asst-web3-v17-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = STYLES;
    document.head.appendChild(style);
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async function initWidget() {
    try {
      let url;
      const hostname = window.location.hostname;
      const params = new URLSearchParams();
      if (hostname && hostname !== "localhost") params.set("domain", hostname);
      if (API_KEY) {
        params.set("key", API_KEY);
        url = `${BACKEND_URL}/v1/widget/init-by-key?${params.toString()}`;
      } else if (TENANT_ID_ATTR) {
        params.set("tenant_id", TENANT_ID_ATTR);
        url = `${BACKEND_URL}/v1/widget/init?${params.toString()}`;
      }
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        branding = data.branding || {};
        ephemeralToken = data.ephemeral_token;
        if (data.tenant_id) tenantId = data.tenant_id;
      }
    } catch (e) { }
    render();
  }

  function render() {
    const brandName = branding.brand_name || "DRILLO";
    const welcomeMsg = branding.welcome_message || "Gm!";

    injectStyles();

    const root = document.createElement("div");
    root.id = "asst-web3-root";

    root.innerHTML = `
      <div id="asst-web3-panel">
        <div class="asst-web3-header">
          <div class="asst-back-arrow" id="asst-back-btn">${ICONS.back}</div>
          <div class="asst-brand-logo"></div>
          <div class="asst-brand-name">${escapeHtml(brandName)}</div>
        </div>
        <div class="asst-web3-body" id="asst-messages">
          <div class="asst-msg-group asst-bot-group">
            <div class="asst-bot-sphere"></div>
            <div class="asst-bubble asst-bot-bubble">${escapeHtml(welcomeMsg)}</div>
          </div>
        </div>
        <div class="asst-web3-footer">
          <div class="asst-input-pill">
            <input type="text" id="asst-web3-input" placeholder="Aa" autocomplete="off">
            <button id="asst-web3-send" disabled>${ICONS.send}</button>
          </div>
        </div>
      </div>
      <button id="asst-web3-trigger">
        <div class="asst-web3-orb"></div>
        <div class="asst-web3-icon">${ICONS.chat}</div>
      </button>
    `;

    document.body.appendChild(root);

    const trigger = document.getElementById("asst-web3-trigger");
    const panel = document.getElementById("asst-web3-panel");
    const backBtn = document.getElementById("asst-back-btn");
    const input = document.getElementById("asst-web3-input");
    const sendBtn = document.getElementById("asst-web3-send");
    const scrollArea = document.getElementById("asst-messages");

    function toggle() {
      isOpen = !isOpen;
      panel.classList.toggle("open", isOpen);
      trigger.classList.toggle("open", isOpen);
      if (isOpen) setTimeout(() => input.focus(), 300);
    }

    trigger.onclick = toggle;
    backBtn.onclick = toggle;
    input.oninput = () => { sendBtn.disabled = !input.value.trim(); };
    input.onkeydown = (e) => { if (e.key === "Enter") handleSend(); };
    sendBtn.onclick = handleSend;

    async function handleSend() {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      sendBtn.disabled = true;
      appendMsg("user", text);
      try {
        const headers = { "Content-Type": "application/json" };
        if (API_KEY) headers["ASST-API-Key"] = API_KEY;
        if (ephemeralToken) headers["x-widget-token"] = ephemeralToken;
        const res = await fetch(`${CHAT_URL}/v1/chat/`, {
          method: "POST", headers,
          body: JSON.stringify({ query: text, session_id: sessionId, tenant_id: tenantId })
        });
        const data = await res.json();
        sessionId = data.session_id;
        appendMsg("bot", data.answer || data.reply);
      } catch (e) {
        setTimeout(() => appendMsg("bot", "I am currently processing your request..."), 500);
      }
    }

    function appendMsg(role, text) {
      const group = document.createElement("div");
      group.className = `asst-msg-group asst-${role}-group`;
      if (role === 'bot') {
        group.innerHTML = `<div class="asst-bot-sphere"></div><div class="asst-bubble asst-bot-bubble">${escapeHtml(text)}</div>`;
      } else {
        group.innerHTML = `<div class="asst-bubble asst-user-bubble">${escapeHtml(text)}</div>`;
      }
      scrollArea.appendChild(group);
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initWidget);
  else initWidget();
})();
