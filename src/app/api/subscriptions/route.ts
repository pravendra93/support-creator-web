import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token");

        if (!sessionToken) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Forward query parameters if any (limit, offset)
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get("limit") || "100";
        const offset = searchParams.get("offset") || "0";

        const response = await fetch(
            `${BACKEND_URL}/v1/subscriptions/?limit=${limit}&offset=${offset}`,
            {
                method: "GET",
                headers: {
                    "accept": "application/json",
                    "Authorization": `Bearer ${sessionToken.value}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                {
                    message: data.detail?.[0]?.msg ||
                        (data.detail ? data.detail : "Failed to fetch subscriptions")
                },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Get subscriptions proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
