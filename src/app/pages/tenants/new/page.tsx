"use client";

import { TenantForm } from "@/components/tenants/tenant-form";
import { TenantCreate } from "@/types/tenant";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Building2 } from "lucide-react";

export default function NewWorkspacePage() {
    const handleCreate = async (data: TenantCreate | any) => {
        const response = await fetch("/api/tenants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || errorData.message || "Failed to create workspace");
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto py-8">
            <PageHeader
                title="New Workspace"
                description="Set up a new organization to manage AI support."
                icon={Building2}
                gradient="from-emerald-500 to-green-600"
                howItWorks="A workspace is the root container for your AI project. When you create one, we initialize a dedicated environment, a specific database schema for its knowledge base, and unique authentication keys. You can specify a custom domain (optional) which determines the identifier for your embedded widgets. All data within this workspace remains strictly isolated from others."
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

            <TenantForm onSubmit={handleCreate} />
        </div>
    );
}
