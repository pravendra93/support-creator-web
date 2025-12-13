import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { BACKEND_URL } from "@/lib/config";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/v1/admin/coupons/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token.value}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail?.[0]?.msg || data.detail || "Failed to update coupon" },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Update coupon proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${BACKEND_URL}/v1/admin/coupons/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token.value}`,
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({ detail: "Failed to delete coupon" }));
            return NextResponse.json(
                { message: data.detail?.[0]?.msg || data.detail || "Failed to delete coupon" },
                { status: response.status }
            );
        }

        return NextResponse.json({ message: "Coupon deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Delete coupon proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token");

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${BACKEND_URL}/v1/admin/coupons/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token.value}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail?.[0]?.msg || data.detail || "Failed to fetch coupon" },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Get coupon proxy error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
