import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Forward to python backend
        const response = await fetch(`${BACKEND_URL}/v1/logs/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error(`Backend logging failed: ${response.status}`);
            return NextResponse.json({ message: "Failed to log to backend" }, { status: response.status });
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Logging proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${BACKEND_URL}/v1/logs/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token.value}`,
            },
        });

        if (!response.ok) {
            // Logs might not be found or other error
            if (response.status === 404) {
                return NextResponse.json({ message: "Log file not found" }, { status: 404 });
            }
            return NextResponse.json({ message: "Failed to fetch logs" }, { status: response.status });
        }

        const text = await response.text();
        return new NextResponse(text, { status: 200, headers: { "Content-Type": "text/plain" } });

    } catch (error) {
        console.error("Fetch logs proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
