import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

export async function GET(request: NextRequest) {
    try {
        const key = request.nextUrl.searchParams.get("key");

        if (!key) {
            return NextResponse.json({ error: "API key is required" }, { status: 400 });
        }

        const response = await fetch(`${BACKEND_URL}/v1/widget/init-by-key?key=${key}`, {
            headers: {
                "Accept": "application/json",
            },
        });

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Widget init proxy error: Non-JSON response from backend:", text);
            return NextResponse.json(
                { message: "Backend error: Invalid response format" },
                { status: 500 }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Widget init proxy error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
