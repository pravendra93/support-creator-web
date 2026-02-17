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
import { Loader2 } from "lucide-react";
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
                    // Default to first tenant
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
        <div className="flex flex-col gap-6 p-6 h-[calc(100vh-60px)]">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bot Preview</h1>
                    <p className="text-muted-foreground mt-1">
                        Live preview of your chatbot widget as it appears on client websites.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {tenants.length > 0 && (
                        <Select value={selectedTenantId || ""} onValueChange={setSelectedTenantId}>
                            <SelectTrigger className="w-[200px] cursor-pointer">
                                <SelectValue placeholder="Select Workspace" />
                            </SelectTrigger>
                            <SelectContent>
                                {tenants.map((t) => (
                                    <SelectItem key={t.id} value={t.id} className="cursor-pointer">
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            <div className="flex-1 w-full bg-slate-100 rounded-xl border overflow-hidden relative shadow-inner">
                {isLoadingTenants ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !selectedTenantId ? (
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                        {tenants.length === 0 ? (
                            <NoWorkspaceState message="You need a workspace to preview your chatbot." />
                        ) : (
                            <div className="text-center text-muted-foreground">
                                Please select a workspace to preview.
                            </div>
                        )}
                    </div>
                ) : (
                    <iframe
                        key={selectedTenantId}
                        src={`/preview-embed?tenant_id=${selectedTenantId}`}
                        className="w-full h-full border-0"
                        title="Chatbot Preview"
                    />
                )}
            </div>
        </div>
    );
}

export default function PreviewBotPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <PreviewBotContent />
        </Suspense>
    );
}
