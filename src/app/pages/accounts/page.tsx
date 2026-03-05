"use client";

import React, { useState, useEffect } from "react";
import { Users, AlertCircle, Loader2, Search, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getErrorMessage } from "@/lib/utils";
import { AdminAccount } from "@/types/admin";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<AdminAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/accounts");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch accounts");
            }

            setAccounts(data);
            setError("");
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const filteredAccounts = accounts.filter(account =>
        account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${account.first_name} ${account.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Accounts"
                description="Manage all platform user accounts"
                icon={Users}
                howItWorks="This page provides a comprehensive list of all user accounts across the entire platform. You can monitor user status, roles, subscription plans, and tenant associations. Use the search bar to find specific users by name or email."
                gradient="from-blue-500 to-cyan-500"
            />

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search accounts..."
                        className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={fetchAccounts}
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
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Workspace ID</TableHead>
                                <TableHead>Subscription</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAccounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold">{account.first_name} {account.last_name}</span>
                                            <span className="text-xs text-muted-foreground">{account.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {account.role.replace("_", " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {account.tenant_id ? account.tenant_id.slice(0, 8) + "..." : "N/A"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant={account.is_subscribed ? "default" : "secondary"} className="w-fit">
                                                {account.plan_name || "No Plan"}
                                            </Badge>
                                            {account.plan_slug && (
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold px-1">
                                                    {account.plan_slug}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {account.is_active ? (
                                            <div className="flex items-center gap-1.5 text-green-500 font-medium text-xs">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Active
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-xs">
                                                <XCircle className="h-3.5 w-3.5" />
                                                Inactive
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(account.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && filteredAccounts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No accounts found.
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
