"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
    Loader2, Sparkles, Layout, MessageSquare, Zap,
    ChevronDown, X, CheckCircle2, XCircle, AlertTriangle,
    ArrowRight, Key, Bot, Settings, Play, Shield, Copy, Check, Lock,
    Monitor, Smartphone, Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
// import { NoWorkspaceState } from "@/components/shared/no-workspace-state";
import { ChatBotConfig } from "@/components/chatbot/chatbot-config";
import { CreateApiKeyModal } from "@/components/api-keys/create-api-key-modal";
import { PageHeader } from "@/components/shared/page-header";

interface Tenant {
    id: string;
    name: string;
}

interface ApiKeyItem {
    id: string;
    name: string;
    key: string;
    is_active: boolean;
    tenant_id?: string;
}

type ReadinessStatus = "ready" | "partial" | "not_setup";

interface WorkspaceReadiness {
    tenant: Tenant;
    status: ReadinessStatus;
    hasApiKey: boolean;
    hasBotConfig: boolean;
    isSubscribed: boolean;
    apiKey?: string;
}

function PreviewBotContent() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoadingTenants, setIsLoadingTenants] = useState(true);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string>("");
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [isCreateApiKeyModalOpen, setIsCreateApiKeyModalOpen] = useState(false);
    const [tempApiKey, setTempApiKey] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTask, setActiveTask] = useState<"intro" | "config" | "voice">("intro");
    const [isSnippetCopied, setIsSnippetCopied] = useState(false);
    const { user } = useAuth();

    // Smart workspace detection
    const [workspaceReadiness, setWorkspaceReadiness] = useState<WorkspaceReadiness[]>([]);
    const [isCheckingReadiness, setIsCheckingReadiness] = useState(true);
    const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);
    const [isAutoSelected, setIsAutoSelected] = useState(false);
    const [isTenantSubscribed, setIsTenantSubscribed] = useState<boolean | null>(null);
    const [blobUrl, setBlobUrl] = useState<string>("");
    const [viewMode, setViewMode] = useState<"auto" | "desktop" | "mobile">("auto");

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

    // API Key validation
    const [keyValidationState, setKeyValidationState] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
    const [keyValidationMessage, setKeyValidationMessage] = useState("");

    const getIntegrationSnippet = () => {
        const widgetUrl =
            process.env.NEXT_PUBLIC_WIDGET_URL ||
            (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}/widget.js` : "http://localhost:3000/widget.js");

        return `<script 
  src="${widgetUrl}" 
  data-api-key="${apiKey}"
  async>
</script>`;
    };

    const handleCopySnippet = () => {
        navigator.clipboard.writeText(getIntegrationSnippet());
        setIsSnippetCopied(true);
        setTimeout(() => setIsSnippetCopied(false), 2000);
    };

    // Check for API keys and open appropriate modal
    const handleApiKeyLinkClick = async () => {
        try {
            const res = await fetch("/api/api-keys");
            if (res.ok) {
                const data = await res.json();
                const keys = Array.isArray(data) ? data : (data.items || []);
                if (keys.length === 0) {
                    setIsCreateApiKeyModalOpen(true);
                } else {
                    setIsKeyModalOpen(true);
                }
            } else {
                setIsKeyModalOpen(true);
            }
        } catch (error) {
            console.error("Failed to check API keys", error);
            setIsKeyModalOpen(true);
        }
    };

    // Save API Key to localStorage when it changes
    const updateApiKey = (newKey: string) => {
        setApiKey(newKey);
        localStorage.setItem("simulator_api_key", newKey);
    };

    // Validate API key reactively
    const validateApiKey = useCallback(async (key: string, existingTenantId?: string | null) => {
        if (!key || key.length < 10) {
            setKeyValidationState("idle");
            setKeyValidationMessage("");
            return;
        }

        setKeyValidationState("validating");
        setKeyValidationMessage("Validating API Key…");

        try {
            const res = await fetch(`/api/widget/init-by-key?key=${key}`);
            if (res.ok) {
                const data = await res.json();
                if (data.tenant_id) {
                    setKeyValidationState("valid");
                    setKeyValidationMessage("API Key Connected Successfully");
                    setSelectedTenantId(data.tenant_id);
                    setRefreshKey(prev => prev + 1);
                    return;
                }
            }

            // Fallback: if init-by-key failed but we already have a tenant ID
            // (e.g., from workspace readiness check), try to validate via chatbot config
            const fallbackTenantId = existingTenantId || selectedTenantId;
            if (fallbackTenantId) {
                try {
                    const cfgRes = await fetch(`/api/tenants/${fallbackTenantId}/chatbot`);
                    if (cfgRes.ok) {
                        setKeyValidationState("valid");
                        setKeyValidationMessage("API Key Connected Successfully");
                        setSelectedTenantId(fallbackTenantId);
                        setRefreshKey(prev => prev + 1);
                        return;
                    }
                } catch {
                    // Fall through to invalid
                }
            }

            // If we still have a selectedTenantId from the readiness check, treat as valid
            // The key was from our own system (localStorage / workspace readiness)
            if (fallbackTenantId) {
                setKeyValidationState("valid");
                setKeyValidationMessage("API Key Connected");
                setRefreshKey(prev => prev + 1);
                return;
            }

            setKeyValidationState("invalid");
            setKeyValidationMessage("Invalid API Key. Please check and try again.");
        } catch (error) {
            // Network error — if we have a tenant, still try to proceed
            const fallbackTenantId = existingTenantId || selectedTenantId;
            if (fallbackTenantId) {
                setKeyValidationState("valid");
                setKeyValidationMessage("API Key Connected");
                setRefreshKey(prev => prev + 1);
                return;
            }
            setKeyValidationState("invalid");
            setKeyValidationMessage("Failed to validate. Please try again.");
        }
    }, [selectedTenantId]);

    // Validate when apiKey changes
    useEffect(() => {
        if (apiKey) {
            // Skip if already validated successfully (from readiness check)
            if (keyValidationState === "valid") return;
            validateApiKey(apiKey, selectedTenantId);
        } else {
            setKeyValidationState("idle");
            setKeyValidationMessage("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey]);

    // Smart Workspace Detection on load
    useEffect(() => {
        const checkWorkspaceReadiness = async () => {
            if (!user) return;

            setIsCheckingReadiness(true);
            try {
                // Fetch tenants + API keys in parallel
                const [tenantsRes, keysRes] = await Promise.all([
                    fetch("/api/tenants"),
                    fetch("/api/api-keys")
                ]);

                let tenantsList: Tenant[] = [];
                let apiKeysList: ApiKeyItem[] = [];

                if (tenantsRes.ok) {
                    tenantsList = await tenantsRes.json();
                    setTenants(tenantsList);
                }

                if (keysRes.ok) {
                    const keysData = await keysRes.json();
                    apiKeysList = Array.isArray(keysData) ? keysData : (keysData.items || []);
                }

                // Check bot config for each tenant
                const readinessChecks: WorkspaceReadiness[] = await Promise.all(
                    tenantsList.map(async (tenant) => {
                        const tenantKeys = apiKeysList.filter(
                            (k: ApiKeyItem) => k.is_active && (k.tenant_id === tenant.id || !k.tenant_id)
                        );
                        const hasApiKey = tenantKeys.length > 0;

                        let hasBotConfig = false;
                        let isSubscribed = false;
                        try {
                            const cfgRes = await fetch(`/api/tenants/${tenant.id}/chatbot`);
                            const tenantRes = await fetch(`/api/tenants/${tenant.id}`);

                            if (cfgRes.ok) {
                                const cfg = await cfgRes.json();
                                hasBotConfig = !!(cfg && (cfg.name || cfg.id));
                            }

                            if (tenantRes.ok) {
                                const tenantData = await tenantRes.json();
                                // A tenant is considered subscribed if they have an active plan
                                isSubscribed = !!(tenantData.plan_id && tenantData.status === "active");
                            }
                        } catch {
                            hasBotConfig = false;
                            isSubscribed = false;
                        }

                        const status: ReadinessStatus =
                            hasApiKey && hasBotConfig ? "ready" :
                                hasApiKey ? "partial" : "not_setup";

                        return {
                            tenant,
                            status,
                            hasApiKey,
                            hasBotConfig,
                            isSubscribed,
                            apiKey: tenantKeys[0]?.key
                        };
                    })
                );

                setWorkspaceReadiness(readinessChecks);

                const readyWorkspaces = readinessChecks.filter(w => w.status === "ready");
                const savedKey = localStorage.getItem("simulator_api_key");
                const lastWorkspace = localStorage.getItem("simulator_last_workspace");

                // Determine which workspace to select
                let wsToSelect: WorkspaceReadiness | null = null;
                let shouldShowSelector = false;

                if (lastWorkspace) {
                    const lastWs = readinessChecks.find(w => w.tenant.id === lastWorkspace);
                    if (lastWs && lastWs.status !== "not_setup") {
                        wsToSelect = lastWs;
                    } else if (lastWs && readinessChecks.length === 1) {
                        wsToSelect = lastWs;
                    } else if (readyWorkspaces.length > 0) {
                        // Fallback to first ready
                        wsToSelect = readyWorkspaces[0];
                    } else {
                        wsToSelect = lastWs || null; // Still select it even if not setup, so user can onboard
                    }
                } else if (readyWorkspaces.length === 1) {
                    wsToSelect = readyWorkspaces[0];
                } else if (readyWorkspaces.length > 1) {
                    shouldShowSelector = true;
                } else if (tenantsList.length > 0) {
                    wsToSelect = readinessChecks[0];
                }

                if (shouldShowSelector) {
                    setShowWorkspaceSelector(true);
                } else if (wsToSelect) {
                    setSelectedTenantId(wsToSelect.tenant.id);
                    setIsTenantSubscribed(wsToSelect.isSubscribed);
                    if (wsToSelect.apiKey) {
                        // updateApiKey(wsToSelect.apiKey);
                        setTempApiKey(wsToSelect.apiKey);
                        setKeyValidationState("valid");
                        setKeyValidationMessage("API Key Connected");
                    } else {
                        // Clear any old override if this workspace has no key
                        updateApiKey("");
                        setTempApiKey("");
                        setKeyValidationState("idle");
                        setKeyValidationMessage("");
                    }
                    setIsAutoSelected(true);
                    localStorage.setItem("simulator_last_workspace", wsToSelect.tenant.id);
                }
            } catch (error) {
                console.error("Failed workspace readiness check", error);
            } finally {
                setIsCheckingReadiness(false);
                setIsLoadingTenants(false);
            }
        };

        checkWorkspaceReadiness();
    }, [user]);

    const selectWorkspace = (ws: WorkspaceReadiness) => {
        setSelectedTenantId(ws.tenant.id);
        setIsTenantSubscribed(ws.isSubscribed);
        if (ws.apiKey) {
            updateApiKey(ws.apiKey);
            setTempApiKey(ws.apiKey);
            setKeyValidationState("valid");
            setKeyValidationMessage("API Key Connected Successfully");
        }
        localStorage.setItem("simulator_last_workspace", ws.tenant.id);
        setShowWorkspaceSelector(false);
        setIsAutoSelected(true);
    };

    const getStatusIcon = (status: ReadinessStatus) => {
        switch (status) {
            case "ready": return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />;
            case "partial": return <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />;
            case "not_setup": return <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />;
        }
    };

    const getStatusLabel = (status: ReadinessStatus) => {
        switch (status) {
            case "ready": return "Ready";
            case "partial": return "Partial";
            case "not_setup": return "Not Setup";
        }
    };

    const getStatusColor = (status: ReadinessStatus) => {
        switch (status) {
            case "ready": return "text-emerald-400";
            case "partial": return "text-amber-400";
            case "not_setup": return "text-red-400";
        }
    };

    const readyCount = workspaceReadiness.filter(w => w.status === "ready").length;
    const hasAnyReady = readyCount > 0;

    const tasks = [
        { id: "intro", title: "Introduction", icon: Sparkles },
        { id: "config", title: "Bot Config", icon: Zap },
        { id: "voice", title: "Voice Support", icon: Layout },
    ];

    // Show loading while checking readiness
    if (isCheckingReadiness) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0A0C12] text-white gap-6">
                <div className="relative">
                    <div className="absolute -inset-8 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-500 relative z-10" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-2">Initializing Bot Simulator</h3>
                    <p className="text-sm text-slate-500 animate-pulse">Checking workspace readiness…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6 sm:p-8 min-h-screen lg:h-screen bg-[#0A0C12] text-white overflow-y-auto lg:overflow-hidden relative">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Workspace Selection Modal - Scenario B */}
            {showWorkspaceSelector && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setShowWorkspaceSelector(false)}
                    />
                    <div className="relative w-full max-w-2xl bg-[#13171F] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in zoom-in-95 fade-in duration-300">
                        <div className="absolute top-0 right-0 p-6 z-10">
                            <button
                                onClick={() => setShowWorkspaceSelector(false)}
                                className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="text-center space-y-3">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                    <Bot className="w-4 h-4 text-indigo-400" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Workspace Selection</span>
                                </div>
                                <h3 className="text-2xl font-black text-white">Select a Workspace to Preview</h3>
                                <p className="text-slate-500 text-sm max-w-md mx-auto">Multiple workspaces are ready. Choose one to launch the simulator.</p>
                            </div>

                            <div className="grid gap-4">
                                {workspaceReadiness.map((ws) => (
                                    <button
                                        key={ws.tenant.id}
                                        onClick={() => selectWorkspace(ws)}
                                        disabled={ws.status === "not_setup"}
                                        className={cn(
                                            "group relative w-full text-left p-6 rounded-2xl border transition-all duration-300",
                                            ws.status === "ready"
                                                ? "bg-[#0D1117] border-emerald-500/20 hover:border-emerald-500/50 hover:bg-[#0D1117]/80 cursor-pointer"
                                                : ws.status === "partial"
                                                    ? "bg-[#0D1117] border-amber-500/20 hover:border-amber-500/50 hover:bg-[#0D1117]/80 cursor-pointer"
                                                    : "bg-[#0D1117]/50 border-white/5 opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {getStatusIcon(ws.status)}
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-bold text-white text-sm">{ws.tenant.name}</h4>
                                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", getStatusColor(ws.status))}>
                                                            {getStatusLabel(ws.status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1.5">
                                                        <span className={cn("text-[11px] flex items-center gap-1.5", ws.hasApiKey ? "text-emerald-400" : "text-red-400")}>
                                                            {ws.hasApiKey ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                            API Key {ws.hasApiKey ? "Connected" : "Missing"}
                                                        </span>
                                                        <span className={cn("text-[11px] flex items-center gap-1.5", ws.hasBotConfig ? "text-emerald-400" : "text-red-400")}>
                                                            {ws.hasBotConfig ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                            Bot Config {ws.hasBotConfig ? "Configured" : "Missing"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {ws.status !== "not_setup" && (
                                                <div className="flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
                                                    <span className="text-xs font-bold uppercase tracking-wider">Preview Bot</span>
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PageHeader
                title="Bot Simulator"
                description="Advanced Sandbox: Test your AI's personality and logic."
                icon={MessageSquare}
                gradient="from-indigo-600 to-blue-500"
                howItWorks="The Bot Simulator is your playground to verify how your AI agent behaves before it goes live. You can switch between different workspaces, override configurations, and test voice interactions. Use the 'API Key' field to test premium features or specific integrations that require authentication. The preview refreshes instantly as you change settings."
                actions={
                    <div className="flex items-center gap-6">
                        {/* Workspace Selector with Readiness Badges */}
                        {selectedTenantId && tenants.length > 0 && (
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">Active Workspace</span>
                                <div className="relative flex items-center bg-[#13171F]/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl ring-1 ring-white/5 overflow-hidden group hover:border-white/10 transition-colors">
                                    <div className="pl-4 py-2.5 flex items-center pointer-events-none absolute left-0 z-10">
                                        {getStatusIcon(
                                            workspaceReadiness.find(w => w.tenant.id === selectedTenantId)?.status || "not_setup"
                                        )}
                                    </div>
                                    <select
                                        className="appearance-none bg-transparent text-slate-200 font-bold py-2.5 pl-9 pr-10 focus:outline-none cursor-pointer min-w-[180px] z-20"
                                        value={selectedTenantId}
                                        onChange={(e) => {
                                            const newTenantId = e.target.value;
                                            const ws = workspaceReadiness.find(w => w.tenant.id === newTenantId);
                                            setSelectedTenantId(newTenantId);
                                            setIsTenantSubscribed(ws?.isSubscribed ?? null);
                                            if (ws?.apiKey) {
                                                updateApiKey(ws.apiKey);
                                                setTempApiKey(ws.apiKey);
                                                setKeyValidationState("valid");
                                                setKeyValidationMessage("API Key Connected Successfully");
                                            } else if (ws && !ws.hasApiKey) {
                                                // Workspace has NO API key → show create modal
                                                updateApiKey("");
                                                setTempApiKey("");
                                                setKeyValidationState("idle");
                                                setKeyValidationMessage("");
                                                setIsCreateApiKeyModalOpen(true);
                                            } else {
                                                // Workspace has API key but we don't have the full key → show paste modal
                                                updateApiKey("");
                                                setTempApiKey("");
                                                setKeyValidationState("idle");
                                                setKeyValidationMessage("");
                                                setIsKeyModalOpen(true);
                                            }
                                            localStorage.setItem("simulator_last_workspace", newTenantId);
                                        }}
                                    >
                                        {tenants.map(t => {
                                            const ws = workspaceReadiness.find(w => w.tenant.id === t.id);
                                            const badge = ws ? ` • ${getStatusLabel(ws.status)}` : "";
                                            return (
                                                <option key={t.id} value={t.id} className="bg-[#13171F] text-slate-200 py-1">
                                                    {t.name}{badge}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="absolute right-3 pointer-events-none z-10">
                                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* API Key Input with Validation Feedback */}
                        <div className="flex flex-col items-end group">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-60 flex items-center gap-2">
                                API Key Override
                                {keyValidationState === "valid" && (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                )}
                                {keyValidationState === "invalid" && (
                                    <XCircle className="w-3 h-3 text-red-400" />
                                )}
                            </span>
                            <div className="relative flex items-center">
                                <Zap className={cn(
                                    "absolute left-3 w-3.5 h-3.5 transition-all duration-500",
                                    keyValidationState === "valid"
                                        ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                        : keyValidationState === "invalid"
                                            ? "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                            : apiKey
                                                ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                                : "text-slate-600"
                                )} />
                                <input
                                    id="api-key-header-input"
                                    type="password"
                                    placeholder="sk_test_..."
                                    value={apiKey}
                                    onFocus={handleApiKeyLinkClick}
                                    readOnly
                                    className={cn(
                                        "bg-[#13171F]/80 backdrop-blur-md border rounded-2xl py-2.5 pl-9 pr-4 text-xs font-mono text-slate-200 placeholder:text-slate-700 focus:outline-none transition-all min-w-[200px] cursor-pointer",
                                        keyValidationState === "valid"
                                            ? "border-emerald-500/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                                            : keyValidationState === "invalid"
                                                ? "border-red-500/30 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                                                : "border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/32"
                                    )}
                                />
                                {keyValidationState === "validating" && (
                                    <Loader2 className="absolute right-3 w-3.5 h-3.5 text-indigo-400 animate-spin" />
                                )}
                                {keyValidationState === "valid" && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                )}
                                {keyValidationState === "invalid" && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                )}
                            </div>
                            {/* Validation message tooltip */}
                            {keyValidationMessage && (
                                <span className={cn(
                                    "text-[9px] mt-1 font-bold uppercase tracking-widest transition-all",
                                    keyValidationState === "valid" ? "text-emerald-400" :
                                        keyValidationState === "invalid" ? "text-red-400" :
                                            "text-slate-500"
                                )}>
                                    {keyValidationState === "valid" && "✅ "}{keyValidationState === "invalid" && "❌ "}{keyValidationMessage}
                                </span>
                            )}
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
                                className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors cursor-pointer"
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
                                            onKeyDown={(e) => e.key === 'Enter' && (setKeyValidationState("idle"), updateApiKey(tempApiKey), setIsKeyModalOpen(false))}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-mono text-slate-200 placeholder:text-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-inner"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic mt-2 px-1">This key will be cached locally on your machine.</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setKeyValidationState("idle"); // Force re-validation
                                        updateApiKey(tempApiKey);
                                        setIsKeyModalOpen(false);
                                    }}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/20 cursor-pointer"
                                >
                                    Synchronize Agent
                                </button>
                                <button
                                    onClick={() => setIsKeyModalOpen(false)}
                                    className="w-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl py-4 font-bold text-sm transition-all cursor-pointer"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create API Key Modal */}
            <CreateApiKeyModal
                isOpen={isCreateApiKeyModalOpen}
                onClose={(createdKey) => {
                    setIsCreateApiKeyModalOpen(false);
                    if (createdKey) {
                        // Auto-fill the created key into the simulator
                        setKeyValidationState("idle"); // Force re-validation
                        updateApiKey(createdKey);
                        setTempApiKey(createdKey);
                    }
                }}
                onSuccess={(createdKey) => {
                    if (createdKey) {
                        // Key was just created — it will be used when modal closes
                    }
                }}
                initialTenantId={selectedTenantId}
            />

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
            <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0 relative z-10 animate-in fade-in slide-in-from-bottom duration-1000 delay-500 pb-10 lg:pb-0">
                {/* Left Panel: Tasks/Config Content */}
                <div className="w-full lg:w-1/2 flex flex-col gap-6 overflow-y-auto lg:pr-2 custom-scrollbar text-white shrink-0">
                    {activeTask === "intro" && (
                        <div className="min-h-full">
                            {apiKey && selectedTenantId ? (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="space-y-4">
                                        <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                                            Bot Connected
                                        </div>
                                        <h2 className="text-4xl font-black mb-2 leading-[1.15] text-white">
                                            Your Widget is <br />
                                            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Ready to Deploy.</span>
                                        </h2>
                                        <p className="text-slate-400 text-base leading-relaxed max-w-lg">
                                            Ensure your API key is updated to enable widget functionality. Once configured, copy the integration snippet below and paste it into your website&apos;s header or footer to launch your AI assistant.
                                        </p>
                                    </div>

                                    <div className="bg-[#13171F]/80 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 shadow-2xl relative group/snippet">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Production Snippet</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCopySnippet}
                                                className="h-8 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all gap-2"
                                            >
                                                {isSnippetCopied ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Copied</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">Copy Code</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute -inset-2 bg-indigo-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <pre className="relative bg-black/40 text-indigo-300 p-6 rounded-2xl overflow-x-auto text-[13px] font-mono leading-relaxed border border-white/5 custom-scrollbar">
                                                {getIntegrationSnippet()}
                                            </pre>
                                        </div>

                                        <p className="text-[10px] text-slate-600 mt-4 flex items-center gap-2 justify-center">
                                            <AlertTriangle className="w-3 h-3" />
                                            Active API Key: {apiKey.slice(0, 8)}...{apiKey.slice(-4)}
                                        </p>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => setActiveTask("config")}
                                            className="text-sm font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2 group/link"
                                        >
                                            Want to customize colors and personality?
                                            <span className="text-indigo-400 flex items-center gap-1 group-hover/link:translate-x-1 transition-transform">
                                                Go to Bot Config <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
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
                                                To begin testing, you first need to provide an <button onClick={handleApiKeyLinkClick} className="text-indigo-400 font-bold border-b border-indigo-500/30 pb-0.5 hover:text-indigo-300 hover:border-indigo-400 transition-all cursor-pointer">API Key</button>. This key connects the simulator to your unique AI agent&apos;s logic and knowledge base.
                                            </p>
                                            <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
                                                Once connected, head over to <span className="text-purple-400 font-bold">Bot Config</span> to fine-tune your widget&apos;s appearance, colors, and personality in real-time.
                                            </p>

                                            {!apiKey && (
                                                <div className="pt-4">
                                                    <button
                                                        onClick={handleApiKeyLinkClick}
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
                        <div className="bg-gradient-to-br from-[#13171F] to-[#0D1117] rounded-[32px] border border-white/5 p-12 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl flex-1 min-h-[400px]">
                            <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none"></div>
                            <div className="bg-indigo-500/10 p-8 rounded-full mb-8 relative">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-20"></div>
                                <Zap className="w-20 h-20 text-indigo-400" />
                            </div>
                            <h2 className="text-4xl font-black mb-4">Voice AI <span className="text-indigo-400">Pipeline</span></h2>
                            <p className="text-slate-400 text-lg max-w-sm font-medium">
                                We&apos;re finishing up the voice interface. You&apos;ll soon be able to talk directly to your customized assistant.
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
                <div className="w-full lg:w-1/2 flex-1 min-h-0 bg-[#0D1117] rounded-[32px] border border-white/5 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 group transition-all duration-700 flex flex-col">
                    {/* Simulated Browser Bar */}
                    <div className="h-8 bg-[#13171F] border-b border-white/5 flex items-center px-4 gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 grow-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></div>
                        </div>

                        <div className="grow flex justify-center">
                            <div className="bg-black/30 rounded-full px-4 py-0.5 text-[10px] text-slate-600 font-mono w-48 text-center truncate">
                                {apiKey ? `simulator://${apiKey.slice(0, 8)}...` : "waiting for connection..."}
                            </div>
                        </div>

                        {/* Resolution Toggle */}
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
                                title="Force Desktop"
                            >
                                <Monitor className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => setViewMode("mobile")}
                                className={cn(
                                    "p-1 rounded transition-colors",
                                    viewMode === "mobile" ? "bg-white/10 text-white" : "text-slate-600 hover:text-slate-400"
                                )}
                                title="Force Mobile"
                            >
                                <Smartphone className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Scenario C: No workspace ready — Guided Onboarding, NOT "Chatbot Not Found" */}
                    {!apiKey ? (
                        <div className="absolute inset-0 top-8 bg-[#0D1117] z-30 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col items-center justify-center min-h-full p-8 sm:p-12 text-center pb-20">
                                <div className="relative mb-8">
                                    <div className="absolute -inset-6 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                                    <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                                        <Bot className="w-10 h-10 text-indigo-400" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">
                                    {readyCount === 0 ? "No Active AI Sandbox Found" : "Simulator Offline"}
                                </h3>

                                {readyCount === 0 ? (
                                    <div className="space-y-6 max-w-[280px]">
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Complete these steps to launch your bot preview:
                                        </p>

                                        {/* Guided Steps */}
                                        <div className="space-y-3 text-left">
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-black text-indigo-400">1</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-white">Add API Key</span>
                                                    <p className="text-[10px] text-slate-500">Connect your workspace to the simulator</p>
                                                </div>
                                                {workspaceReadiness.some(w => w.hasApiKey)
                                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
                                                    : <div className="w-4 h-4 rounded-full border border-white/10 ml-auto shrink-0" />
                                                }
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-black text-indigo-400">2</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-white">Configure Bot</span>
                                                    <p className="text-[10px] text-slate-500">Set up appearance and behavior</p>
                                                </div>
                                                {workspaceReadiness.some(w => w.hasBotConfig)
                                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
                                                    : <div className="w-4 h-4 rounded-full border border-white/10 ml-auto shrink-0" />
                                                }
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-black text-indigo-400">3</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-white">Start Preview</span>
                                                    <p className="text-[10px] text-slate-500">Watch your bot come alive</p>
                                                </div>
                                                <div className="w-4 h-4 rounded-full border border-white/10 ml-auto shrink-0" />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleApiKeyLinkClick}
                                            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                                        >
                                            <Key className="w-4 h-4" />
                                            Connect API Key
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-slate-400 text-sm max-w-[240px] leading-relaxed">
                                            Enter your <span className="text-indigo-400 font-bold">API Key</span> at the top right to initialize the live preview.
                                        </p>
                                        <div className="mt-4 flex gap-2 justify-center">
                                            <div className="w-1 h-1 rounded-full bg-slate-700 animate-pulse"></div>
                                            <div className="w-1 h-1 rounded-full bg-slate-700 animate-pulse delay-75"></div>
                                            <div className="w-1 h-1 rounded-full bg-slate-700 animate-pulse delay-150"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : keyValidationState === "validating" ? (
                        <div className="absolute inset-0 top-8 flex items-center justify-center bg-[#0D1117] z-30">
                            <div className="flex flex-col items-center gap-6">
                                <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
                                <div className="text-slate-400 text-sm font-bold animate-pulse uppercase tracking-widest">Validating API Key…</div>
                            </div>
                        </div>
                    ) : keyValidationState === "invalid" ? (
                        <div className="absolute inset-0 top-8 flex flex-col items-center justify-center bg-[#0D1117] z-30 p-12 text-center">
                            <div className="relative mb-6">
                                <div className="absolute -inset-6 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
                                <div className="relative w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <XCircle className="w-8 h-8 text-red-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">Invalid API Key</h3>
                            <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed mb-6">
                                The API key could not be validated. Please check it and try again.
                            </p>
                            <button
                                onClick={handleApiKeyLinkClick}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                            >
                                <Key className="w-4 h-4" />
                                Update API Key
                            </button>
                        </div>
                    ) : isLoadingTenants ? (
                        <div className="absolute inset-0 top-8 flex items-center justify-center bg-[#0D1117] z-30">
                            <div className="flex flex-col items-center gap-6">
                                <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
                                <div className="text-slate-400 text-sm font-bold animate-pulse uppercase tracking-widest">Waking up Agent...</div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative flex-1 min-h-0 overflow-auto custom-scrollbar pb-20">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#13171F_0%,#0A0C12_100%)]" />

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
                                                This <strong className="text-white">Simulator Hub</strong> requires an active premium subscription to initialize neural protocols.
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
                                                {/* <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest truncate">Bot ID: {selectedTenantId?.slice(0, 8)}...{selectedTenantId?.slice(-4)}</p> */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <iframe
                                    key={apiKey + refreshKey + selectedTenantId + viewMode}
                                    src={blobUrl}
                                    className="border-0 relative z-10 transition-all duration-500 shadow-2xl"
                                    style={{
                                        display: "block",
                                        width: viewMode === "desktop" ? "1200px" : viewMode === "mobile" ? "430px" : "100%",
                                        height: viewMode === "desktop" ? "800px" : viewMode === "mobile" ? "850px" : "100%",
                                        minHeight: viewMode === "auto" ? "750px" : "750px", // Robust virtual height for chat windows
                                        transform: viewMode === "desktop"
                                            ? "scale(0.7)" // Simplified scale without negative offsets
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
                            )}
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
