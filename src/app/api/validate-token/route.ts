import { NextResponse } from "next/server";

import { CONFIG } from "@/lib/config";

const BACKEND_URL = CONFIG.BACKEND_URL;

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/v1/tenants/validate-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                {
                    message: data.detail?.[0]?.msg ||
                        (data.detail ? data.detail : "Failed to validate token")
                },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Validate token proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
