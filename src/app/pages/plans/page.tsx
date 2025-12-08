"use client";

import React, { useState, useEffect } from "react";
import { Plan, PlanCreate, PlanUpdate } from "@/types/plan";
import {
    Plus,
    Edit,
    Trash2,
    DollarSign,
    Calendar,
    CheckCircle,
    XCircle,
    Loader2,
} from "lucide-react";

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
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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

function PlanCard({
    plan,
    onEdit,
    formatPrice,
    formatInterval,
}: {
    plan: Plan;
    onEdit: () => void;
    formatPrice: (cents: number, currency: string) => string;
    formatInterval: (interval: string, count: number) => string;
}) {
    return (
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-card">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                        {plan.active ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                        {plan.slug}
                    </p>
                </div>
                <button
                    onClick={onEdit}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <Edit className="h-4 w-4" />
                </button>
            </div>

            {plan.description && (
                <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                </p>
            )}

            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                        {formatPrice(plan.price_cents, plan.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {formatInterval(plan.interval, plan.interval_count)}
                    </span>
                </div>

                {plan.trial_days > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.trial_days} days trial</span>
                    </div>
                )}

                {plan.features && Object.keys(plan.features).length > 0 && (
                    <div className="pt-3 border-t">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                            FEATURES
                        </p>
                        <ul className="space-y-1">
                            {Object.entries(plan.features).map(([key, value]) => (
                                <li key={key} className="text-sm flex justify-between">
                                    <span className="text-muted-foreground">{key}:</span>
                                    <span className="font-medium">{String(value)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

function PlanModal({
    plan,
    onClose,
    onSubmit,
}: {
    plan?: Plan;
    onClose: () => void;
    onSubmit: (data: PlanCreate | PlanUpdate) => void;
}) {
    const [formData, setFormData] = useState<PlanCreate>({
        slug: plan?.slug || "",
        name: plan?.name || "",
        description: plan?.description || "",
        price_cents: plan?.price_cents || 0,
        currency: plan?.currency || "usd",
        interval: plan?.interval || "month",
        interval_count: plan?.interval_count || 1,
        trial_days: plan?.trial_days || 0,
        stripe_product_id: plan?.stripe_product_id || "",
        stripe_price_id: plan?.stripe_price_id || "",
        features: plan?.features || {},
        meta: plan?.meta || {},
        active: plan?.active ?? true,
    });

    const [featuresJson, setFeaturesJson] = useState(
        JSON.stringify(plan?.features || {}, null, 2)
    );
    const [metaJson, setMetaJson] = useState(
        JSON.stringify(plan?.meta || {}, null, 2)
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const features = JSON.parse(featuresJson);
            const meta = JSON.parse(metaJson);
            onSubmit({ ...formData, features, meta });
        } catch (err) {
            alert("Invalid JSON in features or metadata");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b sticky top-0 bg-background">
                    <h2 className="text-2xl font-bold">
                        {plan ? "Edit Plan" : "Create Plan"}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Slug *
                            </label>
                            <input
                                type="text"
                                required
                                disabled={!!plan}
                                value={formData.slug}
                                onChange={(e) =>
                                    setFormData({ ...formData, slug: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded-lg disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Price (cents)
                            </label>
                            <input
                                type="number"
                                value={formData.price_cents}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        price_cents: parseInt(e.target.value) || 0,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Currency
                            </label>
                            <input
                                type="text"
                                value={formData.currency}
                                onChange={(e) =>
                                    setFormData({ ...formData, currency: e.target.value })
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Trial Days
                            </label>
                            <input
                                type="number"
                                value={formData.trial_days}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        trial_days: parseInt(e.target.value) || 0,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Interval
                            </label>
                            <select
                                value={formData.interval}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        interval: e.target.value as any,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="month">Month</option>
                                <option value="year">Year</option>
                                <option value="one_time">One-time</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Interval Count
                            </label>
                            <input
                                type="number"
                                value={formData.interval_count}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        interval_count: parseInt(e.target.value) || 1,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Stripe Product ID
                            </label>
                            <input
                                type="text"
                                value={formData.stripe_product_id}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        stripe_product_id: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Stripe Price ID
                            </label>
                            <input
                                type="text"
                                value={formData.stripe_price_id}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        stripe_price_id: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Features (JSON)
                        </label>
                        <textarea
                            value={featuresJson}
                            onChange={(e) => setFeaturesJson(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                            rows={4}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Metadata (JSON)
                        </label>
                        <textarea
                            value={metaJson}
                            onChange={(e) => setMetaJson(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                            rows={4}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="active"
                            checked={formData.active}
                            onChange={(e) =>
                                setFormData({ ...formData, active: e.target.checked })
                            }
                            className="w-4 h-4 rounded"
                        />
                        <label htmlFor="active" className="text-sm font-medium">
                            Active
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            {plan ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
