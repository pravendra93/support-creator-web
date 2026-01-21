import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

// Helper to decode JWT and get user role
function decodeJWT(token: string): any {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(Buffer.from(payload, 'base64').toString());
    } catch {
        return null;
    }
}

// Proxy to fetch tenants based on user role
export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Decode JWT to check role
        const decoded = decodeJWT(token.value);
        const userRole = decoded?.role;

        console.log("[Tenants API] User role:", userRole, "| Full decoded:", decoded);

        // Super admins and platform users get ALL tenants
        if (userRole === 'super_admin' || userRole === 'platform_user') {
            const response = await fetch(`${BACKEND_URL}/v1/tenants/admin/tenants`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token.value}`,
                },
            });

            const data = await response.json();
            console.log("[Tenants API] Backend response status:", response.status, "| Data:", data);

            if (!response.ok) {
                return NextResponse.json(
                    { message: "Failed to fetch tenants" },
                    { status: response.status }
                );
            }

            return NextResponse.json(data, { status: 200 });
        }

        // Tenant admins get only THEIR tenants (filtered by owner_account_id)
        if (userRole === 'tenant_admin') {
            const userId = decoded?.sub;
            console.log("[Tenants API] Tenant admin - filtering by owner_account_id:", userId);

            const response = await fetch(`${BACKEND_URL}/v1/tenants/admin/tenants`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token.value}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return NextResponse.json(
                    { message: "Failed to fetch tenants" },
                    { status: response.status }
                );
            }

            // Filter to only show tenants owned by this user
            const myTenants = data.filter((tenant: any) => tenant.owner_account_id === userId);
            console.log(`[Tenants API] Filtered ${myTenants.length} out of ${data.length} tenants for user ${userId}`);

            return NextResponse.json(myTenants, { status: 200 });
        }

        // Regular users get their specific tenant
        else {
            // Regular users: get user info to find their tenant
            const userResponse = await fetch(`${BACKEND_URL}/v1/auth/me`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token.value}`,
                },
            });

            if (!userResponse.ok) {
                return NextResponse.json(
                    { message: "Failed to get user info" },
                    { status: userResponse.status }
                );
            }

            const userData = await userResponse.json();

            // For regular users, we need to find their tenant
            // If tenant_id is available in user data, use it
            // Otherwise, fetch all tenants (if allowed) and return first one
            if (userData.tenant_id) {
                // Fetch specific tenant
                const tenantResponse = await fetch(`${BACKEND_URL}/v1/tenants/${userData.tenant_id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token.value}`,
                    },
                });

                if (tenantResponse.ok) {
                    const tenant = await tenantResponse.json();
                    return NextResponse.json([tenant], { status: 200 });
                }
            }

            // Fallback: return empty array if user has no tenant
            return NextResponse.json([], { status: 200 });
        }
    } catch (error) {
        console.error("Tenants Proxy Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
