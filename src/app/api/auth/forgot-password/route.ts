import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/v1/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // 404 means the backend endpoint is not implemented yet
            if (response.status === 404) {
                return NextResponse.json(
                    { message: "Password reset is not available at the moment. Please contact support." },
                    { status: 503 }
                );
            }
            return NextResponse.json(
                { message: data.detail || data.message || "Failed to send reset email. Please try again." },
                { status: response.status }
            );
        }

        return NextResponse.json(
            { message: "If that email exists, a reset link has been sent." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Forgot password proxy error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
