export interface AdminAccount {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    role: string;
    tenant_id: string;
    is_subscribed: boolean;
    plan_name: string;
    plan_slug: string;
    created_at: string;
}

export interface AdminSubscription {
    id: string;
    tenant_id: string;
    plan: string;
    status: string;
    started_at: string;
    expires_at: string;
    plan_id: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
    tenant_name: string;
}
