import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { BACKEND_URL } from "@/lib/config";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token");

        if (!sessionToken) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const response = await fetch(
            `${BACKEND_URL}/v1/tenants/${id}/settings`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "accept": "application/json",
                    Authorization: `Bearer ${sessionToken.value}`,
                },
            }
        );

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Tenant settings proxy error: Non-JSON response from backend:", text);
            return NextResponse.json(
                { message: "Backend error: Invalid response format" },
                { status: 500 }
            );
        }

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                {
                    message: data.detail?.[0]?.msg ||
                        (data.detail ? data.detail : "Failed to fetch tenant settings")
                },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Get tenant settings proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
