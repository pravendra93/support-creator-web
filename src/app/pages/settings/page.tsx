"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { TenantSettings } from '@/types/plan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Users,
    Zap,
    CreditCard,
    Headphones,
    Cpu,
    Database,
    CheckCircle2,
    XCircle,
    Info
} from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<TenantSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [noTenant, setNoTenant] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) {
                return;
            }

            if (!user.id) {
                return;
            }

            try {
                const tenantId = user.tenant_id;

                if (!tenantId) {
                    setNoTenant(true);
                    setLoading(false);
                    return;
                }
                const response = await fetch(`/api/tenants/${tenantId}/settings`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || "Failed to fetch settings");
                }

                const data = await response.json();
                setSettings(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col gap-4 animate-pulse">
                <div className="h-8 w-48 bg-muted rounded"></div>
                <div className="h-4 w-64 bg-muted rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 bg-muted rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
                    <XCircle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (noTenant) {
        return (
            <div className="flex flex-col gap-6 pb-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your plan and account preferences.</p>
                </div>
                <Separator />
                <div className="mt-8 flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/10 text-center space-y-3">
                    <Info className="w-10 h-10 text-muted-foreground" />
                    <p className="text-lg font-medium">We don't have appropriate settings for you.</p>
                    <p className="text-sm text-muted-foreground">You are not currently associated with a valid tenant plan.</p>
                </div>
            </div>
        );
    }

    if (!settings) return null;

    const { name, features } = settings;

    const FeatureSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/50">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="grid gap-4">
                {children}
            </CardContent>
        </Card>
    );

    const FeatureItem = ({ label, value, info }: { label: string, value: React.ReactNode, info?: string }) => {
        let displayValue = value;
        if (value === true) displayValue = <CheckCircle2 className="w-4 h-4 text-green-500" />;
        if (value === false) displayValue = <XCircle className="w-4 h-4 text-red-500" />;
        if (value === null || value === undefined) displayValue = "N/A";

        return (
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                    {label}
                    {info && (
                        <div className="group relative">
                            <Info className="w-3 h-3 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {info}
                            </div>
                        </div>
                    )}
                </span>
                <span className="font-medium">{displayValue}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 pb-10">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your plan and account preferences.</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-1 bg-primary/5 border-primary/20 text-primary font-semibold">
                    {name} Plan
                </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Team Section */}
                {features.team && (
                    <FeatureSection title="Team" icon={Users}>
                        <FeatureItem label="Max Users" value={features.team.max_users} />
                    </FeatureSection>
                )}

                {/* Usage Section */}
                {features.usage && (
                    <FeatureSection title="Usage" icon={Zap}>
                        <FeatureItem label="Daily Requests" value={features.usage.max_requests_per_day} />
                        <FeatureItem label="Requests/Min" value={features.usage.max_requests_per_minute} />
                        <FeatureItem label="Monthly Conv." value={features.usage.max_conversations_per_month} />
                    </FeatureSection>
                )}

                {/* Billing Section */}
                {features.billing && (
                    <FeatureSection title="Billing" icon={CreditCard}>
                        <FeatureItem label="Overage Allowed" value={features.billing.overage_allowed} />
                        <FeatureItem label="Daily Spend Limit" value={`$${features.billing.daily_spend_limit_usd}`} />
                        <FeatureItem label="Monthly Spend Limit" value={`$${features.billing.monthly_spend_limit_usd}`} />
                    </FeatureSection>
                )}

                {/* Model Limits Section */}
                {features.model_limits && (
                    <FeatureSection title="AI Models" icon={Cpu}>
                        <div className="space-y-2">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Allowed Models</span>
                            <div className="flex flex-wrap gap-2">
                                {features.model_limits.allowed_models?.map(model => (
                                    <Badge key={model} variant="secondary" className="text-[10px]">{model}</Badge>
                                ))}
                            </div>
                        </div>
                        <Separator className="my-1" />
                        <FeatureItem label="Max Chunks/Query" value={features.model_limits.max_chunks_per_query} />
                        <FeatureItem label="Max Tokens/Req" value={features.model_limits.max_tokens_per_request} />
                    </FeatureSection>
                )}

                {/* Knowledge Base Section */}
                {features.knowledge_base && (
                    <FeatureSection title="Knowledge Base" icon={Database}>
                        <FeatureItem label="Max Files" value={features.knowledge_base.max_files} />
                        <FeatureItem label="Storage Limit" value={`${features.knowledge_base.max_storage_mb} MB`} />
                        <FeatureItem label="Total Chunks" value={features.knowledge_base.max_chunks_total} />
                    </FeatureSection>
                )}

                {/* Support Section */}
                {features.support && (
                    <FeatureSection title="Support" icon={Headphones}>
                        <FeatureItem label="SLA" value={features.support.sla} />
                        <FeatureItem label="Priority Support" value={features.support.priority_support} />
                    </FeatureSection>
                )}
            </div>

            <div className="mt-4 p-4 rounded-xl border bg-muted/30 text-sm text-muted-foreground flex items-start gap-3">
                <Info className="w-5 h-5 mt-0.5 text-primary" />
                <div>
                    <h4 className="font-semibold text-foreground">Need more?</h4>
                    <p>If you need higher limits or enterprise features, please contact our support team to discuss custom plans tailored to your needs.</p>
                </div>
            </div>
        </div>
    );
}
