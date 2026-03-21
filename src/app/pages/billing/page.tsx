"use client";

import React, { useState, useEffect } from "react";
import { Plan } from "@/types/plan";
import {
    Loader2,
    CheckCircle2,
    Zap,
    Star,
    Crown,
    Shield,
    ArrowRight,
    Sparkles,
    RefreshCw,
    MapPin,
    Gift,
    RotateCcw,
} from "lucide-react";
import { RazorpayPaymentModal } from "@/components/modals/razorpay-payment-modal";
import { useAuth } from "@/context/auth-context";
import { useGeoDetect, formatCurrency } from "@/lib/use-geo-detect";
import { getErrorMessage } from "@/lib/utils";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatInterval(interval: string, count: number) {
    if (interval === "one_time") return "one-time";
    const unit = interval === "month" ? "mo" : "yr";
    return count === 1 ? `/${unit}` : `/every ${count} ${unit}s`;
}

/* Plan-tier icon/colour config */
function getPlanMeta(index: number) {
    const metas = [
        { icon: Zap, color: "#6366f1", glow: "rgba(99,102,241,0.35)", badge: null },
        { icon: Star, color: "#a855f7", glow: "rgba(168,85,247,0.35)", badge: "Popular" },
        { icon: Crown, color: "#f59e0b", glow: "rgba(245,158,11,0.35)", badge: "Best Value" },
    ];
    return metas[index % metas.length];
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function BillingPage() {
    const { user, checkAuth } = useAuth();
    const geo = useGeoDetect(); // India detection
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
    const [activePlanId, setActivePlanId] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");

    // Compute active plan price dynamically
    const activePlanPriceCents = React.useMemo(() => {
        if (!user?.plan_slug || plans.length === 0) return 0;
        const current = plans.find(p => p.slug === user.plan_slug);
        return current ? current.price_cents : 0;
    }, [user?.plan_slug, plans]);

    useEffect(() => {
        fetchPlans();
    }, []);

    // When user data loads (or updates after payment), set the active plan
    useEffect(() => {
        if (user?.plan_slug && plans.length > 0) {
            const active = plans.find(p => p.slug === user.plan_slug);
            if (active) setActivePlanId(active.id);
        }
    }, [user?.plan_slug, plans]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch("/api/plans/public");
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch plans");
            // Only show active plans to customers
            const publicPlans = (data as Plan[]).filter((p) => p.active);
            setPlans(publicPlans);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    // Filter plans based on billing cycle
    const filteredPlans = React.useMemo(() => {
        const isTrial = (p: Plan) =>
            p.slug.toLowerCase().includes('trial') ||
            p.slug.toLowerCase().includes('free') ||
            (p.trial_days > 0 && p.interval === 'one_time');

        if (billingCycle === 'month') {
            // Monthly: Trial + 2 monthly paid plans
            const trialPlans = plans.filter(isTrial);
            const monthlyPaid = plans.filter(p =>
                p.interval === 'month' &&
                p.price_cents > 0 &&
                !isTrial(p)
            );
            const result: Plan[] = [];
            if (trialPlans.length > 0) result.push(trialPlans[0]);
            result.push(...monthlyPaid.slice(0, 2));
            return result;
        }

        // Yearly: NO trial plan. Take monthly paid plans and compute yearly price with 20% discount
        const monthlyPaid = plans.filter(p =>
            p.interval === 'month' &&
            p.price_cents > 0 &&
            !isTrial(p)
        );

        return monthlyPaid.slice(0, 2).map(p => ({
            ...p,
            // Yearly price = monthly × 12 × 0.8 (20% discount)
            price_cents: Math.round(p.price_cents * 12 * 0.8),
            // Store original monthly price for strikethrough display
            _monthly_price_cents: p.price_cents,
            interval: 'year' as const,
            interval_count: 1,
        }));
    }, [plans, billingCycle]);

    const handlePaymentSuccess = async (paymentId: string) => {
        setPaymentSuccess(paymentId);
        setActivePlanId(selectedPlan?.id ?? null);
        setSelectedPlan(null);
        // Re-fetch user profile so auth context reflects the new subscription
        await checkAuth();
    };

    return (
        <div className="flex flex-col gap-10 min-h-[80vh] pb-20">
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl p-10"
                style={{
                    background: "linear-gradient(135deg, #0a0a12 0%, #111122 50%, #0a0a12 100%)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                }}
            >
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[100px] opacity-20"
                        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-[100px] opacity-10"
                        style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">
                            Premium Subscriptions
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Scale</span> Your Support?
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mb-8 leading-relaxed">
                        Choose the plan that fits your needs. All plans include our core AI engine features.
                        No hidden fees, cancel anytime.
                    </p>

                    {/* ── Billing Toggle ──────────────────────────────────────── */}
                    <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
                        <button
                            onClick={() => setBillingCycle("month")}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${billingCycle === "month"
                                ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                : "text-gray-400 hover:text-white"
                                } cursor-pointer`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("year")}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative ${billingCycle === "year"
                                ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                : "text-gray-400 hover:text-white"
                                } cursor-pointer`}
                        >
                            Yearly
                            <span className="absolute -top-3 -right-2 bg-emerald-500 text-[9px] text-white px-2 py-0.5 rounded-full font-black animate-bounce">
                                SAVE 20%
                            </span>
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center gap-6 mt-10">
                        {[
                            { icon: Shield, label: "Secure SSL" },
                            { icon: RefreshCw, label: "Cancel Anytime" },
                            { icon: CheckCircle2, label: "Instant Setup" },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                <Icon className="h-4 w-4 text-indigo-400/60" />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Success/Error Banners ───────────────────────────────────── */}
            <div className="max-w-4xl mx-auto w-full px-4">
                {paymentSuccess && (
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 animate-in fade-in slide-in-from-top-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-emerald-400 font-bold">Plan Activated Successfully! 🎉</p>
                            <p className="text-emerald-400/60 text-sm">Welcome aboard. Your subscription is now active.</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
                        <p className="text-red-400 text-sm font-medium">{error}</p>
                        <button onClick={fetchPlans} className="text-xs font-bold text-red-400 hover:underline px-3 py-1 bg-red-500/10 rounded-lg">
                            Retry
                        </button>
                    </div>
                )}
            </div>

            {/* ── Plans grid ──────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-400 animate-pulse" />
                    </div>
                    <p className="text-gray-500 font-medium animate-pulse">Curating your experience...</p>
                </div>
            ) : filteredPlans.length > 0 ? (
                <div className={`grid grid-cols-1 ${filteredPlans.length === 2 ? 'md:grid-cols-2 max-w-5xl' : 'md:grid-cols-3 max-w-7xl'} gap-8 mx-auto w-full px-6`}>
                    {filteredPlans.map((plan, i) => {
                        const meta = getPlanMeta(i);
                        const Icon = meta.icon;
                        const isActive = plan.id === activePlanId;
                        const isMain = i === 1; // Middle card
                        const isPending = pendingPlan?.id === plan.id;

                        return (
                            <div
                                key={plan.id}
                                onClick={() => !isActive && setPendingPlan(plan)}
                                className={`group relative flex flex-col rounded-[2.5rem] p-8 transition-all duration-300 cursor-pointer border-2 ${isPending
                                    ? "border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.3)] scale-[1.02] z-20"
                                    : isMain
                                        ? "border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.1)] hover:border-indigo-500/50 hover:scale-[1.01]"
                                        : "border-white/5 hover:border-white/20 hover:scale-[1.01]"
                                    } ${isActive ? "opacity-75 cursor-default hover:scale-100" : ""}`}
                                style={{
                                    background: isMain
                                        ? "linear-gradient(145deg, #111122 0%, #1a1a35 100%)"
                                        : "linear-gradient(145deg, #0a0a12 0%, #111122 100%)",
                                }}
                            >
                                {/* Glow Effect on Hover */}
                                <div className="absolute inset-0 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{ boxShadow: `inset 0 0 40px ${meta.color}15` }} />

                                {isMain && !isPending && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-20">
                                        Most Popular
                                    </div>
                                )}
                                {isPending && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-20 animate-in fade-in zoom-in">
                                        Selected
                                    </div>
                                )}

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-8">
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
                                            style={{
                                                background: `linear-gradient(135deg, ${meta.color}33, ${meta.color}11)`,
                                                border: `1px solid ${meta.color}44`,
                                            }}
                                        >
                                            <Icon className="h-7 w-7" style={{ color: meta.color }} />
                                        </div>
                                        {isActive && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Active
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                        {plan.description || "The perfect starting point for your journey."}
                                    </p>

                                    {/* ── Price block: Trial vs Regular ── */}
                                    {(plan.slug.toLowerCase().includes('trial') || plan.slug.toLowerCase().includes('free') || (plan.trial_days > 0 && plan.interval === 'one_time')) ? (
                                        /* ── Trial Plan: Special creative layout ── */
                                        <div className="mb-8 p-6 rounded-3xl relative overflow-hidden"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.08))",
                                                border: "1px solid rgba(99,102,241,0.25)",
                                            }}
                                        >
                                            {/* Shimmer accent */}
                                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-30"
                                                style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />

                                            <div className="relative z-10">
                                                {/* Trial duration badge */}
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 mb-4">
                                                    <Zap className="h-3 w-3 text-emerald-400 fill-current" />
                                                    <span className="text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                                                        {plan.trial_days} Day Free Trial
                                                    </span>
                                                </div>

                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black text-white">
                                                        {formatCurrency(plan.price_cents, plan.currency, geo.isIndia).display}
                                                    </span>
                                                </div>

                                                {/* Refundable deposit callout */}
                                                <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                        style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}>
                                                        <RotateCcw className="h-4 w-4 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-emerald-400 text-xs font-bold">Fully Refundable Deposit</p>
                                                        <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
                                                            This small verification charge will be refunded when you upgrade to a paid plan.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ── Regular Plan: Standard price display ── */
                                        <div className="mb-8 p-6 rounded-3xl bg-white/5 border border-white/5">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-white">
                                                    {formatCurrency(plan.price_cents, plan.currency, geo.isIndia).display}
                                                </span>
                                                <span className="text-gray-500 text-sm font-medium">
                                                    {formatInterval(plan.interval, plan.interval_count)}
                                                </span>
                                            </div>
                                            {/* Show original undiscounted yearly price (struck through) for yearly plans */}
                                            {billingCycle === 'year' && (plan as any)._monthly_price_cents && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-gray-500 text-sm line-through">
                                                        {formatCurrency(
                                                            (plan as any)._monthly_price_cents * 12,
                                                            plan.currency,
                                                            geo.isIndia
                                                        ).display}/yr
                                                    </span>
                                                    <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                        Save 20%
                                                    </span>
                                                </div>
                                            )}
                                            {plan.trial_days > 0 && (
                                                <div className="mt-3 flex items-center gap-2 text-indigo-400 font-bold text-xs">
                                                    <Zap className="h-3 w-3 fill-current" />
                                                    {plan.trial_days} Days Free Trial
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── Feature List ─────────────────────────── */}
                                    <div className="flex-1 space-y-3 mb-10">

                                        {/* Credit Highlight Block — always shown first */}
                                        {plan.features?.credits?.monthly_credits && (
                                            <div
                                                className="p-4 rounded-2xl mb-4"
                                                style={{
                                                    background: "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(99,102,241,0.08))",
                                                    border: "1px solid rgba(34,211,238,0.2)",
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="h-4 w-4 text-cyan-400 fill-current" />
                                                        <span className="text-xs font-black text-cyan-300 uppercase tracking-widest">
                                                            Monthly Credits
                                                        </span>
                                                    </div>
                                                    {plan.features?.credits?.rollover && (
                                                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                            Rolls Over
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-3xl font-black text-white">
                                                    {plan.features.credits.monthly_credits.toLocaleString()}
                                                </p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                    <p className="text-[11px] text-cyan-400/70">
                                                        ≈ {(plan.features.credits.monthly_credits * 1000).toLocaleString()} tokens
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        ~{plan.features.credits.monthly_credits.toLocaleString()} conversations
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Curated limit rows */}
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            What&apos;s included:
                                        </p>
                                        <ul className="space-y-2.5">
                                            {/* Team */}
                                            {plan.features?.team?.max_users && (
                                                <FeatureRow
                                                    icon="👥"
                                                    label="Team members"
                                                    value={plan.features.team.max_users >= 9999 ? "Unlimited" : `Up to ${plan.features.team.max_users}`}
                                                />
                                            )}
                                            {/* KB storage */}
                                            {plan.features?.knowledge_base?.max_storage_mb && (
                                                <FeatureRow
                                                    icon="🗂️"
                                                    label="Knowledge base"
                                                    value={
                                                        plan.features.knowledge_base.max_storage_mb >= 51200
                                                            ? "50 GB storage"
                                                            : plan.features.knowledge_base.max_storage_mb >= 1024
                                                                ? `${Math.round(plan.features.knowledge_base.max_storage_mb / 1024)} GB storage`
                                                                : `${plan.features.knowledge_base.max_storage_mb} MB storage`
                                                    }
                                                />
                                            )}
                                            {/* Files */}
                                            {plan.features?.knowledge_base?.max_files && (
                                                <FeatureRow
                                                    icon="📄"
                                                    label="Max files"
                                                    value={plan.features.knowledge_base.max_files >= 9999 ? "Unlimited" : `${plan.features.knowledge_base.max_files} files`}
                                                />
                                            )}
                                            {/* Analytics retention */}
                                            {plan.features?.analytics?.retention_days && (
                                                <FeatureRow
                                                    icon="📊"
                                                    label="Analytics history"
                                                    value={plan.features.analytics.retention_days >= 9999 ? "Unlimited" : `${plan.features.analytics.retention_days} days`}
                                                />
                                            )}
                                            {/* Support SLA */}
                                            {plan.features?.support && (
                                                <FeatureRow
                                                    icon={plan.features.support.priority_support ? "🚀" : "💬"}
                                                    label="Support"
                                                    value={
                                                        plan.features.support.priority_support
                                                            ? `Priority (${plan.features.support.sla ?? "fast"} response)`
                                                            : plan.features.support.sla
                                                                ? `Email (${plan.features.support.sla} response)`
                                                                : "Community"
                                                    }
                                                />
                                            )}
                                            {/* Overage */}
                                            {plan.features?.billing?.overage_allowed !== undefined && (
                                                <FeatureRow
                                                    icon={plan.features.billing.overage_allowed ? "✅" : "🔒"}
                                                    label="Credit overage"
                                                    value={plan.features.billing.overage_allowed ? "Allowed" : "Not allowed"}
                                                />
                                            )}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // prevent card click from un-selecting
                                            setSelectedPlan(plan);
                                        }}
                                        disabled={isActive}
                                        className={`group/btn relative w-full py-4 rounded-2xl font-black text-sm transition-all duration-300 overflow-hidden ${isActive
                                            ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                                            : isPending
                                                ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                                                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl hover:shadow-indigo-500/20"
                                            }`}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isActive ? (
                                                <><CheckCircle2 className="h-4 w-4" /> Current Plan</>
                                            ) : isPending ? (
                                                <>Checkout Selected Plan <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" /></>
                                            ) : (plan.slug.toLowerCase().includes('trial') || plan.slug.toLowerCase().includes('free') || (plan.trial_days > 0 && plan.interval === 'one_time')) ? (
                                                <>Start Free Trial <Gift className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" /></>
                                            ) : user?.is_subscribed ? (
                                                <>Select to Upgrade <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" /></>
                                            ) : (
                                                <>Select Plan <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" /></>
                                            )}
                                        </span>
                                        {!isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                        <Zap className="h-10 w-10 text-indigo-400" />
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">No active plans found</h3>
                    <p className="text-gray-500 max-w-sm">We're updating our offers. Please check back in a few minutes.</p>
                </div>
            )}

            {/* ── Empty state ─────────────────────────────────────────────── */}
            {!loading && plans.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <Zap className="h-8 w-8 text-indigo-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-1">No Plans Available</h3>
                    <p className="text-gray-500 text-sm">
                        There are no active plans at this time. Please check back soon.
                    </p>
                </div>
            )}

            {/* ── Razorpay Payment Modal ───────────────────────────────────── */}
            {selectedPlan && (
                <RazorpayPaymentModal
                    plan={selectedPlan}
                    isIndia={geo.isIndia}
                    billingCycle={billingCycle}
                    currentPlanPriceCents={activePlanPriceCents}
                    onClose={() => {
                        setSelectedPlan(null);
                        setPendingPlan(null);
                    }}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}

/* ── FeatureRow sub-component ───────────────────────────────────────────── */
function FeatureRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <li className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base flex-shrink-0 leading-none">{icon}</span>
                <span className="text-gray-400 text-sm truncate">{label}</span>
            </div>
            <span className="text-gray-200 text-sm font-semibold text-right flex-shrink-0">{value}</span>
        </li>
    );
}
