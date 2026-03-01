// Razorpay Webhook Handler – Secure, Idempotent, Observable
import { NextResponse } from "next/server";
import crypto from "crypto";
import { BACKEND_URL } from "@/lib/config";

// Configuration constants
const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1 MiB
const FETCH_TIMEOUT_MS = 5000; // 5 seconds
// Simple in‑memory cache for idempotency (could be replaced with Redis/DB in prod)
const processedEventIds = new Set<string>();

/** Utility: Read request body with size guard */
async function readRequestBody(request: Request): Promise<string> {
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
        throw new Error("Payload too large");
    }
    const body = await request.text();
    if (body.length > MAX_BODY_SIZE) {
        throw new Error("Payload too large");
    }
    return body;
}

/** Utility: Verify Razorpay signature safely */
function verifySignature(body: string, signature: string, secret: string): boolean {
    // Ensure buffers are same length before timingSafeEqual to avoid exception
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Utility: Forward webhook payload to internal service with timeout */
async function forwardEvent(event: unknown): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(`${BACKEND_URL}/v1/subscriptions/webhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event),
            signal: controller.signal,
        });
        if (!response.ok) {
            const txt = await response.text();
            console.error(
                JSON.stringify({
                    level: "error",
                    message: "Failed to forward webhook",
                    status: response.status,
                    body: txt,
                })
            );
            throw new Error(`Forward failed with status ${response.status}`);
        }
    } finally {
        clearTimeout(timeout);
    }
}

export async function POST(request: Request) {
    const requestId = crypto.randomUUID(); // correlation ID for logs
    try {
        // Basic header validation
        const contentType = request.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
            console.warn(
                JSON.stringify({ requestId, level: "warn", message: "Invalid content type" })
            );
            return NextResponse.json({ message: "Invalid content type" }, { status: 400 });
        }

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = request.headers.get("x-razorpay-signature");
        if (!webhookSecret || !signature) {
            console.warn(
                JSON.stringify({ requestId, level: "warn", message: "Missing secret or signature" })
            );
            return NextResponse.json({ message: "Invalid request" }, { status: 400 });
        }

        const body = await readRequestBody(request);
        if (!verifySignature(body, signature, webhookSecret)) {
            console.warn(
                JSON.stringify({ requestId, level: "warn", message: "Signature verification failed" })
            );
            return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);
        // Idempotency – ignore duplicate events based on Razorpay's event id (if present)
        const eventId = (event as any).id ?? (event as any).payload?.payment?.entity?.id;
        if (eventId) {
            if (processedEventIds.has(eventId)) {
                console.info(
                    JSON.stringify({ requestId, level: "info", message: "Duplicate event ignored", eventId })
                );
                return NextResponse.json({ success: true, duplicate: true });
            }
            processedEventIds.add(eventId);
        }

        console.info(
            JSON.stringify({ requestId, level: "info", message: "Webhook received", event: (event as any).event })
        );

        // Forward to internal service (await to guarantee delivery)
        await forwardEvent(event);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error(
            JSON.stringify({ requestId, level: "error", message: error.message || "Unexpected error" })
        );
        const status = error.message === "Payload too large" ? 413 : 500;
        return NextResponse.json({ message: error.message || "Internal server error" }, { status });
    }
}
