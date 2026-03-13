import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { BACKEND_URL } from "@/lib/config";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        if (token) {
            // Try to revoke token on backend (best-effort, don't block logout)
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5_000);
                await fetch(`${BACKEND_URL}/v1/auth/revoke-token`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token.value}`,
                    },
                    signal: controller.signal,
                });
                clearTimeout(timeout);
            } catch {
                // Ignore — token revocation is best-effort, cookie will be cleared regardless
            }
        }

        const res = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

        // Clear cookie
        res.cookies.set("session_token", "", { maxAge: 0, path: "/" });

        return res;
    } catch (error) {
        console.error("Logout proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
