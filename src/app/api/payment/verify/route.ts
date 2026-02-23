import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

export const runtime = "nodejs";

async function verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string,
    secret: string
): Promise<boolean> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(`${orderId}|${paymentId}`);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const signatureHex = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return signatureHex === signature;
}

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
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planId,
        } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
            return NextResponse.json(
                { message: "Missing required payment details" },
                { status: 400 }
            );
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            return NextResponse.json(
                { message: "Payment gateway not configured" },
                { status: 500 }
            );
        }

        // ---------- Verify HMAC-SHA256 signature ----------
        const isValid = await verifyRazorpaySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            keySecret
        );

        if (!isValid) {
            return NextResponse.json(
                { message: "Invalid payment signature – verification failed" },
                { status: 400 }
            );
        }

        // ---------- Activate plan on backend ----------
        const activateResponse = await fetch(
            `${BACKEND_URL}/v1/subscriptions/activate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionToken.value}`,
                },
                body: JSON.stringify({
                    plan_id: planId,
                    payment_id: razorpay_payment_id,
                    order_id: razorpay_order_id,
                    signature: razorpay_signature,
                }),
            }
        );

        // If backend is not ready yet, still treat payment as successful
        if (!activateResponse.ok) {
            const errData = await activateResponse.json().catch(() => ({}));
            console.warn("Backend plan activation failed:", errData);
            return NextResponse.json({
                success: true,
                paymentId: razorpay_payment_id,
                message: "Payment verified successfully",
                activationPending: true,
            });
        }

        const activationData = await activateResponse.json();

        return NextResponse.json({
            success: true,
            paymentId: razorpay_payment_id,
            message: "Payment verified and plan activated successfully",
            subscription: activationData,
        });
    } catch (error: any) {
        console.error("Payment verification error:", error);
        return NextResponse.json(
            { message: error?.message || "Payment verification failed" },
            { status: 500 }
        );
    }
}
