"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
    Loader2, Sparkles, Layout, MessageSquare, Zap, Target, Coins, Calendar,
    ChevronDown, X, CheckCircle2, XCircle, AlertTriangle,
    ArrowRight, Key, Bot, Settings, Play, Shield, Copy, Check, Lock,
    Monitor, Smartphone, Maximize2, RefreshCw, Send, Mic, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
// import { NoWorkspaceState } from "@/components/shared/no-workspace-state";
import { ChatBotConfig } from "@/components/chatbot/chatbot-config";
import { CreateApiKeyModal } from "@/components/api-keys/create-api-key-modal";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Tenant { id: string; name: string; }
interface ApiKeyItem { id: string; name: string; key: string; is_active: boolean; tenant_id?: string; }
type ReadinessStatus = "ready" | "partial" | "not_setup";
interface WorkspaceReadiness {
    tenant: Tenant;
    status: ReadinessStatus;
    hasApiKey: boolean;
    hasBotConfig: boolean;
    isSubscribed: boolean;
    apiKey?: string;
}

// ─── Dot indicator ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ReadinessStatus }) {
    const color = status === "ready" ? "bg-emerald-500" : status === "partial" ? "bg-amber-500" : "bg-red-500/60";
    return <div className={cn("w-2 h-2 rounded-full shrink-0", color, status !== "not_setup" && "animate-pulse")} />;
}

// ─── Main Component ──────────────────────────────────────────────────────────

function PreviewBotContent() {
    const { user } = useAuth();

    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState("");
    const [tempApiKey, setTempApiKey] = useState("");
    const [activeTab, setActiveTab] = useState<"intro" | "config" | "voice">("intro");

    const [workspaceReadiness, setWorkspaceReadiness] = useState<WorkspaceReadiness[]>([]);
    const [isCheckingReadiness, setIsCheckingReadiness] = useState(true);
    const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);
    const [isTenantSubscribed, setIsTenantSubscribed] = useState<boolean | null>(null);
    const [blobUrl, setBlobUrl] = useState<string>("");
    const [viewMode, setViewMode] = useState<"auto" | "desktop" | "mobile">("auto");
    const [refreshKey, setRefreshKey] = useState(0);
    const [keyValidationMessage, setKeyValidationMessage] = useState("");
    const [isAutoSelected, setIsAutoSelected] = useState(false);

    // Generate Blob URL for simulator to resolve CORS/Origin null issues
    useEffect(() => {
        if (!apiKey) {
            setBlobUrl("");
            return;
        }

        const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Chatbot Simulator</title>
    <style>
      html, body { height: 100% !important; width: 100% !important; margin: 0; padding: 0; background: transparent; overflow: visible !important; }
      #simulator-status { position: fixed; top: 10px; left: 10px; color: rgba(255,255,255,0.1); font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; pointer-events: none; z-index: 999; }
    </style>
    <script 
      src="https://assistra-widget-stage.sgp1.cdn.digitaloceanspaces.com/widget/loader.js" 
      data-api-key="${apiKey}"
      ${selectedTenantId ? `data-tenant-id="${selectedTenantId}"` : ""}
      async>
    </script>
    <script>
      // Synthetic resize trigger to force layout calculations for the widget (mimics DevTools opening)
      window.addEventListener('load', function() {
        var delays = [100, 500, 1000, 2000];
        delays.forEach(function(delay) {
          setTimeout(function() {
            window.dispatchEvent(new Event('resize'));
          }, delay);
        });
      });
    </script>
  </head>
  <body>
    <div id="simulator-status">SIMULATOR_ACTIVE</div>
  </body>
</html>`;

        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [apiKey, selectedTenantId, refreshKey]);

    const [keyValidationState, setKeyValidationState] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [isCreateApiKeyModalOpen, setIsCreateApiKeyModalOpen] = useState(false);
    const [isSnippetCopied, setIsSnippetCopied] = useState(false);

    // scroll-to-bottom dummy chat with typing animation
    const [chatMessages, setChatMessages] = useState([
        {
            role: "bot",
            text: "**Hi there! I'm RaKri AI.**\n\nI can help you build and deploy custom AI agents in minutes. How can I transform your business today?"
        },
        { role: "user", text: "I want to automate my support workload" },
        {
            role: "bot",
            text: "Excellent goal. Our automation systems typically achieve:\n\n• **70% reduction** in manual ticket volume\n• **<1s average** response time\n• **24/7 coverage** across all regions\n\nWould you like to see our pricing or discuss a specific use-case?"
        }
    ]);
    const [chatInput, setChatInput] = useState("");
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [chatbotConfig, setChatbotConfig] = useState<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const QUICK_ACTIONS = [
        { label: "Automate Workflows", text: "How can I automate our internal workflows?", icon: Zap },
        { label: "Reduce Costs", text: "How can AI help reduce my operational costs?", icon: Target },
        { label: "Support AI", text: "I want to improve our customer support with AI", icon: MessageSquare },
        { label: "Build AI Product", text: "Can you help me build a new AI-powered product?", icon: Sparkles },
        { label: "Pricing", text: "Show me the pricing plans", icon: Coins, hiddenFromStart: true },
        { label: "Book a Call", text: "I want to book a strategic call", icon: Calendar, link: "https://calendly.com/akshaykumar-ojha/30min", hiddenFromStart: true },
    ];

    // ── helpers ──────────────────────────────────────────────────────────────

    const updateApiKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem("simulator_api_key", key);
    };

    const getSnippet = () => {
        const url = process.env.NEXT_PUBLIC_WIDGET_URL ?? "http://localhost:8001/static/widget.js";
        return `<script\n  src="${url}"\n  data-api-key="${apiKey}"\n  async>\n</script>`;
    };

    const handleCopySnippet = () => {
        navigator.clipboard.writeText(getSnippet());
        setIsSnippetCopied(true);
        setTimeout(() => setIsSnippetCopied(false), 2000);
    };

    const handleChatSend = useCallback((overrideText?: string) => {
        const msg = overrideText || chatInput.trim();
        if (!msg) return;

        if (!overrideText) setChatInput("");
        setChatMessages(prev => [...prev, { role: "user", text: msg }]);
        setIsBotTyping(true);

        const delay = 1000 + Math.random() * 1000;
        setTimeout(() => {
            setIsBotTyping(false);
            const lower = msg.toLowerCase();
            let response = "**That's a strategic move.**\n\nRaKri AI allows you to scale at 10x velocity by automating high-frequency tasks:\n\n• **Auto-Resolution**: Handle common queries instantly.\n• **Context Sync**: Real-time knowledge retrieval.\n• **Human Handoff**: Intelligent escalation when needed.\n\nWould you like to see a **personalized demo** or explore our **pricing tiers**?";

            if (lower.includes("pricing")) {
                response = "**Our pricing is designed for scale.**\n\nWe offer three main tiers:\n\n1. **Essential ($49/mo)**: Perfect for startups.\n2. **Pro ($199/mo)**: Advanced orchestration for growing teams.\n3. **Enterprise**: Custom solutions for high-volume requirements.\n\nWould you like to **book a call** to find the absolute best fit for your workload?";
            } else if (lower.includes("automate")) {
                response = "**Automation is the engine of modern growth.**\n\nBy implementing RaKri AI, we can help you:\n\n• **Eliminate 60% of manual data entry**\n• **Sync cross-department communications**\n• **Trigger autonomous workflows** based on user intent.\n\nShall we look at some **specific use cases** next?";
            } else if (lower.includes("reduce costs") || lower.includes("cost")) {
                response = "**Efficiency leads directly to ROI.**\n\nOur partners typically see a 35% reduction in operational overhead within 90 days of implementation. This is achieved through instant response logic and intelligent triaging.\n\nShould I show you our **pricing calculator**?";
            } else if (lower.includes("support")) {
                response = "**AI-powered support is no longer optional.**\n\nWe provide <1s response times and 99% accuracy by pulling directly from your knowledge base. This reduces support stress and boosts NPS.\n\nWould you like to **see how the widget looks** on your site?";
            } else if (lower.includes("book a call") || lower.includes("reserve") || lower.includes("strategic call")) {
                response = "**I've opened our strategist's calendar for you!**\n\nOne of our experts will help you map out an AI roadmap specific to your data. Is there a particular challenge you'd like to solve in the next 30 days?";
                window.open("https://calendly.com/akshaykumar-ojha/30min", "_blank");
            }

            setChatMessages(prev => [...prev, { role: "bot", text: response }]);
        }, delay);
    }, [chatInput]);

    const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
        if (action.link && action.label === "Book a Call") {
            window.open(action.link, "_blank");
            handleChatSend(action.text);
        } else {
            handleChatSend(action.text);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isBotTyping]);

    const handleApiKeyModalOpen = async () => {
        try {
            const res = await fetch("/api/api-keys");
            if (res.ok) {
                const data = await res.json();
                const keys = Array.isArray(data) ? data : (data.items || []);
                if (keys.length === 0) { setIsCreateApiKeyModalOpen(true); return; }
            }
        } catch { /* noop */ }
        setIsKeyModalOpen(true);
    };

    const validateApiKey = useCallback(async (key: string) => {
        if (!key || key.length < 10) { setKeyValidationState("idle"); return; }
        setKeyValidationState("validating");
        try {
            const res = await fetch(`/api/widget/init-by-key?key=${key}`);
            if (res.ok) {
                const data = await res.json();
                if (data.tenant_id) {
                    setKeyValidationState("valid");
                    setSelectedTenantId(data.tenant_id);
                    return;
                }
            }
            if (selectedTenantId) { setKeyValidationState("valid"); return; }
            setKeyValidationState("invalid");
        } catch {
            if (selectedTenantId) { setKeyValidationState("valid"); return; }
            setKeyValidationState("invalid");
        }
    }, [selectedTenantId]);

    useEffect(() => {
        if (apiKey && keyValidationState !== "valid") validateApiKey(apiKey);
        else if (!apiKey) setKeyValidationState("idle");
    }, [apiKey, validateApiKey, keyValidationState]);

    useEffect(() => {
        if (!user) return;
        const check = async () => {
            setIsCheckingReadiness(true);
            try {
                const [tenantsRes, keysRes] = await Promise.all([fetch("/api/tenants"), fetch("/api/api-keys")]);
                let tenantsList: Tenant[] = [];
                let apiKeysList: ApiKeyItem[] = [];
                if (tenantsRes.ok) { tenantsList = await tenantsRes.json(); setTenants(tenantsList); }
                if (keysRes.ok) { const kd = await keysRes.json(); apiKeysList = Array.isArray(kd) ? kd : (kd.items || []); }

                const readiness: WorkspaceReadiness[] = await Promise.all(
                    tenantsList.map(async (t) => {
                        const tenantKeys = apiKeysList.filter(k => k.is_active && (k.tenant_id === t.id || !k.tenant_id));
                        let hasBotConfig = false;
                        let isSubscribed = false;
                        try {
                            const [cfgRes, tRes] = await Promise.all([
                                fetch(`/api/tenants/${t.id}/chatbot`),
                                fetch(`/api/tenants/${t.id}`)
                            ]);
                            if (cfgRes.ok) { const c = await cfgRes.json(); hasBotConfig = !!(c?.name || c?.id); }
                            if (tRes.ok) { const td = await tRes.json(); isSubscribed = !!(td.plan_id && td.status === "active"); }
                        } catch { /* noop */ }
                        const status: ReadinessStatus = tenantKeys.length > 0 && hasBotConfig ? "ready" : tenantKeys.length > 0 ? "partial" : "not_setup";
                        return { tenant: t, status, hasApiKey: tenantKeys.length > 0, hasBotConfig, isSubscribed, apiKey: tenantKeys[0]?.key };
                    })
                );

                setWorkspaceReadiness(readiness);
                const ready = readiness.filter(w => w.status === "ready");
                const lastId = localStorage.getItem("simulator_last_workspace");
                const savedKey = localStorage.getItem("simulator_api_key");

                let wsToSelect: WorkspaceReadiness | null = null;
                if (lastId) {
                    wsToSelect = readiness.find(w => w.tenant.id === lastId) ?? (ready[0] ?? readiness[0] ?? null);
                } else if (ready.length === 1) {
                    wsToSelect = ready[0];
                } else if (ready.length > 1) {
                    setShowWorkspaceSelector(true);
                } else if (readiness.length > 0) {
                    wsToSelect = readiness[0];
                }

                if (wsToSelect) {
                    setSelectedTenantId(wsToSelect.tenant.id);
                    setIsTenantSubscribed(wsToSelect.isSubscribed);
                    if (wsToSelect.apiKey) {
                        updateApiKey(wsToSelect.apiKey);
                        setTempApiKey(wsToSelect.apiKey);
                        setKeyValidationState("valid");
                    } else if (savedKey) {
                        updateApiKey(savedKey);
                        setTempApiKey(savedKey);
                        setKeyValidationState("valid");
                    }
                    localStorage.setItem("simulator_last_workspace", wsToSelect.tenant.id);
                }
            } catch (e) {
                console.error("Workspace readiness check failed", e);
            } finally {
                setIsCheckingReadiness(false);
            }
        };
        check();
    }, [user]);

    useEffect(() => {
        if (!selectedTenantId) return;
        const fetchConfig = async () => {
            try {
                const res = await fetch(`/api/tenants/${selectedTenantId}/chatbot`);
                if (res.ok) {
                    const config = await res.json();
                    setChatbotConfig(config);
                    if (config.welcome_message) {
                        setChatMessages([
                            { role: "bot", text: `**Hi — I can help you explore how ${config.name || "AI"} can improve your business.**\n\nHere are a few ways I can assist:` }
                        ]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch chatbot config", err);
            }
        };
        fetchConfig();
    }, [selectedTenantId]);

    if (isCheckingReadiness) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#080A10] text-white gap-6">
                <div className="relative">
                    <div className="absolute -inset-8 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500 relative z-10" />
                </div>
                <p className="text-sm text-slate-500 animate-pulse tracking-widest uppercase font-bold">Initializing Experience…</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#080A10] text-white overflow-hidden font-sans">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
                <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            <aside className="relative z-20 hidden lg:flex flex-col w-[360px] shrink-0 border-r border-white/5 bg-[#0B0D14]/80 backdrop-blur-2xl">
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-white leading-none tracking-tight">RaKri Premium</h1>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">AI Orchestration</p>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-4">
                    <div className="flex p-1 bg-white/5 rounded-2xl gap-1">
                        {([
                            { id: "intro", label: "Overview", icon: Zap },
                            { id: "config", label: "Settings", icon: Settings },
                            { id: "voice", label: "Audio", icon: Mic },
                        ] as const).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex-1 justify-center cursor-pointer",
                                    activeTab === tab.id
                                        ? "bg-white/10 text-white shadow-xl border border-white/10"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-white/2"
                                )}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-8 custom-scrollbar">
                    {activeTab === "intro" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Workspace Status</h3>
                                {selectedTenantId && tenants.length > 0 && (
                                    <div className="relative group">
                                        <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/50 to-purple-500/50 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
                                        <div className="relative bg-[#0D1117] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <StatusDot status={workspaceReadiness.find(w => w.tenant.id === selectedTenantId)?.status ?? "not_setup"} />
                                                <select
                                                    className="appearance-none bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer pr-8 outline-none border-none"
                                                    value={selectedTenantId}
                                                    onChange={e => {
                                                        const id = e.target.value;
                                                        const ws = workspaceReadiness.find(w => w.tenant.id === id);
                                                        setSelectedTenantId(id);
                                                        setIsTenantSubscribed(ws?.isSubscribed ?? null);
                                                        if (ws?.apiKey) { updateApiKey(ws.apiKey); setTempApiKey(ws.apiKey); setKeyValidationState("valid"); }
                                                        else { updateApiKey(""); setTempApiKey(""); setKeyValidationState("idle"); }
                                                        localStorage.setItem("simulator_last_workspace", id);
                                                    }}
                                                >
                                                    {tenants.map(t => <option key={t.id} value={t.id} className="bg-[#0D1117]">{t.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 w-4 h-4 text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Connection</h3>
                                <button
                                    onClick={handleApiKeyModalOpen}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group cursor-pointer",
                                        keyValidationState === "valid"
                                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                                            : "bg-white/5 border-white/10 text-slate-400 hover:border-indigo-500/30 hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {keyValidationState === "valid" ? <CheckCircle2 className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                                        <span className="text-sm font-bold">{keyValidationState === "valid" ? "Verified Key" : "Connect API Key"}</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                             {user?.email?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{user?.email ?? "Guest User"}</p>
                            <p className="text-[10px] text-slate-500">Developer Cloud</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-h-0 bg-[#05060B] relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                <header className="relative z-30 h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center p-0.5">
                            <div className="w-full h-full rounded-full bg-[#05060B] flex items-center justify-center overflow-hidden uppercase font-black text-[10px] text-indigo-400">
                                {chatbotConfig?.name?.[0] || <Bot className="w-5 h-5" />}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-black text-white tracking-tight">{chatbotConfig?.name || "RaKri AI Assistant"}</h2>
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/20 border border-white/5">
                            <button
                                onClick={() => setViewMode("auto")}
                                className={cn(
                                    "p-1 rounded transition-colors",
                                    viewMode === "auto" ? "bg-white/10 text-white" : "text-slate-600 hover:text-slate-400"
                                )}
                                title="Auto Resolution"
                            >
                                <Maximize2 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => setViewMode("desktop")}
                                className={cn(
                                    "p-1 rounded transition-colors",
                                    viewMode === "desktop" ? "bg-white/10 text-white" : "text-slate-600 hover:text-slate-400"
                                )}
                                title="Desktop"
                            >
                                <Monitor className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => setViewMode("mobile")}
                                className={cn(
                                    "p-1 rounded transition-colors",
                                    viewMode === "mobile" ? "bg-white/10 text-white" : "text-slate-600 hover:text-slate-400"
                                )}
                                title="Mobile"
                            >
                                <Smartphone className="w-3 h-3" />
                            </button>
                        </div>
                        <button
                            onClick={() => setRefreshKey(k => k + 1)}
                            className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all cursor-pointer"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {keyValidationState === "invalid" ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative z-20">
                            <div className="relative mb-6">
                                <div className="absolute -inset-6 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
                                <div className="relative w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <XCircle className="w-8 h-8 text-red-500" />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">Invalid API Key</h3>
                            <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed mb-6">
                                The API key could not be validated. Please check it and try again.
                            </p>
                            <button
                                onClick={() => setIsKeyModalOpen(true)}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                            >
                                <Key className="w-4 h-4" />
                                Update API Key
                            </button>
                        </div>
                    ) : (
                        <div className="relative flex-1 min-h-0 overflow-auto custom-scrollbar pb-20">
                             <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                            {isTenantSubscribed === false ? (
                                <div className="absolute inset-0 z-40 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-500">
                                    <div className="min-h-full flex flex-col items-center justify-center gap-6 px-6 sm:px-12 text-center py-12 sm:py-16 relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />

                                        <div className="relative group shrink-0">
                                            <div className="absolute -inset-8 rounded-full blur-[60px] opacity-20 bg-orange-500 animate-pulse"></div>
                                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-white/10 flex items-center justify-center shadow-2xl">
                                                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500 animate-bounce" />
                                            </div>
                                        </div>

                                        <div className="space-y-4 sm:space-y-6 max-w-sm sm:max-w-md mx-auto z-10">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Access Restricted</span>
                                            </div>
                                            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none uppercase">
                                                Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Locked</span>
                                            </h3>
                                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                                                This <strong className="text-white">Simulator Hub</strong> requires an active premium subscription.
                                            </p>
                                            <div className="pt-2 sm:pt-4 flex flex-col gap-3 w-full">
                                                <Button
                                                    asChild
                                                    className="w-full py-5 sm:py-6 bg-white text-[#0A0C12] hover:bg-slate-100 rounded-2xl font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                                >
                                                    <a href="/pages/billing">
                                                        Upgrade Now <ArrowRight className="w-4 h-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : blobUrl ? (
                                <iframe
                                    key={apiKey + refreshKey + selectedTenantId + viewMode}
                                    src={blobUrl}
                                    className="border-0 relative z-10 transition-all duration-500 shadow-2xl"
                                    style={{
                                        display: "block",
                                        width: viewMode === "desktop" ? "1200px" : viewMode === "mobile" ? "430px" : "100%",
                                        height: viewMode === "desktop" ? "800px" : viewMode === "mobile" ? "850px" : "100%",
                                        minHeight: viewMode === "auto" ? "750px" : "750px",
                                        transform: viewMode === "desktop"
                                            ? "scale(0.7)"
                                            : viewMode === "mobile"
                                                ? "scale(0.85)"
                                                : "none",
                                        transformOrigin: "top center",
                                        margin: viewMode === "auto" ? "0" : "40px auto",
                                        backgroundColor: "transparent",
                                        borderRadius: viewMode !== "auto" ? "24px" : "0",
                                    }}
                                    title="Chatbot Simulator"
                                />
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500/20" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <footer className="relative z-30 p-8 pt-0 mt-auto">
                    <div className="max-w-3xl mx-auto w-full space-y-6">
                        <div className="relative group p-1 rounded-full bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition duration-700" />
                            <div className="relative bg-[#13171F]/90 backdrop-blur-3xl border border-white/10 rounded-full flex items-center p-1.5 group-focus-within:border-indigo-500/50 group-focus-within:bg-[#13171F] transition-all shadow-2xl">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleChatSend()}
                                    placeholder="Ask how AI can transform your business..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 px-6 py-4 text-sm text-white placeholder:text-slate-600 outline-none font-medium"
                                />
                                <button
                                    onClick={() => handleChatSend()}
                                    disabled={!chatInput.trim() || isBotTyping}
                                    className={cn(
                                        "p-3.5 rounded-full transition-all duration-300 flex items-center justify-center",
                                        chatInput.trim() && !isBotTyping
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-100 hover:scale-110 active:scale-90 hover:bg-indigo-500 cursor-pointer"
                                            : "bg-white/5 text-slate-600 scale-95"
                                    )}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-center text-slate-600 font-medium">
                            Premium AI Assistant Preview • Adaptive Context Architecture
                        </p>
                    </div>
                </footer>
            </main>

            <Suspense fallback={null}>
                {showWorkspaceSelector && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowWorkspaceSelector(false)} />
                        <div className="relative w-full max-w-xl bg-[#0D1117] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                        <Bot className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">Select Workspace</h3>
                                        <p className="text-sm text-slate-500 font-medium">Choose a workspace to preview</p>
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    {workspaceReadiness.map(ws => (
                                        <button
                                            key={ws.tenant.id}
                                            onClick={() => {
                                                setSelectedTenantId(ws.tenant.id);
                                                setIsTenantSubscribed(ws.isSubscribed);
                                                if (ws.apiKey) { updateApiKey(ws.apiKey); setTempApiKey(ws.apiKey); setKeyValidationState("valid"); }
                                                localStorage.setItem("simulator_last_workspace", ws.tenant.id);
                                                setShowWorkspaceSelector(false);
                                            }}
                                            className="group w-full text-left p-5 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/5 hover:border-indigo-500/30 transition-all flex items-center gap-4 cursor-pointer"
                                        >
                                            <StatusDot status={ws.status} />
                                            <div className="flex-1">
                                                <p className="font-bold text-white text-sm">{ws.tenant.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Ready</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isKeyModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 fade-in duration-300">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsKeyModalOpen(false)} />
                        <div className="relative w-full max-w-md bg-[#0D1117] border border-white/10 rounded-3xl shadow-2xl p-8 space-y-8">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                    <Key className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight">Access Control</h3>
                                    <p className="text-slate-500 text-sm font-medium mt-2">Enter your Production API Key</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="relative group">
                                    <Zap className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="sk_live_..."
                                        value={tempApiKey}
                                        onChange={e => setTempApiKey(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && (setKeyValidationState("idle"), updateApiKey(tempApiKey), setIsKeyModalOpen(false))}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-mono text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => { setKeyValidationState("idle"); updateApiKey(tempApiKey); setIsKeyModalOpen(false); }}
                                        className="w-full bg-white text-[#080A10] hover:bg-slate-200 rounded-2xl py-4 font-black uppercase tracking-widest text-xs transition-all shadow-xl cursor-pointer"
                                    >
                                        Authorize Agent
                                    </button>
                                    <button onClick={() => setIsKeyModalOpen(false)} className="w-full bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl py-4 font-bold text-xs transition-all cursor-pointer">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <CreateApiKeyModal
                    isOpen={isCreateApiKeyModalOpen}
                    onClose={(createdKey) => {
                        setIsCreateApiKeyModalOpen(false);
                        if (createdKey) { setKeyValidationState("idle"); updateApiKey(createdKey); setTempApiKey(createdKey); }
                    }}
                    onSuccess={() => { }}
                    initialTenantId={selectedTenantId}
                />
            </Suspense>
        </div>
    );
}

export default function PreviewBotPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-[#080A10]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
        }>
            <PreviewBotContent />
        </Suspense>
    );
}
