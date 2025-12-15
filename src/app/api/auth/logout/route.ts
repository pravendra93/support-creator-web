import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "http://localhost:8000";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        if (token) {
            // Call backend to revoke token
            await fetch(`${BACKEND_URL}/v1/auth/revoke-token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token.value}`,
                },
            });
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
