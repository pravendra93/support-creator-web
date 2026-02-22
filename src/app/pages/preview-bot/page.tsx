"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, Layout, MessageSquare, Zap } from "lucide-react";
import { NoWorkspaceState } from "@/components/shared/no-workspace-state";

import { ChatBotConfig } from "@/components/chatbot/chatbot-config";

interface Tenant {
    id: string;
    name: string;
}

function PreviewBotContent() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoadingTenants, setIsLoadingTenants] = useState(true);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string>("");
    const [activeTask, setActiveTask] = useState<"intro" | "config" | "voice">("intro");
    const { user } = useAuth();

    // Fetch Tenants
    useEffect(() => {
        const loadTenants = async () => {
            try {
                setIsLoadingTenants(true);
                const res = await fetch("/api/tenants");
                if (res.ok) {
                    const data = await res.json();
                    setTenants(data);
                    if (data.length > 0) {
                        setSelectedTenantId(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to load tenants", error);
            } finally {
                setIsLoadingTenants(false);
            }
        };

        if (user) {
            loadTenants();
        }
    }, [user]);

    const tasks = [
        { id: "intro", title: "Introduction", icon: Sparkles },
        { id: "config", title: "Bot Config", icon: Zap },
        { id: "voice", title: "Coming Soon", icon: Layout },
    ];

    return (
        <div className="flex flex-col gap-6 p-8 h-screen bg-[#0A0C12] text-white">
            {/* Header Area */}
            <div className="flex items-center justify-between shrink-0 mb-2">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Bot Simulator</h1>
                        <p className="text-slate-400 text-sm">
                            Real-time environment for widget testing
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {selectedTenantId && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">Workspace</span>
                            <div className="px-5 py-2.5 bg-[#13171F] border border-white/5 rounded-2xl text-slate-200 font-bold shadow-2xl ring-1 ring-white/5 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                {tenants.find(t => t.id === selectedTenantId)?.name || "Default"}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">Test with API Key</span>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-10 group-focus-within:opacity-30 transition duration-500"></div>
                            <input
                                type="text"
                                placeholder="Enter API Key to override..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="relative bg-[#13171F] border border-white/10 rounded-2xl text-slate-200 px-5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-all w-[280px] font-medium placeholder:text-slate-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Tabs */}
            <div className="flex gap-4 mb-2">
                {tasks.map((task) => (
                    <button
                        key={task.id}
                        onClick={() => setActiveTask(task.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300",
                            activeTask === task.id
                                ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                : "bg-[#13171F] text-slate-400 hover:bg-[#1a1f29] hover:text-slate-200 border border-slate-800"
                        )}
                    >
                        <task.icon className={cn("w-4 h-4", activeTask === task.id ? "text-white" : "text-slate-500")} />
                        {task.title}
                    </button>
                ))}
            </div>

            {/* Split Layout */}
            <div className="flex-1 flex gap-8 min-h-0">
                {/* Left Panel: Tasks/Config Content */}
                <div className="w-1/2 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {activeTask === "intro" && (
                        <div className="bg-[#13171F] rounded-3xl border border-slate-700/30 p-10 flex flex-col justify-center relative overflow-hidden shadow-[0_0_40px_-15px_rgba(99,102,241,0.2)] h-full">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Sparkles className="w-32 h-32 text-indigo-500" />
                            </div>

                            <div className="relative z-10 flex flex-col gap-8">
                                <div>
                                    <h2 className="text-4xl font-black mb-4 leading-tight">
                                        Experience Your <span className="text-indigo-400">AI Force.</span>
                                    </h2>
                                    <p className="text-slate-400 text-lg leading-relaxed">
                                        See how your assistant interacts in a live environment. We've optimized every animation to feel premium and Web3-ready.
                                    </p>
                                </div>

                                <div className="grid gap-4">
                                    <div className="group relative">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-75 blur transition duration-500"></div>
                                        <div className="relative flex items-start gap-4 p-4 rounded-2xl bg-[#13171F] border border-white/5 group-hover:border-transparent transition-colors">
                                            <div className="mt-1 p-1.5 bg-indigo-500/20 rounded-md group-hover:bg-indigo-500/30 transition-colors">
                                                <Zap className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-100 group-hover:text-white transition-colors">Instant Preview</h4>
                                                <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Click the bubble on the right to start.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group relative">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-75 blur transition duration-500"></div>
                                        <div className="relative flex items-start gap-4 p-4 rounded-2xl bg-[#13171F] border border-white/5 group-hover:border-transparent transition-colors">
                                            <div className="mt-1 p-1.5 bg-purple-500/20 rounded-md group-hover:bg-purple-500/30 transition-colors">
                                                <Layout className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-100 group-hover:text-white transition-colors">Adaptive Layout</h4>
                                                <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Test responsiveness across containers.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTask === "config" && selectedTenantId && (
                        <div className="space-y-6">
                            <div className="bg-[#13171F] p-1 rounded-3xl border border-slate-800">
                                <ChatBotConfig tenantId={selectedTenantId} />
                            </div>
                        </div>
                    )}

                    {activeTask === "voice" && (
                        <div className="bg-[#13171F] rounded-3xl border border-slate-700/30 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-[0_0_40px_-15px_rgba(99,102,241,0.2)] h-full">
                            <div className="bg-indigo-500/10 p-6 rounded-full mb-6">
                                <Zap className="w-16 h-16 text-indigo-400 animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Voice Support <span className="text-indigo-400">Coming Soon</span></h2>
                            <p className="text-slate-400 text-lg max-w-md">
                                We're working hard to bring voice integration to your app/web. Stay tuned for a revolutionary way to interact with your users.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Panel: The Simulator Iframe */}
                <div className="w-1/2 bg-[#13171F] rounded-3xl border border-slate-800 overflow-hidden relative shadow-2xl ring-1 ring-white/5">
                    {isLoadingTenants ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0D1117]">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                        </div>
                    ) : !selectedTenantId ? (
                        <div className="absolute inset-0 flex items-center justify-center p-8 bg-[#0D1117]">
                            {tenants.length === 0 ? (
                                <NoWorkspaceState message="Create a workspace to see the simulator." />
                            ) : (
                                <div className="text-center text-slate-500">
                                    Please select a workspace to initialize.
                                </div>
                            )}
                        </div>
                    ) : (
                        <iframe
                            key={`${selectedTenantId}-${apiKey}`}
                            src={`/preview-embed?${apiKey ? `api_key=${apiKey}` : `tenant_id=${selectedTenantId}`}`}
                            className="w-full h-full border-0"
                            title="Chatbot Simulator"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PreviewBotPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-[#0A0C12]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
        }>
            <PreviewBotContent />
        </Suspense>
    );
}
