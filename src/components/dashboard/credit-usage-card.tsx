"use client";

import { useEffect, useState, useCallback } from "react";
import { Zap, AlertTriangle, XCircle, RefreshCw, TrendingUp, MessageSquare, BarChart3 } from "lucide-react";
import Link from "next/link";

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

/* ── Gauge Arc Component ────────────────────────────────────────────────── */

function CreditGauge({ pct, isExhausted, warn95 }: { pct: number; isExhausted: boolean; warn95: boolean }) {
    const clampedPct = Math.min(100, Math.max(0, pct));

    // Pick color based on state
    const trackColor = isExhausted
        ? "#ef4444"
        : warn95
            ? "#f97316"
            : clampedPct >= 80
                ? "#eab308"
                : "#22d3ee";

    const glowColor = isExhausted
        ? "rgba(239,68,68,0.4)"
        : warn95
            ? "rgba(249,115,22,0.4)"
            : clampedPct >= 80
                ? "rgba(234,179,8,0.4)"
                : "rgba(34,211,238,0.4)";

    // SVG arc for the progress ring
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const usedOffset = circumference - (clampedPct / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
            {/* Outer glow */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse"
                style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
            />

            <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
                {/* Background track */}
                <circle
                    cx="70" cy="70" r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="12"
                />
                {/* Used track */}
                <circle
                    cx="70" cy="70" r={radius}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={usedOffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
                />
            </svg>

            {/* Center text */}
            <div className="absolute flex flex-col items-center">
                <span
                    className="text-2xl font-black"
                    style={{ color: trackColor, textShadow: `0 0 20px ${glowColor}` }}
                >
                    {clampedPct.toFixed(0)}%
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">used</span>
            </div>
        </div>
    );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export function CreditUsageCard() {
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

    /* ── Loading skeleton ─────────────────────────────────────────────── */
    if (loading) {
        return (
            <div
                className="rounded-2xl p-6 border border-white/5 animate-pulse"
                style={{ background: "linear-gradient(145deg, #0a0a14 0%, #111124 100%)" }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-white/10" />
                    <div className="h-4 w-32 rounded bg-white/10" />
                </div>
                <div className="flex justify-center mb-4">
                    <div className="w-[140px] h-[140px] rounded-full bg-white/5" />
                </div>
                <div className="space-y-2">
                    <div className="h-3 rounded bg-white/10 w-full" />
                    <div className="h-3 rounded bg-white/10 w-3/4" />
                </div>
            </div>
        );
    }

    /* ── Error state ──────────────────────────────────────────────────── */
    if (error) {
        return (
            <div
                className="rounded-2xl p-6 border border-red-500/20 flex flex-col items-center gap-3 text-center"
                style={{ background: "linear-gradient(145deg, #0f0a0a, #180a0a)" }}
            >
                <XCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
                <button
                    onClick={() => { setLoading(true); fetchCredits(); }}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                    <RefreshCw className="w-3 h-3" /> Retry
                </button>
            </div>
        );
    }

    if (!data) return null;

    const { credits_total, credits_used, credits_remaining, usage_pct, estimated_convos_left, is_exhausted, warn_80, warn_95, recent_usage } = data;

    /* ── Alert Banner (80% / 95% / exhausted) ───────────────────────── */
    const AlertBanner = () => {
        if (is_exhausted) {
            return (
                <div className="flex items-start gap-3 p-3 rounded-xl border border-red-500/30 bg-red-500/10 mb-4">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-red-300">Credits Exhausted</p>
                        <p className="text-[11px] text-red-400/70 mt-0.5">
                            Chat is paused. Upgrade your plan to continue.
                        </p>
                        <Link
                            href="/pages/billing"
                            className="inline-flex items-center gap-1 mt-2 text-[11px] font-black text-red-300 bg-red-500/20 hover:bg-red-500/30 transition-colors px-2 py-1 rounded-md"
                        >
                            Upgrade Now →
                        </Link>
                    </div>
                </div>
            );
        }
        if (warn_95) {
            return (
                <div className="flex items-start gap-3 p-3 rounded-xl border border-orange-500/30 bg-orange-500/10 mb-4">
                    <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-orange-300">Critical: 95% Used</p>
                        <p className="text-[11px] text-orange-400/70 mt-0.5">
                            Almost out. Upgrade soon to avoid interruption.
                        </p>
                        <Link
                            href="/pages/billing"
                            className="inline-flex items-center gap-1 mt-2 text-[11px] font-black text-orange-300 bg-orange-500/20 hover:bg-orange-500/30 transition-colors px-2 py-1 rounded-md"
                        >
                            Upgrade Plan →
                        </Link>
                    </div>
                </div>
            );
        }
        if (warn_80) {
            return (
                <div className="flex items-start gap-3 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 mb-4">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-yellow-300">Warning: 80% Used</p>
                        <p className="text-[11px] text-yellow-400/70 mt-0.5">
                            Consider upgrading before you run out.
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className="rounded-2xl border border-white/5 overflow-hidden"
            style={{ background: "linear-gradient(145deg, #0a0a14 0%, #111124 100%)" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.2))", border: "1px solid rgba(34,211,238,0.2)" }}>
                        <Zap className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Credit Usage</h3>
                        <p className="text-[10px] text-slate-500">
                            {data.plan_name
                                ? <><span className="text-indigo-400 font-semibold">{data.plan_name}</span>{data.plan_monthly_credits ? ` · ${data.plan_monthly_credits.toLocaleString()} credits/mo` : ""}</>
                                : "This billing period"
                            }
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchCredits(); }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="px-5 pb-5">
                {/* Alert Banner */}
                <AlertBanner />

                {/* Gauge */}
                <div className="flex justify-center my-2">
                    <CreditGauge pct={usage_pct} isExhausted={is_exhausted} warn95={warn_95} />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mt-4 mb-5">
                    <StatCell
                        icon={<BarChart3 className="w-3 h-3" />}
                        label="Total"
                        value={formatNumber(credits_total)}
                        color="text-slate-300"
                    />
                    <StatCell
                        icon={<TrendingUp className="w-3 h-3" />}
                        label="Used"
                        value={formatNumber(credits_used)}
                        color={is_exhausted ? "text-red-400" : warn_95 ? "text-orange-400" : "text-cyan-400"}
                    />
                    <StatCell
                        icon={<MessageSquare className="w-3 h-3" />}
                        label="~Convos"
                        value={formatNumber(estimated_convos_left)}
                        color="text-emerald-400"
                    />
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Remaining</span>
                        <span className="text-slate-400 font-mono">{formatNumber(credits_remaining)} credits</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                                width: `${Math.max(0, 100 - usage_pct)}%`,
                                background: is_exhausted
                                    ? "linear-gradient(90deg, #ef4444, #f97316)"
                                    : warn_95
                                        ? "linear-gradient(90deg, #f97316, #eab308)"
                                        : warn_80
                                            ? "linear-gradient(90deg, #eab308, #22d3ee)"
                                            : "linear-gradient(90deg, #22d3ee, #6366f1)",
                            }}
                        />
                    </div>
                </div>

                {/* Recent usage log */}
                {recent_usage.length > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Recent Activity
                        </p>
                        <div className="space-y-1.5">
                            {recent_usage.slice(0, 5).map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.status === "charged" ? "bg-cyan-400" : entry.status === "failed" ? "bg-red-400" : "bg-slate-500"}`} />
                                        <span className="text-slate-400 truncate capitalize">
                                            {entry.request_type}
                                        </span>
                                        <span className="text-slate-600 hidden sm:inline">
                                            {entry.total_tokens.toLocaleString()} tokens
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-slate-400 font-mono">-{entry.credits_charged}</span>
                                        <span className="text-slate-600">{timeAgo(entry.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {credits_total === 0 && (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                        <Zap className="w-6 h-6 text-slate-600" />
                        <p className="text-xs text-slate-500">No credits allocated yet.</p>
                        <Link
                            href="/pages/billing"
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            Choose a plan →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function StatCell({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <span className={`${color} opacity-70`}>{icon}</span>
            <span className={`text-sm font-black ${color}`}>{value}</span>
            <span className="text-[9px] text-slate-600 uppercase tracking-widest">{label}</span>
        </div>
    );
}
