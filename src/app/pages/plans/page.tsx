"use client";

import React, { useState, useEffect } from "react";
import { Plan, PlanCreate, PlanUpdate } from "@/types/plan";
import {
    Plus,
    Loader2,
} from "lucide-react";
import { cn, getErrorMessage } from "@/lib/utils";
import { PlanCard } from "./components/plan-card";
import { PlanModal } from "./components/plan-modal";

import { PageHeader } from "@/components/shared/page-header";
import { CreditCard } from "lucide-react";

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [onlyActive, setOnlyActive] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, [onlyActive]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/plans?only_active=${onlyActive}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch plans");
            }

            setPlans(data);
            setError("");
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async (planData: PlanCreate) => {
        try {
            const response = await fetch("/api/plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(planData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create plan");
            }

            setShowCreateModal(false);
            fetchPlans();
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        }
    };

    const handleUpdatePlan = async (planId: string, updates: PlanUpdate) => {
        try {
            const response = await fetch(`/api/plans/${planId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update plan");
            }

            setEditingPlan(null);
            fetchPlans();
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        }
    };

    const formatPrice = (cents: number, currency: string) => {
        const amount = cents / 100;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount);
    };

    const formatInterval = (interval: string, count: number) => {
        if (interval === "one_time") return "One-time";
        const unit = interval === "month" ? "month" : "year";
        return count === 1 ? `per ${unit}` : `every ${count} ${unit}s`;
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Subscription Plans"
                description="Manage subscription tiers, limits, and pricing."
                icon={CreditCard}
                gradient="from-amber-500 to-orange-600"
                howItWorks="Subscription plans define the capabilities and limits for each workspace level. You can create tiers like 'Starter', 'Pro', or 'Enterprise', each with varying token limits, document caps, and support features. These plans are synchronized with your billing provider (e.g., Stripe) to ensure seamless payment processing."
                actions={
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Create Tier
                    </button>
                }
            />

            <div className="flex items-center justify-between bg-[#13171F]/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm -mt-2">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setOnlyActive(!onlyActive)}>
                    <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                        onlyActive ? "bg-indigo-600 border-indigo-500" : "border-slate-800 bg-black/20"
                    )}>
                        {onlyActive && <div className="w-2.5 h-2.5 bg-white rounded-full animate-in zoom-in-50 duration-300" />}
                    </div>
                    <span className="text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                        Show only active plans
                    </span>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={onlyActive}
                        onChange={(e) => setOnlyActive(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">
                        Show only active plans
                    </span>
                </label>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                /* Plans Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            onEdit={() => setEditingPlan(plan)}
                            formatPrice={formatPrice}
                            formatInterval={formatInterval}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && plans.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No plans found</p>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <PlanModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={(data) => handleCreatePlan(data as PlanCreate)}
                />
            )}

            {/* Edit Modal */}
            {editingPlan && (
                <PlanModal
                    plan={editingPlan}
                    onClose={() => setEditingPlan(null)}
                    onSubmit={(data) => handleUpdatePlan(editingPlan.id, data as PlanUpdate)}
                />
            )}
        </div>
    );
}
