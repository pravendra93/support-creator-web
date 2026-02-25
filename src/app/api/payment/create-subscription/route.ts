import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token");

        if (!sessionToken) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { planId, currency } = body;

        if (!planId) {
            return NextResponse.json({ message: "Plan ID is required" }, { status: 400 });
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            return NextResponse.json({ message: "Payment gateway not configured" }, { status: 500 });
        }

        // 1. Fetch Plan from PRODUCTION backend
        const planRes = await fetch(`${BACKEND_URL}/v1/plans/${planId}`, {
            headers: {
                Authorization: `Bearer ${sessionToken.value}`,
            },
        });

        if (!planRes.ok) {
            throw new Error("Failed to fetch plan specifics");
        }

        const plan = await planRes.json();
        let razorpayPlanId = plan.razorpay_plan_id;

        const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

        // 2. If razorpay_plan_id is null, create Razorpay Plan
        if (!razorpayPlanId) {
            const rzpPlanPayload = {
                period: plan.interval === "month" ? "monthly" : (plan.interval === "year" ? "yearly" : "monthly"),
                interval: plan.interval_count || 1,
                item: {
                    name: `${plan.name} Plan`,
                    amount: plan.price_cents,
                    currency: currency || plan.currency,
                    description: `${plan.name} Subscription`
                }
            };

            const rzpPlanRes = await fetch("https://api.razorpay.com/v1/plans", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authHeader,
                },
                body: JSON.stringify(rzpPlanPayload)
            });

            if (!rzpPlanRes.ok) {
                const err = await rzpPlanRes.json();
                console.error("Failed to create Razorpay Plan:", err);
                throw new Error("Failed to create Razorpay Plan");
            }

            const rzpPlan = await rzpPlanRes.json();
            console.log("📍 [RAZORPAY POST /v1/plans] Response:", JSON.stringify(rzpPlan, null, 2));
            razorpayPlanId = rzpPlan.id;

            // Save razorpay_plan_id to DB
            await fetch(`${BACKEND_URL}/v1/plans/${planId}/razorpay-plan`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${sessionToken.value}`,
                },
                body: JSON.stringify({ razorpay_plan_id: razorpayPlanId }),
            });
        }

        // 3. Create Subscription
        const subPayload = {
            plan_id: razorpayPlanId,
            total_count: 120, // Example: 10 years of monthly
            quantity: 1,
            customer_notify: 1,
            notes: {
                app_plan_id: planId,
                plan_name: plan.name || "",
            }
        };

        const subRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
            },
            body: JSON.stringify(subPayload)
        });

        if (!subRes.ok) {
            const err = await subRes.json();
            console.error("Razorpay subscription creation failed:", err);
            throw new Error(err.error?.description || "Failed to create Razorpay subscription");
        }

        const sub = await subRes.json();
        console.log("📍 [RAZORPAY POST /v1/subscriptions] Raw Response:", JSON.stringify(sub, null, 2));

        if (!sub?.id?.startsWith("sub_") || sub.id === "sub_") {
            console.error("📍 [ERROR] Invalid subscription ID issue:", sub);
            throw new Error("Invalid subscription ID received from Razorpay");
        }

        console.log("📍 [SUCCESS] Returning data to frontend:", {
            razorpay_subscription_id: sub.id,
            razorpay_plan_id: razorpayPlanId,
            razorpay_key_id: keyId,
            currency: currency || plan.currency,
            trial_days: plan.trial_days
        });

        return NextResponse.json({
            razorpay_subscription_id: sub.id,
            razorpay_plan_id: razorpayPlanId,
            razorpay_key_id: keyId,
            currency: currency || plan.currency,
            trial_days: plan.trial_days
        });

    } catch (error: unknown) {
        console.error("Subscription setup error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to initiate subscription";
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
