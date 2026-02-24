import { NextResponse } from "next/server";
import crypto from "crypto";
import { BACKEND_URL } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature");
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret || !signature) {
            return NextResponse.json({ message: "Invalid request" }, { status: 400 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        const isValid = crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );

        if (!isValid) {
            return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);
        console.log("Webhook Event:", event.event);

        // Forward async
        fetch(`${BACKEND_URL}/v1/subscriptions/webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event),
        }).catch(err => console.error("Webhook forward error:", err));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}