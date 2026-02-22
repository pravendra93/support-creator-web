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
            if (!tenantId && !apiKey) return;
            try {
                let url = "";
                if (tenantId) url = `/api/chatbots/tenants/${tenantId}/chatbot`;
                else if (apiKey) url = `/api/widget/init-by-key?key=${apiKey}`;

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const chatbotData = data.id ? data : (data.branding || data);
                    setSettings(chatbotData);
                    if (chatbotData.welcome_message && messages.length === 0) {
                        setMessages([{ role: "bot", content: chatbotData.welcome_message }]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
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
        if (!input.trim() || isTyping || !tenantId) return;

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
                    query: userMsg,
                    session_id: "preview-" + tenantId,
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

    if (!tenantId || isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0A0C12] text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const primaryColor = settings?.primary_color || "#6366f1";

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
                    <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* 1. Workspace Name on TOP - Optimized Height */}
                        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-black text-white tracking-tight">
                                        {settings?.name || "AI Assistant"}
                                    </h1>
                                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-0.5 opacity-80">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Online Protocol
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 2. Tabs BELOW workspace name - Tighter padding */}
                        <div className="px-6 py-2.5 bg-black/10 border-b border-white/5">
                            <div className="flex max-w-[240px] p-0.5 bg-black/40 rounded-xl border border-white/5">
                                <button
                                    onClick={() => setActiveTab("chat")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                        activeTab === "chat" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Chat
                                </button>
                                <button
                                    onClick={() => setActiveTab("audio")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                        activeTab === "audio" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <Mic className="w-4 h-4" />
                                    Audio
                                </button>
                            </div>
                        </div>

                        {/* 3. Content Area */}
                        <div className="flex-1 min-h-0 relative">
                            {activeTab === "chat" ? (
                                <div className="h-full flex flex-col">
                                    {/* Chat Messages */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                        {messages.map((msg, i) => (
                                            <div key={i} className={cn(
                                                "flex gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-3 duration-500",
                                                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                            )}>
                                                <div className={cn(
                                                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                                                    msg.role === "user" ? "bg-white/10 border border-white/10 text-slate-300" : "text-white"
                                                )}
                                                    style={msg.role === "bot" ? { backgroundColor: primaryColor } : {}}
                                                >
                                                    {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                                </div>
                                                <div className={cn(
                                                    "px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-xl",
                                                    msg.role === "user"
                                                        ? "bg-indigo-600/20 border border-indigo-500/30 text-white rounded-tr-none"
                                                        : "bg-white/5 border border-white/[0.05] text-slate-200 rounded-tl-none"
                                                )}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex gap-4 mr-auto max-w-[80%] animate-pulse">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: primaryColor }}>
                                                    <Bot className="w-5 h-5" />
                                                </div>
                                                <div className="px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={scrollRef} />
                                    </div>

                                    {/* Chat Input Area - Tighter padding */}
                                    <div className="px-6 py-5 bg-black/40 border-t border-white/5">
                                        <div className="max-w-xl mx-auto relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-10 blur group-focus-within:opacity-30 transition duration-500"></div>
                                            <div className="relative flex items-center gap-3 p-2 bg-[#0D1117] border border-white/10 rounded-2xl backdrop-blur-xl">
                                                <input
                                                    value={input}
                                                    onChange={(e) => setInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                                    disabled={isTyping}
                                                    placeholder="Ask the AI anything..."
                                                    className="flex-1 bg-transparent border-none outline-none text-white px-3 py-1.5 placeholder:text-slate-700 text-sm font-medium"
                                                />
                                                <button
                                                    onClick={handleSend}
                                                    disabled={!input.trim() || isTyping}
                                                    className={cn(
                                                        "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300",
                                                        input.trim() && !isTyping ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40" : "bg-white/5 text-slate-700"
                                                    )}
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-center text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mt-4">
                                            Assistra Simulation Protocol
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* Audio Screen - Coming Soon - Simplified & Compact */
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-700">
                                    <div className="relative mb-6">
                                        <div className="absolute -inset-6 bg-indigo-500/10 rounded-full blur-[30px] animate-pulse"></div>
                                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl border border-white/10">
                                            <Mic className="w-8 h-8 text-white" />
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
                                        Voice <span className="text-indigo-500">Intelligence</span>
                                    </h3>

                                    <div className="space-y-4 max-w-sm mx-auto">
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                            We're working on a seamless voice layer for <span className="text-white">{settings?.name}</span>.
                                        </p>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Launching Soon</span>
                                        </div>
                                    </div>

                                    <p className="text-slate-600 text-[11px] mt-8 max-w-[240px]">
                                        Talk to your agents naturally with zero latency. This feature is currently in internal alpha testing.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Minimized Hub Content */
                    <div className="flex-1 flex flex-col items-center justify-center gap-10 animate-in fade-in zoom-in duration-700 px-12 text-center">
                        <div className="relative group cursor-pointer" onClick={() => setIsChatOpen(true)}>
                            <div className="absolute -inset-4 bg-indigo-600/30 rounded-full blur-3xl animate-pulse scale-150 transition-all duration-700 group-hover:bg-indigo-600/60"></div>
                            <div className="relative w-32 h-32 rounded-[40px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-3xl group-hover:scale-105 group-hover:rotate-12 transition-all duration-500 border-2 border-white/20">
                                <MessageSquare className="w-14 h-14 text-white" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-4xl font-black text-white tracking-tight leading-none uppercase">Simulator Hub</h3>
                            <p className="text-slate-500 max-w-sm text-lg font-medium leading-relaxed italic">
                                Ready to initialize <span className="text-indigo-400 text-xl not-italic">{settings?.name}</span>'s brain protocol.
                            </p>
                        </div>

                        <button
                            onClick={() => setIsChatOpen(true)}
                            className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-3xl shadow-indigo-600/40 transition-all hover:scale-[1.05] active:scale-[0.95] uppercase tracking-[0.3em] text-xs border border-white/10"
                        >
                            Establish Connection
                        </button>
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
