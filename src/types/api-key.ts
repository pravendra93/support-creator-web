export interface ApiKey {
    id: string;
    name: string;
    key: string;
    tenant_id: string;
    tenant_name?: string;
    is_active: boolean;
    created_at: string;
    expires_at?: string | null;
}

export interface ApiKeyCreate {
    name: string;
    tenant_id: string;
    expires_at?: string | null;
}
