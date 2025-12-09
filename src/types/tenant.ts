// Tenant types based on backend schema
export interface Tenant {
    id: string;
    name: string;
    owner_account_id?: string;
    status: 'pending' | 'active' | 'suspended';
    plan: string;
    created_at?: string;
    updated_at?: string;
}

export interface TenantCreate {
    name: string;
    owner_account_id?: string;
    status?: 'pending' | 'active' | 'suspended';
    plan?: string;
}

export interface TenantUpdate {
    name?: string;
    owner_account_id?: string;
    status?: 'pending' | 'active' | 'suspended';
    plan?: string;
}

// Tenant User (Sub-user) types
export interface TenantUser {
    id: string;
    tenant_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    is_active: boolean;
    created_at?: string;
}

export interface TenantUserCreate {
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    password?: string;
}

export interface TenantUserInvite {
    email: string;
    role?: string;
}

// Platform Account type
export interface Account {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    is_active: boolean;
    created_at?: string;
}

