"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, Layout, MessageSquare, Zap, ChevronDown, X } from "lucide-react";
import { NoWorkspaceState } from "@/components/shared/no-workspace-state";
import { ChatBotConfig } from "@/components/chatbot/chatbot-config";
import { PageHeader } from "@/components/shared/page-header";

interface Tenant {
    id: string;
    name: string;
}

function PreviewBotContent() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoadingTenants, setIsLoadingTenants] = useState(true);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string>("");
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [tempApiKey, setTempApiKey] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTask, setActiveTask] = useState<"intro" | "config" | "voice">("intro");
    const { user } = useAuth();

    // Load API Key from localStorage on mount
    useEffect(() => {
        const savedKey = localStorage.getItem("simulator_api_key");
        if (savedKey) {
            setApiKey(savedKey);
            setTempApiKey(savedKey);
        }
    }, []);

    // Save API Key to localStorage when it changes
    const updateApiKey = (newKey: string) => {
        setApiKey(newKey);
        localStorage.setItem("simulator_api_key", newKey);
    };

    // Resolve API Key to Tenant
    useEffect(() => {
        const resolveKey = async () => {
            if (!apiKey || apiKey.length < 10) return;
            try {
                const res = await fetch(`/api/widget/init-by-key?key=${apiKey}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.tenant_id && data.tenant_id !== selectedTenantId) {
                        setSelectedTenantId(data.tenant_id);
                    }
                }
            } catch (error) {
                console.error("Failed to resolve API key to tenant", error);
            }
        };
        resolveKey();
    }, [apiKey, selectedTenantId]);

    // Fetch Tenants
    useEffect(() => {
        const loadTenants = async () => {
            try {
                setIsLoadingTenants(true);
                const res = await fetch("/api/tenants");
                if (res.ok) {
                    const data = await res.json();
                    setTenants(data);
                    // Only auto-select if no tenant is already set
                    if (data.length > 0 && !selectedTenantId) {
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
    }, [user, selectedTenantId]);

    const tasks = [
        { id: "intro", title: "Introduction", icon: Sparkles },
        { id: "config", title: "Bot Config", icon: Zap },
        { id: "voice", title: "Voice Support", icon: Layout },
    ];

    return (
        <div className="flex flex-col gap-6 p-8 h-screen bg-[#0A0C12] text-white overflow-hidden relative">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

            <PageHeader
                title="Bot Simulator"
                description="Advanced Sandbox: Test your AI's personality and logic."
                icon={MessageSquare}
                gradient="from-indigo-600 to-blue-500"
                howItWorks="The Bot Simulator is your playground to verify how your AI agent behaves before it goes live. You can switch between different workspaces, override configurations, and test voice interactions. Use the 'API Key' field to test premium features or specific integrations that require authentication. The preview refreshes instantly as you change settings."
                actions={
                    <div className="flex items-center gap-6">
                        {/* Workspace Selector */}
                        {selectedTenantId && tenants.length > 0 && (
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">Active Workspace</span>
                                <div className="relative flex items-center bg-[#13171F]/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl ring-1 ring-white/5 overflow-hidden group hover:border-white/10 transition-colors">
                                    <div className="pl-4 py-2.5 flex items-center pointer-events-none absolute left-0 z-10">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    </div>
                                    <select
                                        className="appearance-none bg-transparent text-slate-200 font-bold py-2.5 pl-9 pr-10 focus:outline-none cursor-pointer min-w-[180px] z-20"
                                        value={selectedTenantId}
                                        onChange={(e) => setSelectedTenantId(e.target.value)}
                                    >
                                        {tenants.map(t => (
                                            <option key={t.id} value={t.id} className="bg-[#13171F] text-slate-200 py-1">
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 pointer-events-none z-10">
                                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* API Key Input */}
                        <div className="flex flex-col items-end group">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-60 flex items-center gap-2">
                                API Key Override
                                <div className="w-3 h-3 rounded-full bg-slate-800 flex items-center justify-center cursor-help" title="Enter an API Key to test restricted features.">
                                    <span className="text-[8px]">?</span>
                                </div>
                            </span>
                            <div className="relative flex items-center">
                                <Zap className={cn(
                                    "absolute left-3 w-3.5 h-3.5 transition-all duration-500",
                                    apiKey ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "text-slate-600"
                                )} />
                                <input
                                    id="api-key-header-input"
                                    type="password"
                                    placeholder="sk_test_..."
                                    value={apiKey}
                                    onFocus={() => setIsKeyModalOpen(true)}
                                    readOnly
                                    className="bg-[#13171F]/80 backdrop-blur-md border border-white/5 rounded-2xl py-2.5 pl-9 pr-4 text-xs font-mono text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/32 transition-all min-w-[200px] cursor-pointer"
                                />
                                {apiKey && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>
                }
            />

            {/* API Key Modal */}
            {isKeyModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsKeyModalOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-[#13171F] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in zoom-in-95 fade-in duration-300">
                        <div className="absolute top-0 right-0 p-6">
                            <button
                                onClick={() => setIsKeyModalOpen(false)}
                                className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center relative">
                                    <Zap className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.5)]" />
                                    <div className="absolute -inset-2 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Access Protocol</h3>
                                    <p className="text-slate-500 text-sm mt-1">Configure your AI agent's secure key.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1 mb-2 block">Secret API Key</label>
                                    <div className="relative">
                                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-amber-400" />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="sk_live_..."
                                            value={tempApiKey}
                                            onChange={(e) => setTempApiKey(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (updateApiKey(tempApiKey), setIsKeyModalOpen(false))}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono text-slate-200 placeholder:text-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-inner"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic mt-2 px-1">This key will be cached locally on your machine.</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        updateApiKey(tempApiKey);
                                        setIsKeyModalOpen(false);
                                    }}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/20"
                                >
                                    Synchronize Agent
                                </button>
                                <button
                                    onClick={() => setIsKeyModalOpen(false)}
                                    className="w-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl py-4 font-bold text-sm transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Tabs */}
            <div className="flex gap-4 mb-2 animate-in fade-in duration-1000 delay-300">
                {tasks.map((task) => (
                    <button
                        key={task.id}
                        onClick={() => setActiveTask(task.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-300 cursor-pointer border transform active:scale-95",
                            activeTask === task.id
                                ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.5)] ring-2 ring-indigo-500/20"
                                : "bg-[#13171F]/50 border-slate-800 text-slate-500 hover:bg-[#1a1f29] hover:text-slate-200 hover:border-slate-700 backdrop-blur-sm"
                        )}
                    >
                        <task.icon className={cn("w-4 h-4 transition-colors", activeTask === task.id ? "text-white" : "text-slate-600")} />
                        {task.title}
                    </button>
                ))}
            </div>

            {/* Split Layout */}
            <div className="flex-1 flex gap-8 min-h-0 relative z-10 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
                {/* Left Panel: Tasks/Config Content */}
                <div className="w-1/2 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar text-white">
                    {activeTask === "intro" && (
                        <div className="bg-gradient-to-br from-[#13171F] to-[#0D1117] rounded-[32px] border border-white/5 p-10 flex flex-col relative shadow-2xl group min-h-full">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-colors duration-700" />

                            <div className="relative z-10 flex flex-col gap-8">
                                <div className="space-y-6 text-white text-left">
                                    <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                                        Getting Started
                                    </div>
                                    <h2 className="text-4xl font-black mb-2 leading-[1.15] text-white">
                                        Activate Your <br />
                                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">AI Sandbox.</span>
                                    </h2>
                                    <p className="text-slate-400 text-base leading-relaxed max-w-lg">
                                        To begin testing, you first need to provide an <button onClick={() => setIsKeyModalOpen(true)} className="text-indigo-400 font-bold border-b border-indigo-500/30 pb-0.5 hover:text-indigo-300 hover:border-indigo-400 transition-all cursor-pointer">API Key</button>. This key connects the simulator to your unique AI agent's logic and knowledge base.
                                    </p>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
                                        Once connected, head over to <span className="text-purple-400 font-bold">Bot Config</span> to fine-tune your widget's appearance, colors, and personality in real-time.
                                    </p>

                                    {!apiKey && (
                                        <div className="pt-4">
                                            <button
                                                onClick={() => setIsKeyModalOpen(true)}
                                                className="group/btn relative px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20 flex items-center gap-2"
                                            >
                                                Initialize with API Key
                                                <Zap className="w-4 h-4 animate-pulse" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group/item relative">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-hover/item:opacity-75 blur transition duration-500"></div>
                                        <div className="relative flex flex-col gap-3 p-5 rounded-2xl bg-[#13171F] border border-white/5 group-hover/item:border-transparent transition-all">
                                            <div className="w-8 h-8 flex items-center justify-center bg-indigo-500/20 rounded-lg group-hover/item:bg-indigo-500/30 transition-colors">
                                                <Zap className="w-4 h-4 text-indigo-400 group-hover/item:text-indigo-300" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-100 group-hover/item:text-white transition-colors text-left text-sm">Instant Preview</h4>
                                                <p className="text-[11px] text-slate-400 leading-relaxed group-hover/item:text-slate-300 transition-colors text-left">Watch the widget update instantly as you change your configuration.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group/item relative">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl opacity-0 group-hover/item:opacity-75 blur transition duration-500"></div>
                                        <div className="relative flex flex-col gap-3 p-5 rounded-2xl bg-[#13171F] border border-white/5 group-hover/item:border-transparent transition-all shadow-xl">
                                            <div className="w-8 h-8 flex items-center justify-center bg-purple-500/20 rounded-lg group-hover/item:bg-purple-500/30 transition-colors">
                                                <Layout className="w-4 h-4 text-purple-400 group-hover/item:text-purple-300" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-100 group-hover/item:text-white transition-colors text-left text-sm">Adaptive Config</h4>
                                                <p className="text-[11px] text-slate-400 leading-relaxed group-hover/item:text-slate-300 transition-colors text-left">Toggle through layout styles and AI personality settings on the fly.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTask === "config" && selectedTenantId && (
                        <div className="space-y-6">
                            {!apiKey ? (
                                <div className="bg-[#13171F]/50 backdrop-blur-xl p-12 rounded-[32px] border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                                        <Zap className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Config Locked</h3>
                                        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">Please enter your API Key first to enable dynamic configuration of your chatbot.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsKeyModalOpen(true)}
                                        className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Configure API Key
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-[#13171F]/80 backdrop-blur-xl p-2 rounded-[32px] border border-white/5 shadow-2xl">
                                    <ChatBotConfig
                                        tenantId={selectedTenantId}
                                        apiKey={apiKey}
                                        onApiKeyChange={(key) => {
                                            updateApiKey(key);
                                            setTempApiKey(key);
                                        }}
                                        onSaveSuccess={() => setRefreshKey(prev => prev + 1)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTask === "voice" && (
                        <div className="bg-gradient-to-br from-[#13171F] to-[#0D1117] rounded-[32px] border border-white/5 p-12 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl h-full">
                            <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none"></div>
                            <div className="bg-indigo-500/10 p-8 rounded-full mb-8 relative">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-20"></div>
                                <Zap className="w-20 h-20 text-indigo-400" />
                            </div>
                            <h2 className="text-4xl font-black mb-4">Voice AI <span className="text-indigo-400">Pipeline</span></h2>
                            <p className="text-slate-400 text-lg max-w-sm font-medium">
                                We're finishing up the voice interface. You'll soon be able to talk directly to your customized assistant.
                            </p>
                            <div className="mt-8 flex gap-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-2 h-8 bg-indigo-500/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: The Simulator Iframe */}
                <div className="w-1/2 bg-[#0D1117] rounded-[32px] border border-white/5 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 group transition-all duration-700">
                    {/* Simulated Browser Bar */}
                    <div className="h-8 bg-[#13171F] border-b border-white/5 flex items-center px-4 gap-1.5 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></div>
                        <div className="mx-auto bg-black/30 rounded-full px-4 py-0.5 text-[10px] text-slate-600 font-mono w-48 text-center truncate">
                            {apiKey ? `simulator://${apiKey.slice(0, 8)}...` : "waiting for connection..."}
                        </div>
                    </div>

                    {!apiKey ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1117]/80 backdrop-blur-sm z-30 p-12 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6 animate-bounce">
                                <Zap className="w-10 h-10 text-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3">Simulator Offline</h3>
                            <p className="text-slate-400 text-sm max-w-[240px] leading-relaxed">
                                Enter your <span className="text-indigo-400 font-bold">API Key</span> at the top right to initialize the live preview.
                            </p>
                            <div className="mt-8 flex gap-2">
                                <div className="w-1 h-1 rounded-full bg-slate-700 animate-pulse"></div>
                                <div className="w-1 h-1 rounded-full bg-slate-700 animate-pulse delay-75"></div>
                                <div className="w-1 h-1 rounded-full bg-slate-700 animate-pulse delay-150"></div>
                            </div>
                        </div>
                    ) : isLoadingTenants ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#0D1117] z-30">
                            <div className="flex flex-col items-center gap-6">
                                <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
                                <div className="text-slate-400 text-sm font-bold animate-pulse uppercase tracking-widest">Waking up Agent...</div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#13171F_0%,#0A0C12_100%)]" />
                            <iframe
                                key={apiKey + refreshKey}
                                src={`/preview-embed?api_key=${apiKey}`}
                                className="w-full h-full border-0 relative z-10"
                                title="Chatbot Simulator"
                            />
                        </div>
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
