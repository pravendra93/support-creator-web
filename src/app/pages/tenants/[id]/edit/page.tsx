"use client";

import React, { useEffect, useState } from "react";
import { TenantForm } from "@/components/tenants/tenant-form";
import { ChatbotConfig } from "@/components/tenants/chatbot-config";
import { Tenant, TenantUpdate } from "@/types/tenant";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PageHeader } from "@/components/shared/page-header";
import { Settings } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

export default function EditWorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (params.id) {
            fetchTenant(params.id as string);
        }
    }, [params.id]);

    const fetchTenant = async (id: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/tenants/${id}`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to fetch workspace");
            }
            const data = await response.json();
            setTenant(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (data: TenantUpdate | any) => {
        const response = await fetch(`/api/tenants/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update workspace");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2 max-w-4xl mx-auto mt-8">
                <AlertCircle className="h-4 w-4" />
                {error}
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Workspace not found
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto py-8">
            <PageHeader
                title={`Edit: ${tenant.name}`}
                description="Manage workspace settings and configuration."
                icon={Settings}
                gradient="from-slate-600 to-slate-800"
                howItWorks="Update your organization's core details here. In 'Settings', you can modify the display name or status. In 'Chatbot', you can fine-tune the AI's specific instructions for this workspace. Remember that changes to the domain name might affect your existing widget embeds."
                actions={
                    <Link
                        href="/pages/tenants"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Workspaces
                    </Link>
                }
            />

            <Tabs defaultValue="settings" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-[#13171F] border border-white/5 p-1 rounded-2xl h-12">
                    <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all">Settings</TabsTrigger>
                    <TabsTrigger value="chatbot" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all">Chatbot</TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-6">
                    <TenantForm
                        initialData={tenant}
                        isEditing={true}
                        onSubmit={handleUpdate}
                    />
                </TabsContent>

                <TabsContent value="chatbot" className="mt-6">
                    <ChatbotConfig tenantId={tenant.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
