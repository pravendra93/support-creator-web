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
                    <>
                        <script src={process.env.NEXT_PUBLIC_WIDGET_URL || process.env.WIDGET_URL || "https://assistra-widget-stage.sgp1.cdn.digitaloceanspaces.com/widget/v1/widget.js"}
                            data-api-key="sk_live_d_aOUcg4HX3UolCTbHN0bHTAwZDiyyCz" async>
                        </script>
                    </>
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
                            className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-3xl shadow-indigo-600/40 transition-all hover:scale-[1.05] active:scale-[0.95] uppercase tracking-[0.3em] text-xs border border-white/10 cursor-pointer"
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
