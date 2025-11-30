import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:8000";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.text().then((text) => (text ? JSON.parse(text) : {}));

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail?.[0]?.msg || "Login failed" },
                { status: response.status }
            );
        }

        const res = NextResponse.json(data, { status: 200 });

        // Forward cookies if any (important for session/token based auth if using cookies)
        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
            res.headers.set("Set-Cookie", setCookieHeader);
        }

        return res;
    } catch (error) {
        console.error("Login proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
