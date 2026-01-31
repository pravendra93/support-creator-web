import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token");

        if (!sessionToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${BACKEND_URL}/v1/tenants/admin/tenant-api-keys`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionToken.value}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail || "Failed to fetch API keys" },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Get API keys error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token");

        if (!sessionToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/v1/tenants/admin/tenant-api-keys`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionToken.value}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.detail || "Failed to create API key" },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Create API key error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token");

        if (!sessionToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const response = await fetch(`${BACKEND_URL}/v1/tenants/admin/tenant-api-keys/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${sessionToken.value}`,
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { message: "Failed to delete API key" },
                { status: response.status }
            );
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete API key error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
