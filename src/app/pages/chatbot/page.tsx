"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { ChatBotTest } from "@/components/chatbot/chatbot-test";
import { ChatBotConfig } from "@/components/chatbot/chatbot-config";
import { NoWorkspaceState } from "@/components/shared/no-workspace-state";
import { MessageSquare, Settings as SettingsIcon } from "lucide-react";

interface Tenant {
    id: string;
    name: string;
}

function ChatBotContent() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoadingTenants, setIsLoadingTenants] = useState(true);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const urlTenantId = searchParams.get('tenantId');

    // Fetch Tenants
    useEffect(() => {
        const loadTenants = async () => {
            try {
                setIsLoadingTenants(true);
                const res = await fetch("/api/tenants");
                if (res.ok) {
                    const data = await res.json();
                    setTenants(data);

                    if (urlTenantId) {
                        setSelectedTenantId(urlTenantId);
                    } else if (data.length > 0) {
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
    }, [user, urlTenantId]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ChatBot Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Configure and test your chatbot with your knowledge base data.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {(user?.role === 'super_admin' || user?.role === 'platform_user' || user?.role === 'tenant_admin') && tenants.length > 0 && (
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

            {!selectedTenantId ? (
                tenants.length === 0 && !isLoadingTenants ? (
                    <NoWorkspaceState message="You need a workspace to manage your chatbot." />
                ) : (
                    <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-dashed text-center">
                        <p className="text-muted-foreground">Please select a workspace to view chatbot settings.</p>
                    </div>
                )
            ) : (
                <Tabs defaultValue="test" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="test" className="gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Chat Playground
                        </TabsTrigger>
                        <TabsTrigger value="config" className="gap-2">
                            <SettingsIcon className="h-4 w-4" />
                            Configuration
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="test">
                        <ChatBotTest tenantId={selectedTenantId} />
                    </TabsContent>
                    <TabsContent value="config">
                        <ChatBotConfig tenantId={selectedTenantId} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

export default function ChatBotPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <p className="text-muted-foreground">Loading ChatBot...</p>
            </div>
        }>
            <ChatBotContent />
        </Suspense>
    );
}
