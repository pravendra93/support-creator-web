import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token");

        if (!sessionToken) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { amount, currency = "INR", planId, planName } = body;

        if (!amount || !planId) {
            return NextResponse.json(
                { message: "Amount and planId are required" },
                { status: 400 }
            );
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error("Razorpay keys are not configured");
            return NextResponse.json(
                { message: "Payment gateway not configured" },
                { status: 500 }
            );
        }

        // Amount must be in paise (smallest currency unit)
        const amountInPaise = Math.round(amount * 100);

        // Use Razorpay REST API directly via fetch (no SDK needed)
        const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

        const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${credentials}`,
            },
            body: JSON.stringify({
                amount: amountInPaise,
                currency: currency.toUpperCase(),
                receipt: `rcpt_${planId.slice(0, 20)}_${Date.now()}`,
                notes: {
                    plan_id: planId,
                    plan_name: planName || "",
                },
            }),
        });

        const order = await razorpayRes.json();

        if (!razorpayRes.ok) {
            console.error("Razorpay order creation failed:", order);
            return NextResponse.json(
                { message: order?.error?.description || "Failed to create payment order" },
                { status: razorpayRes.status }
            );
        }

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId,
        });
    } catch (error: any) {
        console.error("Razorpay create order error:", error);
        return NextResponse.json(
            { message: error?.message || "Failed to create payment order" },
            { status: 500 }
        );
    }
}
