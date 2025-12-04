import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:8000";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { message: "Missing verification token" },
                { status: 400 }
            );
        }

        const backendUrl = `${BACKEND_URL}/v1/auth/verify-email?token=${encodeURIComponent(
            token
        )}&mode=json`;

        const response = await fetch(backendUrl, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        // Backend returns simple JSON {"status": "..."} on success
        if (response.ok) {
            const data = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    message:
                        (data as any).status === "already_verified"
                            ? "Email is already verified."
                            : "Email verified successfully.",
                },
                { status: 200 }
            );
        }

        // Try to parse backend error
        let errorMessage = "Verification failed. The token may be invalid or expired.";
        try {
            const data = await response.json();
            if ((data as any).detail) {
                errorMessage = Array.isArray((data as any).detail)
                    ? (data as any).detail[0]?.msg || errorMessage
                    : (data as any).detail;
            } else if ((data as any).message) {
                errorMessage = (data as any).message;
            }
        } catch {
            // ignore parse errors and use default message
        }

        return NextResponse.json(
            { message: errorMessage },
            { status: response.status }
        );
    } catch (error) {
        console.error("Verify email proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

