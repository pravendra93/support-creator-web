"use client";

import React from "react";
import { ChatbotConfig } from "@/components/tenants/chatbot-config";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TenantChatbotPage() {
    const params = useParams();
    const tenantId = params.id as string;

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto py-8">
            <div className="flex items-center gap-4">
                <Link
                    href="/pages/tenants"
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Chatbot Configuration</h1>
                    <p className="text-muted-foreground">
                        Manage the AI assistant for this workspace
                    </p>
                </div>
            </div>

            <ChatbotConfig tenantId={tenantId} />
        </div>
    );
}
