"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/auth-context";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Layout, MessageSquare, Zap } from "lucide-react";
import { NoWorkspaceState } from "@/components/shared/no-workspace-state";

interface Tenant {
    id: string;
    name: string;
}

function PreviewBotContent() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoadingTenants, setIsLoadingTenants] = useState(true);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
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

                <div className="flex items-center gap-4">
                    {tenants.length > 0 && (
                        <Select value={selectedTenantId || ""} onValueChange={setSelectedTenantId}>
                            <SelectTrigger className="w-[240px] bg-[#13171F] border-slate-800 text-slate-200 cursor-pointer h-11 rounded-xl">
                                <SelectValue placeholder="Select Workspace" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#13171F] border-slate-800 text-slate-200">
                                {tenants.map((t) => (
                                    <SelectItem key={t.id} value={t.id} className="cursor-pointer focus:bg-indigo-500 focus:text-white">
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Split Layout */}
            <div className="flex-1 flex gap-8 min-h-0">
                {/* Left Panel: Information & Instructions */}
                <div className="w-1/3 flex flex-col gap-6">
                    <div className="flex-1 bg-[#13171F] rounded-3xl border border-slate-700/30 p-10 flex flex-col justify-center relative overflow-hidden shadow-[0_0_40px_-15px_rgba(99,102,241,0.2)]">
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
                </div>

                {/* Right Panel: The Simulator Iframe */}
                <div className="flex-1 bg-[#13171F] rounded-3xl border border-slate-800 overflow-hidden relative shadow-2xl ring-1 ring-white/5">
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
                            key={selectedTenantId}
                            src={`/preview-embed?tenant_id=${selectedTenantId}`}
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
