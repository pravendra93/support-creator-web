import { NextResponse } from "next/server";

import { CONFIG } from "@/lib/config";

const BACKEND_URL = CONFIG.BACKEND_URL;

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
