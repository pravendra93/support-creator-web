import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");
        const params = await context.params;
        const fileId = params.id;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Get presigned URL for viewing
        const response = await fetch(`${BACKEND_URL}/v1/knowledge-base/${fileId}/view-url`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token.value}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Failed to get view URL" }));
            return NextResponse.json(
                { message: errorData.detail || "Failed to get view URL" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Get view URL error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
