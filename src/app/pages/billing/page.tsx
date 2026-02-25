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
} from "lucide-react";
import { RazorpayPaymentModal } from "@/components/modals/razorpay-payment-modal";
import { useAuth } from "@/context/auth-context";
import { useGeoDetect, formatCurrency } from "@/lib/use-geo-detect";

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
    const { user } = useAuth();
    const geo = useGeoDetect(); // India detection
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
    const [activePlanId, setActivePlanId] = useState<string | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch("/api/plans/public");
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch plans");
            // Only show active plans to customers
            setPlans((data as Plan[]).filter((p) => p.active));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (paymentId: string) => {
        setPaymentSuccess(paymentId);
        setActivePlanId(selectedPlan?.id ?? null);
        setSelectedPlan(null);
    };

    return (
        <div className="flex flex-col gap-8 min-h-[80vh]">
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl p-8"
                style={{
                    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    boxShadow: "0 4px 40px rgba(99,102,241,0.08)",
                }}
            >
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
                        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full"
                        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)" }} />
                </div>

                <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                            Subscription Plans
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">
                        Choose Your Perfect Plan
                    </h1>
                    <p className="text-gray-400 text-base max-w-lg">
                        Unlock the full power of Assistra. Secure payments powered by Razorpay.
                        Cancel anytime, no questions asked.
                    </p>

                    {/* Trust badges */}
                    <div className="flex flex-wrap gap-4 mt-5">
                        {[
                            { icon: Shield, label: "256-bit SSL Encryption" },
                            { icon: RefreshCw, label: "Cancel Anytime" },
                            { icon: CheckCircle2, label: "Instant Activation" },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Icon className="h-3.5 w-3.5 text-indigo-400" />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Geo-detected currency badge */}
                    {!geo.loading && (
                        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                            style={{
                                background: geo.isIndia
                                    ? "rgba(99,102,241,0.12)"
                                    : "rgba(255,255,255,0.05)",
                                border: geo.isIndia
                                    ? "1px solid rgba(99,102,241,0.3)"
                                    : "1px solid rgba(255,255,255,0.08)",
                                color: geo.isIndia ? "#a5b4fc" : "#9ca3af",
                            }}
                        >
                            <MapPin className="h-3 w-3" />
                            {geo.isIndia
                                ? "🇮🇳 Prices shown in ₹ INR · UPI, Cards & more available"
                                : "🌍 Prices shown in USD"}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Success banner ──────────────────────────────────────────── */}
            {paymentSuccess && (
                <div
                    className="flex items-center gap-4 p-5 rounded-2xl"
                    style={{
                        background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.06))",
                        border: "1px solid rgba(34,197,94,0.25)",
                    }}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(34,197,94,0.15)" }}>
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                        <p className="text-green-300 font-semibold">Payment Successful! 🎉</p>
                        <p className="text-green-400/70 text-sm">
                            Your plan has been activated. Payment ID:{" "}
                            <span className="font-mono text-xs">{paymentSuccess}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* ── Error ───────────────────────────────────────────────────── */}
            {error && (
                <div className="p-4 rounded-xl text-red-300 text-sm"
                    style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                    }}>
                    {error}
                    <button onClick={fetchPlans} className="ml-3 underline text-red-400 cursor-pointer">
                        Retry
                    </button>
                </div>
            )}

            {/* ── loading ─────────────────────────────────────────────────── */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
                        <p className="text-gray-500 text-sm">Loading plans…</p>
                    </div>
                </div>
            )}

            {/* ── Plans grid ──────────────────────────────────────────────── */}
            {!loading && plans.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plans.map((plan, i) => {
                        const meta = getPlanMeta(i);
                        const Icon = meta.icon;
                        const isActive = plan.id === activePlanId;
                        const isPopular = meta.badge === "Popular";

                        return (
                            <div
                                key={plan.id}
                                id={`plan-card-${plan.id}`}
                                className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
                                style={{
                                    background: "linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 100%)",
                                    border: isActive
                                        ? `1px solid ${meta.color}`
                                        : `1px solid rgba(255,255,255,0.07)`,
                                    boxShadow: isActive
                                        ? `0 0 30px ${meta.glow}, 0 4px 20px rgba(0,0,0,0.4)`
                                        : "0 4px 20px rgba(0,0,0,0.3)",
                                    transform: isPopular ? "scale(1.02)" : "scale(1)",
                                }}
                            >
                                {/* Top glow line */}
                                <div className="absolute top-0 left-0 right-0 h-px"
                                    style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }} />

                                {/* Badge */}
                                {meta.badge && (
                                    <div className="absolute top-4 right-4">
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                                            style={{
                                                background: `linear-gradient(135deg, ${meta.color}33, ${meta.color}22)`,
                                                border: `1px solid ${meta.color}55`,
                                                color: meta.color,
                                            }}
                                        >
                                            {meta.badge}
                                        </span>
                                    </div>
                                )}

                                {isActive && (
                                    <div className="absolute top-4 left-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                                            style={{
                                                background: "rgba(34,197,94,0.15)",
                                                border: "1px solid rgba(34,197,94,0.3)",
                                                color: "#4ade80",
                                            }}>
                                            ✓ Active
                                        </span>
                                    </div>
                                )}

                                {/* Card content */}
                                <div className="flex-1 p-6 pt-8">
                                    {/* Icon + Name */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                background: `linear-gradient(135deg, ${meta.color}33, ${meta.color}1a)`,
                                                border: `1px solid ${meta.color}44`,
                                                boxShadow: `0 0 20px ${meta.glow}`,
                                            }}
                                        >
                                            <Icon className="h-6 w-6" style={{ color: meta.color }} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg leading-tight">
                                                {plan.name}
                                            </h3>
                                            <p className="text-gray-500 text-xs font-mono">{plan.slug}</p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-extrabold text-white">
                                                {formatCurrency(plan.price_cents, plan.currency, geo.isIndia).display}
                                            </span>
                                            <span className="text-gray-500 text-sm">
                                                {formatInterval(plan.interval, plan.interval_count)}
                                            </span>
                                        </div>
                                        {plan.trial_days > 0 && (
                                            <p className="text-xs mt-1" style={{ color: meta.color }}>
                                                🎁 {plan.trial_days}-day free trial included
                                            </p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {plan.description && (
                                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                            {plan.description}
                                        </p>
                                    )}

                                    {/* Features */}
                                    {plan.features && Object.keys(plan.features).length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                                Includes
                                            </p>
                                            <ul className="space-y-1.5">
                                                {Object.entries(plan.features).flatMap(([category, details]) => {
                                                    if (typeof details !== "object" || !details) return [];
                                                    return Object.entries(details).slice(0, 3).map(([key, value]) => (
                                                        <li
                                                            key={`${category}-${key}`}
                                                            className="flex items-center gap-2 text-sm"
                                                        >
                                                            <CheckCircle2
                                                                className="h-3.5 w-3.5 flex-shrink-0"
                                                                style={{ color: meta.color }}
                                                            />
                                                            <span className="text-gray-300">
                                                                {key.replace(/_/g, " ")}:{" "}
                                                                <span className="text-gray-400 font-medium">
                                                                    {Array.isArray(value)
                                                                        ? value.join(", ")
                                                                        : value === null
                                                                            ? "Unlimited"
                                                                            : typeof value === "boolean"
                                                                                ? value ? "✓" : "✗"
                                                                                : String(value)}
                                                                </span>
                                                            </span>
                                                        </li>
                                                    ));
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* CTA */}
                                <div className="p-6 pt-0">
                                    <button
                                        id={`select-plan-btn-${plan.id}`}
                                        onClick={() => setSelectedPlan(plan)}
                                        disabled={isActive}
                                        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                        style={
                                            isActive
                                                ? {
                                                    background: "rgba(34,197,94,0.1)",
                                                    border: "1px solid rgba(34,197,94,0.3)",
                                                    color: "#4ade80",
                                                }
                                                : {
                                                    background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                                                    boxShadow: `0 6px 20px ${meta.glow}`,
                                                    color: "white",
                                                }
                                        }
                                    >
                                        {isActive ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" /> Current Plan
                                            </>
                                        ) : (
                                            <>
                                                Get Started <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
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
                    onClose={() => setSelectedPlan(null)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}
