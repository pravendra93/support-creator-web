import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

/**
 * GET /api/credits
 * Proxy to backend GET /v1/stats/tenant/{tenantId}/credits
 * Returns credit balance + recent usage log + plan credit limit.
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

        // 1. Get user info (includes plan_slug)
        const meRes = await fetch(`${BACKEND_URL}/v1/auth/me`, { headers });
        if (!meRes.ok) {
            return NextResponse.json({ message: "Failed to fetch user info" }, { status: meRes.status });
        }
        const user = await meRes.json();

        // 2. Resolve tenant ID
        let tenantId: string | null = null;
        let planName: string = user.plan_slug ?? "Free";
        let planMonthlyCredits: number = 0;

        if (user.role === "super_admin") {
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
                return NextResponse.json({
                    credits_total: 0, credits_used: 0, credits_remaining: 0,
                    usage_pct: 0, estimated_convos_left: 0,
                    is_exhausted: false, warn_80: false, warn_95: false,
                    recent_usage: [], plan_name: planName, plan_monthly_credits: 0,
                });
            }
            tenantId = tenants[0].id;
        }

        // 3. Fetch plan details to get credit limit from features
        if (user.plan_slug) {
            try {
                const planRes = await fetch(`${BACKEND_URL}/v1/plans/${user.plan_slug}`, { headers });
                if (planRes.ok) {
                    const planData = await planRes.json();
                    planName = planData.name ?? planName;
                    planMonthlyCredits = planData.features?.credits?.monthly_credits ?? 0;
                }
            } catch {
                // non-fatal: fall through with defaults
            }
        }

        // 4. Fetch credit balance from backend
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

        // Merge plan info into the response
        return NextResponse.json({
            ...data,
            plan_name: planName,
            plan_monthly_credits: planMonthlyCredits,
        });

    } catch (error) {
        console.error("Credits API proxy error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
