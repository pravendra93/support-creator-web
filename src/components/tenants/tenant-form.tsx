"use client";

import React, { useState, useEffect } from "react";
import { Tenant, TenantCreate, TenantUpdate } from "@/types/tenant";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TenantFormProps {
    initialData?: Tenant;
    onSubmit: (data: TenantCreate | TenantUpdate) => Promise<void>;
    isEditing?: boolean;
}

export function TenantForm({ initialData, onSubmit, isEditing = false }: TenantFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<TenantCreate>({
        name: initialData?.name || "",
        owner_account_id: initialData?.owner_account_id || "",
        status: initialData?.status || "pending",
        plan: initialData?.plan || "trial",
    });

    const [accounts, setAccounts] = useState<any[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoadingAccounts(true);
            const response = await fetch("/api/accounts");
            if (response.ok) {
                const data = await response.json();
                setAccounts(data);
            }
        } catch (err) {
            console.error("Failed to fetch accounts:", err);
        } finally {
            setLoadingAccounts(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        // Remove owner_account_id if it's empty string
        const submitData = {
            ...formData,
            owner_account_id: formData.owner_account_id || undefined,
        };

        try {
            await onSubmit(submitData);
            router.push("/pages/tenants");
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const getAccountDisplayName = (account: any) => {
        if (account.first_name || account.last_name) {
            return `${account.first_name || ""} ${account.last_name || ""}`.trim();
        }
        return account.email;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-card p-6 rounded-lg border">
            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium">
                    Workspace Name *
                </label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Acme Corporation"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">
                    Owner Account
                </label>
                <select
                    value={formData.owner_account_id}
                    onChange={(e) =>
                        setFormData({ ...formData, owner_account_id: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loadingAccounts}
                >
                    <option value="">-- No Owner (Optional) --</option>
                    {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                            {getAccountDisplayName(account)} ({account.email})
                        </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground">
                    {loadingAccounts
                        ? "Loading accounts..."
                        : "Optional: Select the account that owns this workspace"}
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">
                    Status
                </label>
                <select
                    value={formData.status}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            status: e.target.value as any,
                        })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">
                    Plan
                </label>
                <input
                    type="text"
                    value={formData.plan}
                    onChange={(e) =>
                        setFormData({ ...formData, plan: e.target.value })
                    }
                    placeholder="e.g., trial, pro, enterprise"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
                >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isEditing ? "Update Workspace" : "Create Workspace"}
                </button>
            </div>
        </form>
    );
}
