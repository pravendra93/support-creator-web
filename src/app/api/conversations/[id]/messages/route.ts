import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        const response = await fetch(`${BACKEND_URL}/v1/chat/conversations/${id}/messages`, {
            headers: {
                ...(token ? { "Authorization": `Bearer ${token.value}` } : {}),
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Messages list proxy error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
