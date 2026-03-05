"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, AlertCircle, Loader2, Search, Calendar, Building2, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getErrorMessage } from "@/lib/utils";
import { AdminSubscription } from "@/types/admin";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/subscriptions?limit=100&offset=0");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch subscriptions");
            }

            setSubscriptions(data);
            setError("");
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const filteredSubscriptions = subscriptions.filter(sub =>
        sub.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.tenant_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "default";
            case "cancelled":
            case "canceled":
                return "destructive";
            case "expired":
                return "secondary";
            case "pending":
                return "outline";
            default:
                return "outline";
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Subscriptions"
                description="Monitor all tenant subscriptions and plans"
                icon={CreditCard}
                howItWorks="Manage and monitor all active and past subscriptions across all workspaces. This view provides details on billing periods, plan types, and cancellation statuses. You can search by workspace name or plan type."
                gradient="from-purple-500 to-pink-500"
            />

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search subscriptions..."
                        className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={fetchSubscriptions}
                    className="text-sm text-primary hover:underline font-medium"
                >
                    Refresh
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
                <div className="border rounded-xl bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Workspace</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Billing Period</TableHead>
                                <TableHead>Next Renewal/Expiry</TableHead>
                                <TableHead>Created At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSubscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span className="font-bold">{sub.tenant_name || "Unknown Workspace"}</span>
                                                <span className="text-[10px] font-mono text-muted-foreground">{sub.tenant_id}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium capitalize">{sub.plan}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{sub.plan_id.slice(0, 8)}...</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(sub.status) as any} className="capitalize py-0.5">
                                            {sub.status}
                                        </Badge>
                                        {sub.cancel_at_period_end && (
                                            <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-500 font-medium whitespace-nowrap">
                                                <Clock className="h-2.5 w-2.5" />
                                                Cancelling
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(sub.current_period_start)}
                                            </div>
                                            <div className="text-[10px] text-center w-fit mx-auto px-1">to</div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(sub.current_period_end)}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium">
                                            {formatDate(sub.expires_at)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDate(sub.created_at)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && filteredSubscriptions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No subscriptions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
