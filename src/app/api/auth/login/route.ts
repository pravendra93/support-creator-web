import { NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

const BACKEND_TIMEOUT_MS = 15_000; // 15 seconds

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

        let response: Response;
        try {
            response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
        } catch (err: any) {
            if (err?.name === "AbortError") {
                console.error("Login proxy: backend request timed out after", BACKEND_TIMEOUT_MS, "ms");
                return NextResponse.json(
                    { message: "Server is not responding. Please try again in a moment." },
                    { status: 504 }
                );
            }
            throw err;
        } finally {
            clearTimeout(timeout);
        }

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail?.[0]?.msg || (data.detail ? data.detail : "Login failed") },
                { status: response.status }
            );
        }

        // Create response
        const res = NextResponse.json({ message: "Login successful" }, { status: 200 });

        // Set HTTP-only cookie with the access token
        if (data.access_token) {
            res.cookies.set("session_token", data.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });
        }

        return res;
    } catch (error) {
        console.error("Login proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
