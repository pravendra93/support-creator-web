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

import { PageHeader } from "@/components/shared/page-header";
import { Bot } from "lucide-react";

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
            <PageHeader
                title="AI Customization"
                description="Configure and test your chatbot's personality and logic."
                icon={Bot}
                gradient="from-fuchsia-500 to-purple-600"
                howItWorks="Tailor your AI's behavior to match your brand. In the 'Configuration' tab, you can set the system prompt (instructions), temperature (creativity level), and response style. The 'Playground' allows you to test these settings in real-time before deploying to your customers. Changes made here take effect instantly across all your embedded widgets."
                actions={(user?.role === 'super_admin' || user?.role === 'platform_user' || user?.role === 'tenant_admin') && tenants.length > 0 && (
                    <Select value={selectedTenantId || ""} onValueChange={setSelectedTenantId}>
                        <SelectTrigger className="w-[220px] bg-[#13171F] border-white/5 rounded-xl h-12 font-bold shadow-lg">
                            <SelectValue placeholder="Select Workspace" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#13171F] border-white/5 text-white">
                            {tenants.map((t) => (
                                <SelectItem key={t.id} value={t.id} className="cursor-pointer hover:bg-white/5">
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />

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
