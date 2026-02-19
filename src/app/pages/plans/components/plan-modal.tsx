import React, { useState } from "react";
import { Plan, PlanCreate, PlanUpdate } from "@/types/plan";

interface PlanModalProps {
    plan?: Plan;
    onClose: () => void;
    onSubmit: (data: PlanCreate | PlanUpdate) => void;
}

export function PlanModal({
    plan,
    onClose,
    onSubmit,
}: PlanModalProps) {
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
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                            {plan ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
