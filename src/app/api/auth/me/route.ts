import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { BACKEND_URL } from "@/lib/config";

const BACKEND_TIMEOUT_MS = 10_000; // 10 seconds

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

        let response: Response;
        try {
            response = await fetch(`${BACKEND_URL}/v1/auth/me`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token.value}`,
                },
                signal: controller.signal,
            });
        } catch (err: any) {
            if (err?.name === "AbortError") {
                console.error("Me proxy: backend request timed out after", BACKEND_TIMEOUT_MS, "ms");
                return NextResponse.json(
                    { message: "Session verification timed out. Please log in again." },
                    { status: 401 }
                );
            }
            throw err;
        } finally {
            clearTimeout(timeout);
        }

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Me proxy error: Non-JSON response from backend:", text);
            return NextResponse.json(
                { message: "Backend error: Invalid response format" },
                { status: 500 }
            );
        }

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail?.[0]?.msg || data.detail || "Failed to fetch user" },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Me proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

        let response: Response;
        try {
            response = await fetch(`${BACKEND_URL}/v1/auth/me`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token.value}`,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
        } catch (err: any) {
            if (err?.name === "AbortError") {
                console.error("Update Me proxy: backend request timed out after", BACKEND_TIMEOUT_MS, "ms");
                return NextResponse.json(
                    { message: "Request timed out. Please try again." },
                    { status: 408 }
                );
            }
            throw err;
        } finally {
            clearTimeout(timeout);
        }

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail?.[0]?.msg || "Failed to update user" },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Update Me proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
