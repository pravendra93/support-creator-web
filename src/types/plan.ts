export interface PlanFeatures {
    credits?: {
        monthly_credits?: number;
        tokens_per_credit?: number;
        rollover?: boolean;
    };
    team?: {
        max_users?: number;
    };
    usage?: {
        max_requests_per_day?: number;
        max_requests_per_minute?: number;
        max_conversations_per_month?: number;
    };
    billing?: {
        overage_allowed?: boolean;
        daily_spend_limit_usd?: number;
        monthly_spend_limit_usd?: number;
    };
    support?: {
        sla?: string | null;
        priority_support?: boolean;
    };
    analytics?: {
        retention_days?: number;
    };
    model_limits?: {
        allowed_models?: string[];
        max_chunks_per_query?: number;
        max_tokens_per_request?: number;
    };
    knowledge_base?: {
        max_files?: number;
        max_storage_mb?: number;
        max_chunks_total?: number;
    };
    tenant_limits?: {
        max_tenants?: number;
        extra_tenant_price_usd?: number;
    };
    [key: string]: unknown;
}

export interface TenantSettings {
    name: string;
    features: PlanFeatures;
}

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
    features?: PlanFeatures;
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
    features?: PlanFeatures;
    meta?: Record<string, unknown>;
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
    features?: PlanFeatures;
    meta?: Record<string, unknown>;
    active?: boolean;
}
