"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, CheckCircle2, AlertCircle } from "lucide-react";

interface UserProfile {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role?: string;
    created_at?: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
    });

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setFormData({
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                });
            } else {
                throw new Error("Failed to load profile");
            }
        } catch (err) {
            setError("Could not load user profile.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/auth/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                throw new Error("Failed to update profile");
            }

            const updated = await res.json();
            setProfile(updated);
            setSuccess("Profile updated successfully!");
        } catch (err) {
            setError("Failed to update profile. Please try again.");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const getInitials = () => {
        if (!profile) return "U";
        const first = formData.first_name?.[0] || profile.first_name?.[0] || "";
        const last = formData.last_name?.[0] || profile.last_name?.[0] || "";
        return (first + last).toUpperCase() || "U";
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-6 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    My Profile
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                <Card className="h-fit bg-gradient-to-br from-card to-secondary/20 border-secondary/50 shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                            <Avatar className="h-24 w-24 relative ring-4 ring-background shadow-xl">
                                <AvatarImage src="" />
                                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <CardTitle>{formData.first_name} {formData.last_name}</CardTitle>
                        <CardDescription>{profile?.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Separator className="my-4" />
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Account ID</span>
                                <span className="font-mono text-xs truncate max-w-[150px]" title={profile?.id}>{profile?.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Role</span>
                                <span className="font-medium">
                                    {profile?.role === 'super_admin' ? 'Admin' :
                                        profile?.role === 'platform_user' ? 'Platform User' :
                                            profile?.role || 'User'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Member Since</span>
                                <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-secondary/50 shadow-md">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Update your personal details here.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleUpdate}>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <div className="font-semibold pl-2">Error</div>
                                    <AlertDescription className="pl-2">{error}</AlertDescription>
                                </Alert>
                            )}
                            {success && (
                                <Alert className="border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300">
                                    <CheckCircle2 className="h-4 w-4 stroke-green-600 dark:stroke-green-400" />
                                    <div className="font-semibold pl-2">Success</div>
                                    <AlertDescription className="pl-2">{success}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    placeholder="Enter your first name"
                                    className="bg-background/50 focus:bg-background transition-colors"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    placeholder="Enter your last name"
                                    className="bg-background/50 focus:bg-background transition-colors"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    value={profile?.email || ""}
                                    disabled
                                    className="opacity-70"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Email cannot be changed directly. Contact support if needed.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 border-t bg-muted/20 p-6">
                            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {saving ? "Saving Changes..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
