import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.toString();

        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        const response = await fetch(`${BACKEND_URL}/v1/chat/conversations?${query}`, {
            headers: {
                ...(token ? { "Authorization": `Bearer ${token.value}` } : {}),
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Conversations list proxy error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
