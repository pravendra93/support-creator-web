import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("session_token")?.value;
        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        // 1. Get current user role
        const meRes = await fetch(`${BACKEND_URL}/v1/auth/me`, { headers });
        if (!meRes.ok) {
            return NextResponse.json({ message: "Failed to fetch user info" }, { status: meRes.status });
        }
        const user = await meRes.json();
        const role = user.role;

        // 2. Fetch appropriate stats based on role
        if (role === "super_admin") {
            const statsRes = await fetch(`${BACKEND_URL}/v1/stats/system`, { headers });
            if (!statsRes.ok) {
                return NextResponse.json({ message: "Failed to fetch system stats" }, { status: statsRes.status });
            }
            const stats = await statsRes.json();
            return NextResponse.json({ ...stats, role: "super_admin" });
        } else {
            // Assume tenant owner (platform_user)
            // Need to find tenant(s) first
            // The backend endpoint is /v1/tenants/admin/tenants because router prefix is /v1/tenants and path is /admin/tenants
            const tenantRes = await fetch(`${BACKEND_URL}/v1/tenants/admin/tenants`, { headers });

            if (!tenantRes.ok) {
                return NextResponse.json({ message: "Failed to fetch tenants" }, { status: tenantRes.status });
            }

            const tenants = await tenantRes.json();

            if (!tenants || tenants.length === 0) {
                return NextResponse.json({
                    role: "tenant",
                    total_conversations: 0,
                    total_sub_users: 0,
                    active_chatbot: false,
                    chatbot_name: "Not Configured",
                    plan: "none",
                    tenant_name: "No Tenant Found"
                });
            }

            // Use the first tenant found
            const tenantId = tenants[0].id;

            const statsRes = await fetch(`${BACKEND_URL}/v1/stats/tenant/${tenantId}`, { headers });
            if (!statsRes.ok) {
                // Determine if 403 or 404
                return NextResponse.json({ message: "Failed to fetch tenant stats" }, { status: statsRes.status });
            }
            const stats = await statsRes.json();
            return NextResponse.json({ ...stats, role: "tenant", tenant_id: tenantId });
        }

    } catch (error) {
        console.error("Dashboard stats proxy error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
