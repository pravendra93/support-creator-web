"use client";

import { TenantForm } from "@/components/tenants/tenant-form";
import { TenantCreate } from "@/types/tenant";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewWorkspacePage() {
    const handleCreate = async (data: TenantCreate | any) => {
        const response = await fetch("/api/tenants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create workspace");
        }
    };

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
                    <h1 className="text-2xl font-bold tracking-tight">Create New Workspace</h1>
                    <p className="text-muted-foreground">
                        Set up a new organization to manage support
                    </p>
                </div>
            </div>

            <TenantForm onSubmit={handleCreate} />
        </div>
    );
}
