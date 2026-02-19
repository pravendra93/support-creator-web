import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/config";

export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/v1/plans/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            // Cache for 5 minutes at the Next.js layer
            next: { revalidate: 300 },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                {
                    message:
                        data.detail?.[0]?.msg ??
                        (data.detail ?? "Failed to fetch plans"),
                },
                { status: response.status }
            );
        }

        return NextResponse.json(data, {
            status: 200,
            headers: {
                // Allow browser / CDN to cache for 5 minutes too
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
            },
        });
    } catch (error) {
        console.error("Public plans proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
