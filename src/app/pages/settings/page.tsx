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
    Info,
    LayoutDashboard
} from 'lucide-react';
import { PageHeader } from "@/components/shared/page-header";

export default function SettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<TenantSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [noTenant, setNoTenant] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            if (!user.id) return;

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
            <div className="flex flex-col gap-6 animate-pulse p-6">
                <div className="h-24 w-full bg-[#13171F]/50 rounded-3xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 bg-[#13171F]/50 rounded-3xl border border-white/5"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col gap-4 p-6">
                <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
                <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
                    <XCircle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (noTenant) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    title="Settings"
                    description="Manage your plan and account preferences."
                    icon={LayoutDashboard}
                    gradient="from-slate-500 to-slate-700"
                    howItWorks="Settings provide a detailed overview of your current plan, resource limits, and feature availability. Since you are not currently associated with a workspace, these details are unavailable."
                />
                <div className="mt-8 flex flex-col items-center justify-center py-20 border border-dashed rounded-3xl bg-[#13171F]/50 border-white/10 text-center space-y-4">
                    <div className="p-4 bg-white/5 rounded-full">
                        <Info className="w-10 h-10 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-slate-200">No workspace associated</p>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">You are not currently associated with a valid tenant plan.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!settings) return null;

    const { name, features } = settings;

    const FeatureSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
        <Card className="overflow-hidden border border-white/5 shadow-2xl bg-[#13171F]/50 backdrop-blur-xl rounded-3xl transition-all duration-300 hover:border-white/10">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-200">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="grid gap-4">
                {children}
            </CardContent>
        </Card>
    );

    const FeatureItem = ({ label, value, info }: { label: string, value: React.ReactNode, info?: string }) => {
        let displayValue = value;
        if (value === true) displayValue = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        if (value === false) displayValue = <XCircle className="w-4 h-4 text-rose-500" />;
        if (value === null || value === undefined) displayValue = "N/A";

        return (
            <div className="flex justify-between items-center text-sm border-b border-white/[0.03] pb-3 last:border-0 last:pb-0">
                <span className="text-slate-400 flex items-center gap-2">
                    {label}
                    {info && (
                        <div className="group relative">
                            <Info className="w-3.5 h-3.5 text-slate-600 cursor-help hover:text-slate-400 transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-black border border-white/10 text-slate-200 text-xs rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-xl">
                                {info}
                            </div>
                        </div>
                    )}
                </span>
                <span className="font-bold text-slate-200">{displayValue}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 pb-10 p-6">
            <PageHeader
                title="Plan Settings"
                description="Manage your plan and account preferences."
                icon={LayoutDashboard}
                gradient="from-slate-600 to-slate-900"
                howItWorks="This page provides a clear view of your subscription's core features and limitations. You can monitor your daily API request usage, storage capacity for documents, and allowed AI models. If you reach these limits, the system will prevent further usage until the reset period (e.g., end of month) or until you upgrade to a higher tier."
                actions={
                    <Badge variant="outline" className="text-sm px-6 py-2.5 bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-black rounded-2xl uppercase tracking-widest shadow-lg shadow-indigo-500/5">
                        {name} Plan
                    </Badge>
                }
            />

            <Separator className="bg-white/5" />

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
                            <span className="text-xs text-slate-500 uppercase font-black tracking-widest">Allowed Models</span>
                            <div className="flex flex-wrap gap-2">
                                {features.model_limits.allowed_models?.map((model: string) => (
                                    <Badge key={model} variant="secondary" className="text-[10px] bg-white/5 text-slate-200 border-white/5">{model}</Badge>
                                ))}
                            </div>
                        </div>
                        <Separator className="my-1 bg-white/5" />
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

            <div className="mt-4 p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 text-sm text-slate-400 flex items-start gap-4 shadow-2xl">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <Info className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-200">Need more?</h4>
                    <p className="mt-1 leading-relaxed">If you need higher limits or enterprise features, please contact our support team to discuss custom plans tailored to your needs.</p>
                </div>
            </div>
        </div>
    );
}
