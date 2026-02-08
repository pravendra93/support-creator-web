import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");
        const params = await context.params;
        const fileId = params.id;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Trigger processing for the file
        const response = await fetch(`${BACKEND_URL}/v1/knowledge-base/${fileId}/process`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token.value}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Failed to trigger processing" }));
            return NextResponse.json(
                { error: errorData.detail || "Failed to trigger processing" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Process trigger error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
