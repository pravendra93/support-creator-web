"use client";

import React, { useState, useEffect } from "react";
import { Tenant, TenantCreate, TenantUpdate } from "@/types/tenant";
import {
    Plus,
    Edit,
    Building2,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
    Users,
} from "lucide-react";

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/tenants`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch workspaces");
            }

            setTenants(data);
            setError("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTenant = async (tenantData: TenantCreate) => {
        try {
            const response = await fetch("/api/tenants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tenantData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create workspace");
            }

            setShowCreateModal(false);
            fetchTenants();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleUpdateTenant = async (tenantId: string, updates: TenantUpdate) => {
        try {
            const response = await fetch(`/api/tenants/${tenantId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update tenant");
            }

            setEditingTenant(null);
            fetchTenants();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "text-green-600 bg-green-50 border-green-200";
            case "suspended":
                return "text-red-600 bg-red-50 border-red-200";
            case "pending":
                return "text-yellow-600 bg-yellow-50 border-yellow-200";
            default:
                return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage organizations and their configurations
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    Add Workspace
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                /* Tenants Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenants.map((tenant) => (
                        <TenantCard
                            key={tenant.id}
                            tenant={tenant}
                            onEdit={() => setEditingTenant(tenant)}
                            getStatusColor={getStatusColor}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && tenants.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No Workspaces found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create your first workspace to get started
                    </p>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <TenantModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={(data) => handleCreateTenant(data as TenantCreate)}
                />
            )}

            {/* Edit Modal */}
            {editingTenant && (
                <TenantModal
                    tenant={editingTenant}
                    onClose={() => setEditingTenant(null)}
                    onSubmit={(data) => handleUpdateTenant(editingTenant.id, data as TenantUpdate)}
                />
            )}
        </div>
    );
}

function TenantCard({
    tenant,
    onEdit,
    getStatusColor,
}: {
    tenant: Tenant;
    onEdit: () => void;
    getStatusColor: (status: string) => string;
}) {
    return (
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-card">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">{tenant.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(
                                tenant.status
                            )}`}
                        >
                            {tenant.status.toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-medium">
                            {tenant.plan.toUpperCase()}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onEdit}
                    className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                >
                    <Edit className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Workspace ID:</span>
                    <span className="font-mono text-xs">{tenant.id.slice(0, 8)}...</span>
                </div>
                {tenant.owner_account_id && (
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Owner ID:</span>
                        <span className="font-mono text-xs">
                            {tenant.owner_account_id.slice(0, 8)}...
                        </span>
                    </div>
                )}
                {tenant.created_at && (
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="text-xs">
                            {new Date(tenant.created_at).toLocaleDateString()}
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t">
                <a
                    href={`/pages/tenants/${tenant.id}/users`}
                    className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    <Users className="h-4 w-4" />
                    Manage Users
                </a>
            </div>
        </div>
    );
}

function TenantModal({
    tenant,
    onClose,
    onSubmit,
}: {
    tenant?: Tenant;
    onClose: () => void;
    onSubmit: (data: TenantCreate | TenantUpdate) => void;
}) {
    const [formData, setFormData] = useState<TenantCreate>({
        name: tenant?.name || "",
        owner_account_id: tenant?.owner_account_id || "",
        status: tenant?.status || "pending",
        plan: tenant?.plan || "trial",
    });

    const [accounts, setAccounts] = useState<any[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Remove owner_account_id if it's empty string
        const submitData = {
            ...formData,
            owner_account_id: formData.owner_account_id || undefined,
        };
        onSubmit(submitData);
    };

    const getAccountDisplayName = (account: any) => {
        if (account.first_name || account.last_name) {
            return `${account.first_name || ""} ${account.last_name || ""}`.trim();
        }
        return account.email;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-md w-full">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">
                        {tenant ? "Update Workspace" : "Create Workspace"}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
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
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Owner Account
                        </label>
                        <select
                            value={formData.owner_account_id}
                            onChange={(e) =>
                                setFormData({ ...formData, owner_account_id: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                            disabled={loadingAccounts}
                        >
                            <option value="">-- No Owner (Optional) --</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {getAccountDisplayName(account)} ({account.email})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                            {loadingAccounts
                                ? "Loading accounts..."
                                : "Optional: Select the account that owns this workspace"}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
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
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Plan
                        </label>
                        <input
                            type="text"
                            value={formData.plan}
                            onChange={(e) =>
                                setFormData({ ...formData, plan: e.target.value })
                            }
                            placeholder="e.g., trial, pro, enterprise"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            {tenant ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
