import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
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
