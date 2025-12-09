"use client";

import React, { useState, useEffect } from "react";
import { TenantUser, TenantUserInvite } from "@/types/tenant";
import {
    Plus,
    Mail,
    UserCheck,
    UserX,
    Loader2,
    AlertCircle,
    ArrowLeft,
    Shield,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function TenantUsersPage() {
    const params = useParams();
    const router = useRouter();
    const tenantId = params.id as string;

    const [users, setUsers] = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showInviteModal, setShowInviteModal] = useState(false);

    useEffect(() => {
        if (tenantId) {
            fetchUsers();
        }
    }, [tenantId]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/tenants/${tenantId}/users`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch users");
            }

            setUsers(data);
            setError("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteUser = async (inviteData: TenantUserInvite) => {
        try {
            const response = await fetch(`/api/tenants/${tenantId}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inviteData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to invite user");
            }

            setShowInviteModal(false);
            setSuccess("Invitation sent successfully!");
            setTimeout(() => setSuccess(""), 5000);
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role.toLowerCase()) {
            case "admin":
            case "tenant_admin":
            case "sub_admin":
                return "text-purple-600 bg-purple-50 border-purple-200";
            case "viewer":
                return "text-blue-600 bg-blue-50 border-blue-200";
            default:
                return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => router.push("/pages/tenants")}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Tenants
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight">Tenant Users</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage sub-users and team members for this tenant
                    </p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Mail className="h-4 w-4" />
                    Invite User
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    {success}
                </div>
            )}

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
                /* Users Table */
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4 font-semibold">User</th>
                                <th className="text-left p-4 font-semibold">Email</th>
                                <th className="text-left p-4 font-semibold">Role</th>
                                <th className="text-left p-4 font-semibold">Status</th>
                                <th className="text-left p-4 font-semibold">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map((user) => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    getRoleBadgeColor={getRoleBadgeColor}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {!loading && users.length === 0 && (
                <div className="text-center py-12 border rounded-lg">
                    <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No users found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Invite your first team member to get started
                    </p>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteUserModal
                    onClose={() => setShowInviteModal(false)}
                    onSubmit={handleInviteUser}
                />
            )}
        </div>
    );
}

function UserRow({
    user,
    getRoleBadgeColor,
}: {
    user: TenantUser;
    getRoleBadgeColor: (role: string) => string;
}) {
    return (
        <tr className="hover:bg-muted/30 transition-colors">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium">
                            {user.first_name || user.last_name
                                ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                                : "No name"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                            {user.id.slice(0, 8)}...
                        </p>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <p className="text-sm">{user.email}</p>
            </td>
            <td className="p-4">
                <span
                    className={`text-xs px-2 py-1 rounded-full border font-medium ${getRoleBadgeColor(
                        user.role
                    )}`}
                >
                    {user.role.toUpperCase()}
                </span>
            </td>
            <td className="p-4">
                {user.is_active ? (
                    <div className="flex items-center gap-1 text-green-600">
                        <UserCheck className="h-4 w-4" />
                        <span className="text-sm">Active</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-gray-400">
                        <UserX className="h-4 w-4" />
                        <span className="text-sm">Inactive</span>
                    </div>
                )}
            </td>
            <td className="p-4">
                <p className="text-sm text-muted-foreground">
                    {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A"}
                </p>
            </td>
        </tr>
    );
}

function InviteUserModal({
    onClose,
    onSubmit,
}: {
    onClose: () => void;
    onSubmit: (data: TenantUserInvite) => void;
}) {
    const [formData, setFormData] = useState<TenantUserInvite>({
        email: "",
        role: "viewer",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-md w-full">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">Invite User</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Send an invitation to join this tenant
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Email Address *
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="user@example.com"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Role
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) =>
                                setFormData({ ...formData, role: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="viewer">Viewer</option>
                            <option value="admin">Admin</option>
                            <option value="sub_admin">Sub Admin</option>
                            <option value="tenant_admin">Tenant Admin</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Select the permission level for this user
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                            <strong>Note:</strong> An invitation email will be sent to the user
                            with a link to set up their account.
                        </p>
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
                            Send Invite
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
