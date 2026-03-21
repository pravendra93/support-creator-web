import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

/**
 * GET /api/credits
 * Proxy to backend GET /v1/stats/tenant/{tenantId}/credits
 * Returns credit balance + recent usage log for the authenticated user's tenant.
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("session_token")?.value;
        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const headers: Record<string, string> = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        // 1. Get user + tenant info
        const meRes = await fetch(`${BACKEND_URL}/v1/auth/me`, { headers });
        if (!meRes.ok) {
            return NextResponse.json({ message: "Failed to fetch user info" }, { status: meRes.status });
        }
        const user = await meRes.json();

        // 2. Get tenant id from the user's owned tenants
        let tenantId: string | null = null;

        if (user.role === "super_admin") {
            // Super admin: let them pass a tenant_id query param
            tenantId = request.nextUrl.searchParams.get("tenant_id");
            if (!tenantId) {
                return NextResponse.json({ message: "tenant_id required for super_admin" }, { status: 400 });
            }
        } else {
            const tenantRes = await fetch(`${BACKEND_URL}/v1/tenants/admin/tenants`, { headers });
            if (!tenantRes.ok) {
                return NextResponse.json({ message: "Failed to fetch tenants" }, { status: tenantRes.status });
            }
            const tenants = await tenantRes.json();
            if (!tenants || tenants.length === 0) {
                // No tenant yet — return zero-state
                return NextResponse.json({
                    credits_total: 0,
                    credits_used: 0,
                    credits_remaining: 0,
                    usage_pct: 0,
                    estimated_convos_left: 0,
                    is_exhausted: false,
                    warn_80: false,
                    warn_95: false,
                    recent_usage: [],
                });
            }
            tenantId = tenants[0].id;
        }

        // 3. Fetch credit balance from backend
        const creditsRes = await fetch(
            `${BACKEND_URL}/v1/stats/tenant/${tenantId}/credits`,
            { headers }
        );

        if (!creditsRes.ok) {
            const errBody = await creditsRes.text();
            return NextResponse.json(
                { message: "Failed to fetch credit data", detail: errBody },
                { status: creditsRes.status }
            );
        }

        const data = await creditsRes.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Credits API proxy error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
