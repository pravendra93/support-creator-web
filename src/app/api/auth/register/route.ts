import { NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/config";

const BACKEND_TIMEOUT_MS = 15_000;

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

        let response: Response;
        try {
            response = await fetch(`${BACKEND_URL}/v1/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
        } catch (err: any) {
            if (err?.name === "AbortError") {
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
                { message: data.detail?.[0]?.msg || "Registration failed" },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Register proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
