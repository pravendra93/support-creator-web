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
        const { planId, currency, billingCycle } = body;

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

        // Determine the correct amount in the target currency's smallest unit
        const USD_TO_INR_RATE = 84; // Must match the rate in use-geo-detect.ts
        const planCurrencyUpper = (plan.currency || "USD").toUpperCase();
        const paymentCurrency = (currency || plan.currency || "USD").toUpperCase();

        let amountInSmallestUnit = plan.price_cents; // default: plan's native price_cents

        // Convert USD cents → INR paise if paying in INR but plan is in USD
        if (paymentCurrency === "INR" && planCurrencyUpper === "USD") {
            amountInSmallestUnit = Math.round(plan.price_cents * USD_TO_INR_RATE);
        }

        // Apply yearly billing: monthly × 12 × 0.8 (20% discount)
        let razorpayPeriod = plan.interval === "month" ? "monthly" : (plan.interval === "year" ? "yearly" : "monthly");
        let razorpayIntervalCount = plan.interval_count || 1;

        if (billingCycle === "year" && plan.interval === "month") {
            // Yearly price = monthly amount × 12 × 0.8
            amountInSmallestUnit = Math.round(amountInSmallestUnit * 12 * 0.8);
            razorpayPeriod = "yearly";
            razorpayIntervalCount = 1;
        }

        console.log("📍 [PRICING] Plan price_cents:", plan.price_cents, "currency:", planCurrencyUpper,
            "→ payment currency:", paymentCurrency, "billingCycle:", billingCycle,
            "→ Razorpay amount:", amountInSmallestUnit);

        const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

        // 2. Always create a new Razorpay Plan for each subscription request.
        // Razorpay plans are immutable, so a previously cached plan may have a
        // different amount (e.g. wrong currency conversion or billing cycle).
        {
            const rzpPlanPayload = {
                period: razorpayPeriod,
                interval: razorpayIntervalCount,
                item: {
                    name: `${plan.name} Plan`,
                    amount: amountInSmallestUnit,
                    currency: paymentCurrency,
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
        }

        // 3. Create Subscription
        const totalCount = razorpayPeriod === "yearly" ? 10 : 120; // 10 years of yearly or monthly
        const subPayload = {
            plan_id: razorpayPlanId,
            total_count: totalCount,
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
