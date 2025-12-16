"use client";

import React, { useState, useEffect } from "react";
import { Tenant } from "@/types/tenant";
import {
    Plus,
    Edit,
    Building2,
    AlertCircle,
    Users,
    Loader2,
    Bot,
} from "lucide-react";
import Link from "next/link";

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                <Link
                    href="/pages/tenants/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Workspace
                </Link>
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
        </div>
    );
}

function TenantCard({
    tenant,
    getStatusColor,
}: {
    tenant: Tenant;
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
                <Link
                    href={`/pages/tenants/${tenant.id}/edit`}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                    <Edit className="h-4 w-4" />
                </Link>
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

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2">
                <Link
                    href={`/pages/tenants/${tenant.id}/users`}
                    className="flex items-center justify-center gap-2 text-sm p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                >
                    <Users className="h-4 w-4" />
                    Users
                </Link>
                <Link
                    href={`/pages/tenants/${tenant.id}/chatbots`}
                    className="flex items-center justify-center gap-2 text-sm p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                >
                    <Bot className="h-4 w-4" />
                    Chatbots
                </Link>
            </div>
        </div>
    );
}
