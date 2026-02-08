"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";

interface Message {
    role: "user" | "bot";
    content: string;
}

interface ChatBotTestProps {
    tenantId: string;
}

export function ChatBotTest({ tenantId }: ChatBotTestProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [config, setConfig] = useState<any>(null); // Store full config for colors
    const [sessionId] = useState(() => Math.random().toString(36).substring(2, 12));
    const scrollRef = useRef<HTMLDivElement>(null);
    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);
    const { toast } = useToast();
    const { user } = useAuth();

    // Fetch Chatbot Config for branding
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await fetch(`/api/chatbots/tenants/${tenantId}/chatbot`);
                if (res.ok) {
                    const data = await res.json();
                    setConfig(data);
                    if (data.welcome_message && messages.length === 0) {
                        setMessages([{ role: "bot", content: data.welcome_message }]);
                    }
                }
            } catch (error) {
                console.error("Failed to load chatbot config", error);
            }
        };
        if (tenantId) {
            loadConfig();
        }
    }, [tenantId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsTyping(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    query: userMessage,
                    session_id: sessionId,
                    user_id: user?.id || "guest",
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: "bot", content: data.reply }]);
            } else {
                throw new Error("Failed to get response");
            }
        } catch (error) {
            console.error("Chat error:", error);
            toast({
                title: "Error",
                description: "Failed to connect to the chatbot.",
                variant: "destructive",
            });
        } finally {
            setIsTyping(false);
        }
    };

    // Helper for text contrast (luminance check)
    const getContrastText = (hexcolor: string) => {
        if (!hexcolor) return "inherit";
        const r = parseInt(hexcolor.slice(1, 3), 16);
        const g = parseInt(hexcolor.slice(3, 5), 16);
        const b = parseInt(hexcolor.slice(5, 7), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    };

    const primaryColor = config?.primary_color || "#00f2ff"; // Futuristics cyan default
    const bgColor = config?.background_color || "#050505"; // Deep space background
    const contrastText = getContrastText(primaryColor);

    return (
        <Card className="flex flex-col h-[700px] overflow-hidden border shadow-xl rounded-xl bg-background relative">
            {/* Header */}
            <div
                className="p-4 flex items-center gap-3 shadow-sm relative z-10"
                style={{ backgroundColor: primaryColor }}
            >
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-base leading-tight">
                        {config?.name || "AI Assistant"}
                    </h3>
                    <p className="text-white/80 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                        Online
                    </p>
                </div>
            </div>

            {/* Chat Area */}
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50/50 dark:bg-zinc-950/30">
                <ScrollArea className="flex-1 p-6">
                    <div className="flex flex-col gap-6">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-8 text-center opacity-50 mt-10">
                                <div className="p-4 bg-muted rounded-full mb-4">
                                    <Bot className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-sm">Start a conversation with {config?.name || "the assistant"}</p>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center shadow-sm ${msg.role === "user" ? "bg-slate-200 text-slate-600" : "text-white"
                                        }`}
                                    style={msg.role === "bot" ? { backgroundColor: primaryColor } : {}}
                                >
                                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>

                                {/* Message Bubble */}
                                <div className="flex flex-col gap-1">
                                    <div
                                        className={`p-3.5 text-sm shadow-sm leading-relaxed ${msg.role === "user"
                                            ? "rounded-2xl rounded-tr-sm text-white"
                                            : "bg-white dark:bg-zinc-900 border text-foreground rounded-2xl rounded-tl-sm"
                                            }`}
                                        style={msg.role === "user" ? { backgroundColor: primaryColor } : {}}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/60 px-1">
                                        {msg.role === "user" ? "You" : config?.name || "AI"}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-3 mr-auto max-w-[85%]">
                                <div
                                    className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center shadow-sm text-white"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="bg-white dark:bg-zinc-900 border p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-zinc-950 border-t">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-3 relative"
                    >
                        <Input
                            placeholder="Type your message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isTyping}
                            className="bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus-visible:ring-offset-0 pr-12 h-12 rounded-xl text-base shadow-sm"
                            style={{
                                '--ring': primaryColor
                            } as any}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg transition-all hover:scale-105"
                            style={{ backgroundColor: input.trim() ? primaryColor : undefined }}
                        >
                            {isTyping ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-muted-foreground/50">
                            Powered by {config?.name || "Assistra AI"}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
