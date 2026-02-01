"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Key, Copy, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ApiKey } from "@/types/api-key";
import { CreateApiKeyModal } from "@/components/api-keys/create-api-key-modal";
import { AlertModal } from "@/components/modals/alert-modal";
import { NoWorkspaceState } from "@/components/shared/no-workspace-state";

export default function ApiKeysPage() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [hasTenants, setHasTenants] = useState<boolean | null>(null);

    // Delete Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchApiKeys = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/api-keys");
            if (response.ok) {
                const data = await response.json();
                setApiKeys(Array.isArray(data) ? data : (data.items || []));
            }
        } catch (error) {
            console.error("Failed to fetch API keys:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkTenants();
        fetchApiKeys();
    }, [fetchApiKeys]);

    const checkTenants = async () => {
        try {
            const response = await fetch("/api/tenants");
            if (response.ok) {
                const data = await response.json();
                setHasTenants(Array.isArray(data) && data.length > 0);
            }
        } catch (error) {
            console.error("Failed to check tenants:", error);
        }
    };

    const handleCopy = (key: string, id: string) => {
        navigator.clipboard.writeText(key);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteClick = (apiKey: ApiKey) => {
        setKeyToDelete(apiKey);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!keyToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/api-keys/${keyToDelete.id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                fetchApiKeys();
                setDeleteModalOpen(false);
                setKeyToDelete(null);
            }
        } catch (error) {
            console.error("Failed to delete API key:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredKeys = apiKeys.filter((key) =>
        key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 p-6">
            <AlertModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                loading={isDeleting}
                title="Delete API Key"
                description={`Are you sure you want to delete API key "${keyToDelete?.name}"?`}
            />

            <CreateApiKeyModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchApiKeys}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your API keys for programmatic access
                    </p>
                </div>
                {hasTenants && (
                    <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary/90 cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" /> Create API-Key
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search API keys..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="cursor-pointer">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead>Workspace</TableHead>
                            <TableHead>API Key</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filteredKeys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-96 text-center p-0">
                                    {hasTenants === false ? (
                                        <NoWorkspaceState message="You need a workspace to create API keys." />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            No API keys found.
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredKeys.map((apiKey) => (
                                <TableRow key={apiKey.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Key className="h-4 w-4 text-primary" />
                                            {apiKey.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{apiKey.tenant_name || apiKey.tenant_id}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-muted px-2 py-1 rounded text-xs">
                                                {apiKey.key.slice(0, 8)}...{apiKey.key.slice(-4)}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleCopy(apiKey.key, apiKey.id)}
                                            >
                                                {copiedId === apiKey.id ? (
                                                    <Check className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={apiKey.is_active ? "default" : "secondary"}
                                            className={apiKey.is_active ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" : ""}
                                        >
                                            {apiKey.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(apiKey.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDeleteClick(apiKey)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
