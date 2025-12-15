import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { cookies } from "next/headers";

const BACKEND_URL = "http://localhost:8000";

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${BACKEND_URL}/v1/auth/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token.value}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail?.[0]?.msg || "Failed to fetch user" },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Me proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
