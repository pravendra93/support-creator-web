import React from "react";
import { Plan } from "@/types/plan";
import {
    Edit,
    DollarSign,
    Calendar,
    CheckCircle,
    XCircle,
} from "lucide-react";

interface PlanCardProps {
    plan: Plan;
    onEdit: () => void;
    formatPrice: (cents: number, currency: string) => string;
    formatInterval: (interval: string, count: number) => string;
}

export function PlanCard({
    plan,
    onEdit,
    formatPrice,
    formatInterval,
}: PlanCardProps) {
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
                    className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
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
                        <div className="space-y-3">
                            {Object.entries(plan.features).map(([category, details]) => {
                                if (typeof details !== 'object' || details === null) return null;
                                return (
                                    <div key={category} className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground/70">
                                            {category.replace(/_/g, ' ')}
                                        </p>
                                        <ul className="space-y-0.5">
                                            {Object.entries(details).map(([key, value]) => (
                                                <li key={key} className="text-xs flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        {key.replace(/_/g, ' ')}:
                                                    </span>
                                                    <span className="font-medium">
                                                        {Array.isArray(value)
                                                            ? value.join(', ')
                                                            : value === null
                                                                ? 'None'
                                                                : typeof value === 'boolean'
                                                                    ? (value ? 'Yes' : 'No')
                                                                    : String(value)
                                                        }
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
