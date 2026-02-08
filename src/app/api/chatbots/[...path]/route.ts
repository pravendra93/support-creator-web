import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await context.params;
        const resolvedPath = path.join("/");
        const query = request.nextUrl.search;

        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        const response = await fetch(`${BACKEND_URL}/v1/${resolvedPath}${query}`, {
            headers: {
                ...(token ? { "Authorization": `Bearer ${token.value}` } : {}),
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Chatbots GET proxy error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await context.params;
        const resolvedPath = path.join("/");
        const body = await request.json();

        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        const response = await fetch(`${BACKEND_URL}/v1/${resolvedPath}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token.value}` } : {}),
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Chatbots PUT proxy error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
