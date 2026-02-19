"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Plan, PlanFeatures } from "@/types/plan";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatPrice(priceCents: number, interval: Plan["interval"]): string {
    if (priceCents === 0) return "Free";
    const dollars = priceCents / 100;
    return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
}

function intervalLabel(plan: Plan): string {
    if (plan.price_cents === 0) return "";
    if (plan.interval === "one_time") return "";
    if (plan.interval === "year") return "/yr";
    return "/mo";
}

/** Convert the nested features object into a human-readable bullet list */
function deriveFeatureList(features: PlanFeatures | undefined | null): string[] {
    if (!features) return [];
    const items: string[] = [];

    // Support simple flat shapes (older plans like starter-yearly / pro-yearly)
    if (typeof features.support === "string") {
        items.push(`Support: ${features.support}`);
    }
    if (typeof features.history_days === "number") {
        items.push(`${features.history_days}-day history`);
    }
    if (typeof features.concurrent_chats === "number") {
        items.push(`${features.concurrent_chats} concurrent chats`);
    }

    // Nested shapes
    if (features.team?.max_users) {
        items.push(`Up to ${features.team.max_users} team member${features.team.max_users > 1 ? "s" : ""}`);
    }
    if (features.usage?.max_conversations_per_month) {
        items.push(`${features.usage.max_conversations_per_month.toLocaleString()} conversations/mo`);
    }
    if (features.usage?.max_requests_per_day) {
        items.push(`${features.usage.max_requests_per_day.toLocaleString()} requests/day`);
    }
    if (features.knowledge_base?.max_files) {
        items.push(`${features.knowledge_base.max_files} knowledge-base files`);
    }
    if (features.knowledge_base?.max_storage_mb) {
        const gb = features.knowledge_base.max_storage_mb >= 1000
            ? `${(features.knowledge_base.max_storage_mb / 1000).toFixed(0)} GB`
            : `${features.knowledge_base.max_storage_mb} MB`;
        items.push(`${gb} storage`);
    }
    if (features.model_limits?.allowed_models?.length) {
        items.push(`Models: ${features.model_limits.allowed_models.join(", ")}`);
    }
    if (features.analytics?.retention_days) {
        items.push(`${features.analytics.retention_days}-day analytics retention`);
    }
    if (typeof features.billing?.overage_allowed === "boolean") {
        items.push(features.billing.overage_allowed ? "Overage allowed" : "No overage charges");
    }
    if (features.support && typeof features.support === "object") {
        if (features.support.priority_support) items.push("Priority support");
        if (features.support.sla) items.push(`SLA: ${features.support.sla}`);
    }
    return items;
}

// Plans that should be visually highlighted as "popular"
const POPULAR_SLUGS = new Set(["pro-monthly", "pro-yearly"]);

// ─── component ───────────────────────────────────────────────────────────────

type IntervalFilter = "month" | "year" | "one_time";

export default function Pricing() {
    const [isVisible, setIsVisible] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [intervalFilter, setIntervalFilter] = useState<IntervalFilter>("month");
    const sectionRef = useRef<HTMLDivElement>(null);

    // Intersection observer for fade-in animation
    useEffect(() => {
        const ref = sectionRef.current;
        if (!ref) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.1 }
        );
        observer.observe(ref);
        return () => observer.disconnect();
    }, []);

    // Fetch plans from the public API
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        fetch("/api/plans/public", { signal: controller.signal })
            .then(async (res) => {
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.message ?? "Failed to load plans");
                }
                return res.json() as Promise<Plan[]>;
            })
            .then((data) => {
                // Only show active plans
                setPlans(data.filter((p) => p.active));
            })
            .catch((err) => {
                if (err.name !== "AbortError") setError(err.message);
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, []);

    // Determine which intervals are available so we can show/hide the toggle
    const availableIntervals = Array.from(new Set(plans.map((p) => p.interval)));
    const showToggle = availableIntervals.includes("month") && availableIntervals.includes("year");

    const visiblePlans = plans.filter((p) => {
        if (p.interval === "one_time") return intervalFilter === "month"; // show free with monthly
        return p.interval === intervalFilter;
    });

    return (
        <section id="pricing" ref={sectionRef} className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-purple-600/5 blur-[150px]" />

            <div className="container relative">
                {/* Header */}
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-400 backdrop-blur-sm">
                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                        Pricing
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                        Simple,{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            transparent
                        </span>{" "}
                        pricing
                    </h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Choose the plan that fits your needs. No hidden fees. Cancel anytime.
                    </p>
                </div>

                {/* Monthly / Yearly toggle */}
                {showToggle && (
                    <div className="flex items-center justify-center mt-8 gap-1 p-1 rounded-full bg-white/5 border border-white/10 w-fit mx-auto">
                        {(["month", "year"] as const).map((iv) => (
                            <button
                                key={iv}
                                onClick={() => setIntervalFilter(iv)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${intervalFilter === iv
                                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20"
                                    : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                {iv === "month" ? "Monthly" : "Yearly"}
                                {iv === "year" && (
                                    <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                        Save 20%
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                        <span className="text-sm">Loading plans…</span>
                    </div>
                )}

                {/* Error state */}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                        <span className="text-sm text-red-400">{error}</span>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-xs text-purple-400 underline underline-offset-2 hover:text-purple-300 cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Plans grid */}
                {!loading && !error && (
                    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 lg:gap-8">
                        {visiblePlans.map((plan, index) => {
                            const popular = POPULAR_SLUGS.has(plan.slug);
                            const features = deriveFeatureList(plan.features);
                            const price = formatPrice(plan.price_cents, plan.interval);
                            const suffix = intervalLabel(plan);

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                        } ${popular
                                            ? "border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-transparent shadow-2xl shadow-purple-500/10 scale-[1.02]"
                                            : "border-white/5 bg-slate-900/30 hover:border-white/15"
                                        }`}
                                    style={{ transitionDelay: `${index * 150}ms` }}
                                >
                                    {popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-purple-500/25">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    {/* Title & description */}
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                        {plan.description && (
                                            <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-white">{price}</span>
                                        {suffix && (
                                            <span className="text-sm text-muted-foreground">{suffix}</span>
                                        )}
                                        {plan.trial_days > 0 && plan.price_cents > 0 && (
                                            <p className="mt-1 text-xs text-emerald-400">
                                                {plan.trial_days}-day free trial
                                            </p>
                                        )}
                                    </div>

                                    {/* Feature list */}
                                    <ul className="space-y-3 text-sm mb-8 flex-1">
                                        {features.map((feature) => (
                                            <li key={feature} className="flex items-start text-slate-300">
                                                <div
                                                    className={`mr-3 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${popular
                                                        ? "bg-purple-500/20 text-purple-400"
                                                        : "bg-white/5 text-slate-400"
                                                        }`}
                                                >
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <Link href="/register" className="w-full">
                                        <Button
                                            className={`w-full rounded-xl h-12 cursor-pointer transition-all duration-300 ${popular
                                                ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 text-white"
                                                : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                                                }`}
                                            variant={popular ? "default" : "outline"}
                                        >
                                            {plan.price_cents === 0 ? "Get Started Free" : "Get Started"}
                                        </Button>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
