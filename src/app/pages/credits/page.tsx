"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Zap,
    AlertTriangle,
    XCircle,
    RefreshCw,
    TrendingUp,
    MessageSquare,
    BarChart3,
    CreditCard,
    ArrowRight,
    Clock,
    Activity,
    CheckCircle2,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";

/* ── Types ───────────────────────────────────────────────────────────────── */

interface CreditBalance {
    credits_total: number;
    credits_used: number;
    credits_remaining: number;
    usage_pct: number;
    estimated_convos_left: number;
    is_exhausted: boolean;
    warn_80: boolean;
    warn_95: boolean;
    recent_usage: RecentUsageEntry[];
    plan_name?: string;
    plan_monthly_credits?: number;
}

interface RecentUsageEntry {
    id: string;
    request_type: string;
    total_tokens: number;
    credits_charged: number;
    model: string;
    status: string;
    created_at: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

function timeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function formatDateTime(isoDate: string): string {
    return new Date(isoDate).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/* ── Gauge Arc Component ────────────────────────────────────────────────── */

function CreditGauge({ pct, isExhausted, warn95, warn80 }: { pct: number; isExhausted: boolean; warn95: boolean; warn80: boolean }) {
    const clampedPct = Math.min(100, Math.max(0, pct));

    const trackColor = isExhausted
        ? "#ef4444"
        : warn95
            ? "#f97316"
            : warn80
                ? "#eab308"
                : "#22d3ee";

    const glowColor = isExhausted
        ? "rgba(239,68,68,0.4)"
        : warn95
            ? "rgba(249,115,22,0.4)"
            : warn80
                ? "rgba(234,179,8,0.4)"
                : "rgba(34,211,238,0.4)";

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const usedOffset = circumference - (clampedPct / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
            {/* Outer glow */}
            <div
                className="absolute inset-0 rounded-full blur-2xl opacity-20 animate-pulse"
                style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
            />

            <svg width="200" height="200" viewBox="0 0 200 200" className="rotate-[-90deg]">
                {/* Background track */}
                <circle
                    cx="100" cy="100" r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="16"
                />
                {/* Used track */}
                <circle
                    cx="100" cy="100" r={radius}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth="16"
                    strokeDasharray={circumference}
                    strokeDashoffset={usedOffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1.2s ease, stroke 0.5s ease", filter: `drop-shadow(0 0 8px ${trackColor})` }}
                />
            </svg>

            {/* Center content */}
            <div className="absolute flex flex-col items-center gap-1">
                <span
                    className="text-5xl font-black"
                    style={{ color: trackColor, textShadow: `0 0 30px ${glowColor}` }}
                >
                    {clampedPct.toFixed(0)}%
                </span>
                <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">used</span>
            </div>
        </div>
    );
}

/* ── Summary Card ────────────────────────────────────────────────────────── */

function SummaryCard({
    icon,
    label,
    value,
    sub,
    color,
    glowColor,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    color: string;
    glowColor: string;
}) {
    return (
        <div
            className="relative flex flex-col gap-3 p-6 rounded-3xl overflow-hidden group transition-transform duration-300 hover:-translate-y-1"
            style={{
                background: "linear-gradient(145deg, #0d0d1a, #131325)",
                border: "1px solid rgba(255,255,255,0.06)",
            }}
        >
            {/* Hover glow */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                style={{ boxShadow: `inset 0 0 40px ${glowColor}15` }}
            />
            <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                    background: `linear-gradient(135deg, ${glowColor}22, ${glowColor}11)`,
                    border: `1px solid ${glowColor}33`,
                }}
            >
                <span style={{ color }}>{icon}</span>
            </div>
            <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{label}</p>
                <p className="text-3xl font-black" style={{ color }}>{value}</p>
                {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function CreditManagementPage() {
    const [data, setData] = useState<CreditBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCredits = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch("/api/credits");
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message || "Failed to load credit data");
            }
            const json: CreditBalance = await res.json();
            setData(json);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCredits();
    }, [fetchCredits]);

    /* ── Loading ────────────────────────────────────────────────────────── */
    if (loading) {
        return (
            <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
                <PageHeader
                    title="Credit Management"
                    description="Monitor your credit usage and manage your plan."
                    icon={Zap}
                    gradient="from-cyan-500 to-indigo-600"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="rounded-3xl p-6 animate-pulse"
                            style={{ background: "linear-gradient(145deg, #0d0d1a, #131325)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                            <div className="w-11 h-11 rounded-2xl bg-white/10 mb-4" />
                            <div className="h-3 w-20 rounded bg-white/10 mb-2" />
                            <div className="h-8 w-32 rounded bg-white/10" />
                        </div>
                    ))}
                </div>
                <div
                    className="rounded-3xl p-8 animate-pulse flex justify-center"
                    style={{ background: "linear-gradient(145deg, #0d0d1a, #131325)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                    <div className="w-[200px] h-[200px] rounded-full bg-white/5" />
                </div>
            </div>
        );
    }

    /* ── Error ──────────────────────────────────────────────────────────── */
    if (error) {
        return (
            <div className="flex flex-col gap-6 p-4 md:p-8 animate-in fade-in duration-500">
                <PageHeader
                    title="Credit Management"
                    description="Monitor your credit usage and manage your plan."
                    icon={Zap}
                    gradient="from-cyan-500 to-indigo-600"
                />
                <div
                    className="flex flex-col items-center gap-4 p-10 rounded-3xl text-center"
                    style={{ background: "linear-gradient(145deg, #180a0a, #0f0a0a)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                    <XCircle className="w-10 h-10 text-red-400" />
                    <p className="text-red-300 font-medium">{error}</p>
                    <button
                        onClick={() => { setLoading(true); fetchCredits(); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const {
        credits_total,
        credits_used,
        credits_remaining,
        usage_pct,
        estimated_convos_left,
        is_exhausted,
        warn_80,
        warn_95,
        recent_usage,
    } = data;

    const remainingPct = Math.max(0, 100 - usage_pct);

    /* ── Status color helpers ────────────────────────────────────────────── */
    const statusColor = is_exhausted
        ? "#ef4444"
        : warn_95
            ? "#f97316"
            : warn_80
                ? "#eab308"
                : "#22d3ee";

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 animate-in fade-in duration-500 pb-16">
            <PageHeader
                title="Credit Management"
                description={
                    data.plan_name
                        ? `${data.plan_name} Plan · ${data.plan_monthly_credits ? `${data.plan_monthly_credits.toLocaleString()} credits/month` : "Credits tracked below"}`
                        : "Monitor your AI credit usage across all chatbots."
                }
                icon={Zap}
                gradient="from-cyan-500 to-indigo-600"
                howItWorks="Credits fuel every AI interaction on Assistra. Each conversation, embedding, or knowledge base lookup consumes a certain number of credits depending on the tokens processed. Your monthly credit limit resets at the start of each billing period. Monitor usage here to avoid interruptions and plan upgrades accordingly."
                actions={
                    <Link
                        href="/pages/billing"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:opacity-90"
                        style={{
                            background: "linear-gradient(135deg, #6366f1, #a855f7)",
                            boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                        }}
                    >
                        <CreditCard className="w-4 h-4" /> Upgrade Plan <ArrowRight className="w-4 h-4" />
                    </Link>
                }
            />

            {/* ── Alert Banner ───────────────────────────────────────────── */}
            {is_exhausted && (
                <div
                    className="flex items-start gap-4 p-5 rounded-2xl animate-in slide-in-from-top fade-in"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}
                >
                    <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-red-300 font-bold text-sm">Credits Exhausted</p>
                        <p className="text-red-400/70 text-xs mt-1">
                            Your chatbots are paused. Upgrade your plan to restore service immediately.
                        </p>
                    </div>
                    <Link
                        href="/pages/billing"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 text-red-300 font-bold text-xs hover:bg-red-500/30 transition-colors flex-shrink-0"
                    >
                        Upgrade Now <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            )}
            {!is_exhausted && warn_95 && (
                <div
                    className="flex items-start gap-4 p-5 rounded-2xl animate-in slide-in-from-top fade-in"
                    style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.3)" }}
                >
                    <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-orange-300 font-bold text-sm">Critical: 95% of Credits Used</p>
                        <p className="text-orange-400/70 text-xs mt-1">
                            You're almost out. Upgrade now to avoid service interruption.
                        </p>
                    </div>
                    <Link
                        href="/pages/billing"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500/20 text-orange-300 font-bold text-xs hover:bg-orange-500/30 transition-colors flex-shrink-0"
                    >
                        Upgrade Plan <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            )}
            {!is_exhausted && !warn_95 && warn_80 && (
                <div
                    className="flex items-start gap-4 p-5 rounded-2xl animate-in slide-in-from-top fade-in"
                    style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)" }}
                >
                    <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-yellow-300 font-bold text-sm">Warning: 80% of Credits Used</p>
                        <p className="text-yellow-400/70 text-xs mt-1">
                            Consider upgrading your plan before you run out.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Summary Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    icon={<BarChart3 className="w-5 h-5" />}
                    label="Total Credits"
                    value={formatNumber(credits_total)}
                    sub={`${credits_total.toLocaleString()} credits this period`}
                    color="#a5b4fc"
                    glowColor="#6366f1"
                />
                <SummaryCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Credits Used"
                    value={formatNumber(credits_used)}
                    sub={`${usage_pct.toFixed(1)}% of your allocation`}
                    color={is_exhausted ? "#f87171" : warn_95 ? "#fb923c" : warn_80 ? "#fbbf24" : "#22d3ee"}
                    glowColor={is_exhausted ? "#ef4444" : warn_95 ? "#f97316" : warn_80 ? "#eab308" : "#22d3ee"}
                />
                <SummaryCard
                    icon={<Zap className="w-5 h-5" />}
                    label="Credits Left"
                    value={formatNumber(credits_remaining)}
                    sub={`${remainingPct.toFixed(1)}% remaining`}
                    color="#34d399"
                    glowColor="#10b981"
                />
                <SummaryCard
                    icon={<MessageSquare className="w-5 h-5" />}
                    label="Est. Conversations"
                    value={formatNumber(estimated_convos_left)}
                    sub="Based on avg usage"
                    color="#c084fc"
                    glowColor="#a855f7"
                />
            </div>

            {/* ── Gauge + Progress Section ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Gauge Card */}
                <div
                    className="relative flex flex-col items-center justify-center gap-6 p-8 rounded-3xl overflow-hidden"
                    style={{
                        background: "linear-gradient(145deg, #0d0d1a, #131325)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    {/* BG glow */}
                    <div
                        className="absolute inset-0 rounded-3xl pointer-events-none"
                        style={{ boxShadow: `inset 0 0 80px ${statusColor}08` }}
                    />

                    <div className="flex items-center gap-2 self-start">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}
                        >
                            <Activity className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">Credit Usage Gauge</h2>
                            <p className="text-[10px] text-slate-500">This billing period</p>
                        </div>
                    </div>

                    <CreditGauge pct={usage_pct} isExhausted={is_exhausted} warn95={warn_95} warn80={warn_80} />

                    {/* Status label */}
                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{
                            background: `${statusColor}15`,
                            border: `1px solid ${statusColor}30`,
                        }}
                    >
                        {is_exhausted ? (
                            <XCircle className="w-3.5 h-3.5" style={{ color: statusColor }} />
                        ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: statusColor }} />
                        )}
                        <span className="text-xs font-bold" style={{ color: statusColor }}>
                            {is_exhausted
                                ? "Credits Exhausted"
                                : warn_95
                                    ? "Critical Level"
                                    : warn_80
                                        ? "Low Credits"
                                        : "Healthy"}
                        </span>
                    </div>
                </div>

                {/* Progress Breakdown Card */}
                <div
                    className="flex flex-col gap-5 p-8 rounded-3xl"
                    style={{
                        background: "linear-gradient(145deg, #0d0d1a, #131325)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
                        >
                            <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">Allocation Breakdown</h2>
                            <p className="text-[10px] text-slate-500">
                                {data.plan_name && (
                                    <>
                                        <span className="text-indigo-400 font-semibold">{data.plan_name}</span>
                                        {data.plan_monthly_credits ? ` · ${data.plan_monthly_credits.toLocaleString()} credits/mo` : ""}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Used bar */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                                Used
                            </span>
                            <span className="font-mono font-bold" style={{ color: statusColor }}>
                                {credits_used.toLocaleString()} <span className="text-slate-600 font-normal">/ {credits_total.toLocaleString()}</span>
                            </span>
                        </div>
                        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${Math.min(100, usage_pct)}%`,
                                    background: is_exhausted
                                        ? "linear-gradient(90deg, #ef4444, #f97316)"
                                        : warn_95
                                            ? "linear-gradient(90deg, #f97316, #eab308)"
                                            : warn_80
                                                ? "linear-gradient(90deg, #eab308, #22d3ee)"
                                                : "linear-gradient(90deg, #22d3ee, #6366f1)",
                                    boxShadow: `0 0 10px ${statusColor}50`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Remaining bar */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                                Remaining
                            </span>
                            <span className="text-emerald-400 font-mono font-bold">
                                {credits_remaining.toLocaleString()} credits
                            </span>
                        </div>
                        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${remainingPct}%`,
                                    background: "linear-gradient(90deg, #10b981, #34d399)",
                                    boxShadow: "0 0 10px rgba(16,185,129,0.4)",
                                }}
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/5" />

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">≈ Tokens</p>
                            <p className="text-lg font-black text-white">{formatNumber(credits_used * 1000)}</p>
                            <p className="text-[10px] text-slate-600">tokens used</p>
                        </div>
                        <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Est. Convos Left</p>
                            <p className="text-lg font-black text-emerald-400">{formatNumber(estimated_convos_left)}</p>
                            <p className="text-[10px] text-slate-600">based on avg usage</p>
                        </div>
                    </div>

                    {/* CTA */}
                    {(is_exhausted || warn_80) && (
                        <Link
                            href="/pages/billing"
                            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white transition-all duration-300 hover:opacity-90 hover:scale-[1.01]"
                            style={{
                                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                                boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                            }}
                        >
                            <CreditCard className="w-4 h-4" />
                            {is_exhausted ? "Restore Credits — Upgrade Now" : "Upgrade for More Credits"}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            </div>

            {/* ── Recent Activity ───────────────────────────────────────── */}
            <div
                className="rounded-3xl overflow-hidden"
                style={{
                    background: "linear-gradient(145deg, #0d0d1a, #131325)",
                    border: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}
                        >
                            <Clock className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">Recent Activity</h2>
                            <p className="text-[10px] text-slate-500">Latest credit transactions</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setLoading(true); fetchCredits(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                </div>

                {/* Table header */}
                {recent_usage.length > 0 && (
                    <div className="grid grid-cols-5 gap-4 px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-t border-white/5">
                        <span className="col-span-2">Request</span>
                        <span>Model</span>
                        <span className="text-center">Tokens</span>
                        <span className="text-right">Credits</span>
                    </div>
                )}

                {/* Rows */}
                <div className="divide-y divide-white/[0.03]">
                    {recent_usage.length > 0 ? (
                        recent_usage.map((entry) => (
                            <div
                                key={entry.id}
                                className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors group"
                            >
                                {/* Request type */}
                                <div className="col-span-2 flex items-center gap-3 min-w-0">
                                    <div
                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.status === "charged"
                                            ? "bg-cyan-400"
                                            : entry.status === "failed"
                                                ? "bg-red-400"
                                                : "bg-slate-600"
                                            }`}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm text-slate-200 capitalize truncate font-medium">
                                            {entry.request_type.replace(/_/g, " ")}
                                        </p>
                                        <p className="text-[10px] text-slate-600">{formatDateTime(entry.created_at)}</p>
                                    </div>
                                </div>

                                {/* Model */}
                                <div className="min-w-0">
                                    <span className="text-xs text-slate-500 truncate block" title={entry.model}>
                                        {entry.model}
                                    </span>
                                </div>

                                {/* Tokens */}
                                <div className="text-center">
                                    <span className="text-xs text-slate-400 font-mono">
                                        {entry.total_tokens.toLocaleString()}
                                    </span>
                                </div>

                                {/* Credits */}
                                <div className="text-right">
                                    <span
                                        className="text-sm font-bold font-mono"
                                        style={{
                                            color: entry.status === "failed" ? "#f87171" : "#22d3ee",
                                        }}
                                    >
                                        -{entry.credits_charged}
                                    </span>
                                    <p className="text-[10px] text-slate-600">{timeAgo(entry.created_at)}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        // Empty state
                        <div className="flex flex-col items-center gap-4 py-16 text-center px-6">
                            <div
                                className="w-16 h-16 rounded-3xl flex items-center justify-center"
                                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
                            >
                                <Activity className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-base mb-1">No activity yet</h3>
                                <p className="text-slate-500 text-sm max-w-xs">
                                    Credit transactions will appear here once your chatbots start handling conversations.
                                </p>
                            </div>
                            <Link
                                href="/pages/chatbot"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-sm hover:bg-indigo-500/20 transition-colors"
                            >
                                Set Up a Chatbot <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer note */}
                {recent_usage.length > 0 && (
                    <div className="px-6 py-4 border-t border-white/5">
                        <p className="text-[10px] text-slate-600">
                            Showing last {recent_usage.length} transactions · Credits refresh monthly with your billing cycle
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
