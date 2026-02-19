"use client";

import React, { useState, useEffect } from "react";
import { Plan, PlanCreate, PlanUpdate } from "@/types/plan";
import {
    Plus,
    Loader2,
} from "lucide-react";
import { PlanCard } from "./components/plan-card";
import { PlanModal } from "./components/plan-modal";

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
        } catch (err: any) {
            setError(err.message);
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
        } catch (err: any) {
            setError(err.message);
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
        } catch (err: any) {
            setError(err.message);
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Plans</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage subscription plans and pricing
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    Create Plan
                </button>
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
