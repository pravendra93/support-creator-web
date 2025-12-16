"use client";

import React, { useEffect, useState } from "react";
import { TenantForm } from "@/components/tenants/tenant-form";
import { ChatbotConfig } from "@/components/tenants/chatbot-config";
import { Tenant, TenantUpdate } from "@/types/tenant";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        } catch (err: any) {
            setError(err.message);
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <div className="flex items-center gap-4">
                <Link
                    href="/pages/tenants"
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Workspace</h1>
                    <p className="text-muted-foreground">
                        Manage workspace settings and configuration
                    </p>
                </div>
            </div>

            <Tabs defaultValue="settings" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
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
