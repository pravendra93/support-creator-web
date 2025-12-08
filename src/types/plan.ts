// Plan types based on backend schema
export interface Plan {
    id: string;
    slug: string;
    name: string;
    description?: string;
    price_cents: number;
    currency: string;
    interval: 'month' | 'year' | 'one_time';
    interval_count: number;
    trial_days: number;
    stripe_product_id?: string;
    stripe_price_id?: string;
    features?: Record<string, any>;
    meta?: Record<string, any>;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface PlanCreate {
    slug: string;
    name: string;
    description?: string;
    price_cents?: number;
    currency?: string;
    interval?: 'month' | 'year' | 'one_time';
    interval_count?: number;
    trial_days?: number;
    stripe_product_id?: string;
    stripe_price_id?: string;
    features?: Record<string, any>;
    meta?: Record<string, any>;
    active?: boolean;
}

export interface PlanUpdate {
    name?: string;
    description?: string;
    price_cents?: number;
    currency?: string;
    interval?: 'month' | 'year' | 'one_time';
    interval_count?: number;
    trial_days?: number;
    stripe_product_id?: string;
    stripe_price_id?: string;
    features?: Record<string, any>;
    metadata?: Record<string, any>;
    active?: boolean;
}
