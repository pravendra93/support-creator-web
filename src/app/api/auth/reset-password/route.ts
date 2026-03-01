import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/v1/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail || data.message || "Password reset failed" },
                { status: response.status }
            );
        }

        return NextResponse.json({ message: "Password has been reset successfully." }, { status: 200 });
    } catch (error) {
        console.error("Reset password proxy error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
