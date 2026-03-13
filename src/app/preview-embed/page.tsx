"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useRef } from "react";
import { Loader2, MessageSquare, Mic, Send, Bot, User, Sparkles, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatbotSettings {
    name: string;
    welcome_message: string;
    is_active: boolean;
    primary_color: string;
    background_color: string;
    position: string;
    logo_url?: string;
}

interface Message {
    role: "user" | "bot";
    content: string;
}

function PreviewEmbedContent() {
    const searchParams = useSearchParams();
    const tenantIdInput = searchParams.get("tenant_id");
    const apiKeyInput = searchParams.get("api_key");
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"chat" | "audio">("chat");
    const [settings, setSettings] = useState<ChatbotSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tenantIdInput) setTenantId(tenantIdInput);
        if (apiKeyInput) setApiKey(apiKeyInput);
    }, [tenantIdInput, apiKeyInput]);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!tenantId && !apiKey) {
                setIsLoading(false);
                return;
            }
            try {
                let resolvedTenantId = tenantId;

                // Step 1: If we have an API key but no tenantId yet, fetch it
                if (apiKey && !resolvedTenantId) {
                    const initRes = await fetch(`/api/widget/init-by-key?key=${apiKey}`);
                    if (initRes.ok) {
                        const initData = await initRes.json();
                        if (initData.tenant_id) {
                            resolvedTenantId = initData.tenant_id;
                            setTenantId(initData.tenant_id);
                        }
                    }
                }

                // Step 2: Fetch chatbot config using the tenantId
                if (resolvedTenantId) {
                    const res = await fetch(`/api/chatbots/tenants/${resolvedTenantId}/chatbot`);
                    if (res.ok) {
                        const data = await res.json();
                        let chatbotData = data.id ? data : (data.branding || data);

                        if (chatbotData.brand_name && !chatbotData.name) {
                            chatbotData.name = chatbotData.brand_name;
                        }

                        setSettings(chatbotData);

                        setMessages(prev => {
                            if (chatbotData.welcome_message && prev.length === 0) {
                                return [{ role: "bot", content: chatbotData.welcome_message }];
                            } else if (chatbotData.welcome_message && prev.length === 1 && prev[0].role === "bot") {
                                return [{ role: "bot", content: chatbotData.welcome_message }];
                            }
                            return prev;
                        });
                    } else {
                        setSettings(null);
                    }
                } else if (apiKey) {
                    // Fallback to init response if tenant resolution didn't yield a tenant ID
                    const initRes = await fetch(`/api/widget/init-by-key?key=${apiKey}`);
                    if (initRes.ok) {
                        const data = await initRes.json();
                        let chatbotData = data.id ? data : (data.branding || data);
                        if (chatbotData.brand_name && !chatbotData.name) {
                            chatbotData.name = chatbotData.brand_name;
                        }

                        // Check if it really has chatbot data before setting
                        if (chatbotData && (chatbotData.name || chatbotData.primary_color)) {
                            setSettings(chatbotData);
                            setMessages(prev => {
                                if (chatbotData.welcome_message && prev.length === 0) {
                                    return [{ role: "bot", content: chatbotData.welcome_message }];
                                }
                                return prev;
                            });
                        } else {
                            setSettings(null);
                        }
                    } else {
                        setSettings(null);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                setSettings(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [tenantId, apiKey]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isTyping, isChatOpen]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;
        if (!tenantId && !apiKey) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsTyping(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    api_key: apiKey,
                    query: userMsg,
                    session_id: "preview-" + (tenantId || apiKey),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: "bot", content: data.reply || data.answer }]);
            } else {
                setMessages(prev => [...prev, { role: "bot", content: "I'm sorry, I'm having trouble connecting right now." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", content: "Something went wrong. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0A0C12] text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!tenantId && !apiKey) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0A0C12] text-slate-500 space-y-4">
                <Bot className="w-16 h-16 opacity-50 text-indigo-500" />
                <h3 className="text-xl font-bold text-white tracking-tight uppercase">Missing Credentials</h3>
                <p className="max-w-md text-center text-sm opacity-80">
                    Please provide a valid API key or Tenant ID to preview the chatbot.
                </p>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0A0C12] text-slate-500 space-y-6 p-8">
                <div className="relative">
                    <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
                    <Bot className="w-16 h-16 text-indigo-400 relative z-10 opacity-60" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-white tracking-tight uppercase">Setting Up Your Bot</h3>
                    <p className="max-w-sm text-center text-sm text-slate-400 leading-relaxed">
                        Your chatbot configuration is being prepared. Please ensure your workspace has a bot configured in the Bot Config tab.
                    </p>
                </div>
                <div className="flex flex-col gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-pulse" />
                        <span>Verifying API key connection</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-pulse" style={{ animationDelay: '0.3s' }} />
                        <span>Loading workspace settings</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-pulse" style={{ animationDelay: '0.6s' }} />
                        <span>Initializing bot configuration</span>
                    </div>
                </div>
            </div>
        );
    }

    const primaryColor = settings?.primary_color || "#6366f1";
    const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:3000/widget.js";

    return (
        <div className="relative min-h-screen w-full bg-[#0A0C12] flex flex-col items-center justify-center font-sans overflow-hidden p-4 sm:p-8">
            {/* Background Decorative Elements - Aurora Effect */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-25%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-500/10 blur-[100px] animate-aurora-1"></div>
                <div className="absolute bottom-[-25%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-500/10 blur-[100px] animate-aurora-2"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            </div>

            {/* Main Simulator Container */}
            <div className={cn(
                "z-10 w-full transition-all duration-700 ease-in-out flex flex-col overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)]",
                isChatOpen
                    ? "h-screen max-w-none rounded-none bg-[#0D1117]"
                    : "max-w-2xl h-[80vh] bg-[#13171F]/80 backdrop-blur-3xl border border-white/10 rounded-[32px]"
            )}>

                {/* Simulator Layout when Open */}
                {isChatOpen ? (
                    <div className="flex-1 flex flex-col h-full relative">
                        {/* Internal Chat UI */}
                        <div className="flex flex-col h-full bg-[#0D1117]">
                            {/* Header */}
                            <div
                                className="px-6 py-4 flex items-center justify-between border-b border-white/5 shadow-2xl z-20"
                                style={{ backgroundColor: `${primaryColor}15`, borderBottomColor: `${primaryColor}30` }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, #4f46e5)` }}>
                                            {settings?.logo_url ? (
                                                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <Bot className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0D1117] rounded-full animate-pulse"></div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white tracking-tight uppercase text-sm">{settings?.name || "Assistant"}</h4>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Protocol Active</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsChatOpen(false)}
                                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {messages.map((msg, i) => (
                                    <div key={i} className={cn(
                                        "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300",
                                        msg.role === "user" ? "items-end" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "max-w-[85%] px-5 py-3 rounded-[24px] text-sm leading-relaxed shadow-xl",
                                            msg.role === "user"
                                                ? "bg-indigo-600 text-white rounded-tr-none font-medium"
                                                : "bg-[#1A1F2E] border border-white/5 text-slate-200 rounded-tl-none"
                                        )}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[9px] text-slate-600 mt-2 font-black uppercase tracking-widest px-1">
                                            {msg.role === "user" ? "Authorized User" : (settings?.name || "Support Assistant")}
                                        </span>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex flex-col items-start animate-in fade-in duration-300">
                                        <div className="bg-[#1A1F2E] border border-white/5 px-5 py-3 rounded-[24px] rounded-tl-none">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: primaryColor }}></div>
                                                <div className="w-1.5 h-1.5 rounded-full animate-bounce delay-150" style={{ backgroundColor: primaryColor }}></div>
                                                <div className="w-1.5 h-1.5 rounded-full animate-bounce delay-300" style={{ backgroundColor: primaryColor }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>

                            {/* Input */}
                            <div className="p-6 pt-2">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" style={{ backgroundColor: `${primaryColor}30` }}></div>
                                    <div className="relative flex items-center bg-[#1A1F2E] border border-white/5 rounded-2xl overflow-hidden shadow-2xl focus-within:ring-1 transition-all" style={{ borderColor: `${primaryColor}50` }}>
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                            placeholder="Encrypt message and transmit..."
                                            className="flex-1 bg-transparent px-5 py-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim() || isTyping}
                                            className="p-2 mr-2 disabled:opacity-50 text-white rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-center gap-4 text-[9px] text-slate-700 font-black uppercase tracking-[0.3em]">
                                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Neural Link Active</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                                    <span>E2E Encrypted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Minimized Hub Content */
                    <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-in fade-in zoom-in duration-700 px-8 sm:px-12 text-center pb-28 pt-8 relative">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none" />

                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-xl backdrop-blur-md mb-2">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor, boxShadow: `0 0 10px ${primaryColor}` }} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">System Ready</span>
                        </div>

                        <div className="relative group cursor-pointer z-10" onClick={() => setIsChatOpen(true)}>
                            <div className="absolute -inset-8 rounded-full blur-[50px] animate-pulse scale-110 transition-all duration-1000 group-hover:opacity-100 opacity-60" style={{ backgroundColor: `${primaryColor}30` }}></div>
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[32px] flex items-center justify-center shadow-2xl group-hover:scale-[1.03] transition-all duration-500 border border-white/20 overflow-hidden"
                                style={{ background: `linear-gradient(135deg, ${primaryColor}, #1e1e2e)` }}>
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                                {settings?.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-2xl z-10" />
                                ) : (
                                    <MessageSquare className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-2xl z-10" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-5 bg-[#13171f]/40 backdrop-blur-xl p-8 rounded-[32px] border border-white/5 shadow-2xl relative z-10 w-full max-w-md mx-auto mt-4">
                            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                                Simulator <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, #a855f7)` }}>Hub</span>
                            </h3>
                            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                                Ready to initialize <strong className="font-bold text-white tracking-wide">{settings?.name || "Support Assistant"}</strong>'s brain protocol.
                            </p>

                            <button
                                onClick={() => setIsChatOpen(true)}
                                className="w-full py-4 text-white rounded-2xl font-black shadow-lg transition-all hover:translate-y-[-2px] active:translate-y-[1px] uppercase tracking-widest text-xs border border-white/10 flex items-center justify-center gap-2 group/btn"
                                style={{ backgroundColor: primaryColor, boxShadow: `0 10px 30px -10px ${primaryColor}` }}
                            >
                                <Sparkles className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                Establish Connection
                            </button>
                        </div>
                    </div>
                )}
            </div>


            <style jsx global>{`
                body {
                    background: #0A0C12;
                    margin: 0;
                    padding: 0;
                }
                @keyframes aurora-1 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                    50% { transform: translate(40px, -40px) scale(1.2); opacity: 0.5; }
                }
                @keyframes aurora-2 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                    50% { transform: translate(-40px, 40px) scale(1.2); opacity: 0.5; }
                }
                .animate-aurora-1 { animation: aurora-1 15s ease-in-out infinite alternate; }
                .animate-aurora-2 { animation: aurora-2 18s ease-in-out infinite alternate; }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}

export default function PreviewEmbedPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-[#0A0C12] text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        }>
            <PreviewEmbedContent />
        </Suspense>
    );
}
