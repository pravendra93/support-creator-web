import { NextRequest, NextResponse } from "next/server";

const FLOWER_URL = process.env.FLOWER_URL || "http://localhost:5555";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const resolvedPath = path.join("/");
    const query = request.nextUrl.search;
    const targetUrl = `${FLOWER_URL}/${resolvedPath}${query}`;

    try {
        const response = await fetch(targetUrl);
        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error proxying to Flower:", error);
        return NextResponse.json(
            { error: "Failed to fetch from Flower service" },
            { status: 502 }
        );
    }
}
