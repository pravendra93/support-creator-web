"use client";

import React, { useEffect, useRef, useState } from "react";
import { Plan } from "@/types/plan";
import {
    Shield,
    Lock,
    CheckCircle2,
    X,
    CreditCard,
    Zap,
    AlertCircle,
    Loader2,
    Smartphone,
    Building2,
    Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/use-geo-detect";

interface RazorpayPaymentModalProps {
    plan: Plan;
    isIndia: boolean;
    onClose: () => void;
    onSuccess: (paymentId: string) => void;
}

declare global {
    interface Window {
         
        Razorpay: unknown;
    }
}

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window === "undefined") return resolve(false);
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export function RazorpayPaymentModal({
    plan,
    isIndia,
    onClose,
    onSuccess,
}: RazorpayPaymentModalProps) {
    const [step, setStep] = useState<"confirm" | "processing" | "success" | "error">("confirm");
    const [errorMsg, setErrorMsg] = useState("");
    const overlayRef = useRef<HTMLDivElement>(null);

    // Resolve display currency based on geo
    const priceInfo = formatCurrency(plan.price_cents, plan.currency, isIndia);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current && step === "confirm") onClose();
    };

    useEffect(() => {
        const previous = document.activeElement as HTMLElement;
        return () => previous?.focus();
    }, []);

    const initiatePayment = async () => {
        setStep("processing");
        setErrorMsg("");

        try {
            // 1. Load Razorpay SDK
            const loaded = await loadRazorpayScript();
            if (!loaded) throw new Error("Failed to load Razorpay SDK. Check your internet connection.");

            // 2. Create subscription on server
            const subRes = await fetch("/api/payment/create-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId: plan.id,
                    currency: priceInfo.currency,
                }),
            });

            const subData = await subRes.json();
            if (!subRes.ok) throw new Error(subData.message || "Failed to create subscription");

            // Validate sub ID prefix
            if (!subData?.razorpay_subscription_id?.startsWith("sub_") || subData.razorpay_subscription_id === "sub_") {
                console.error("Invalid subscription ID received:", subData);
                throw new Error("Invalid subscription ID. Please contact support.");
            }

            // 3. Open Razorpay checkout for subscriptions
            await new Promise<void>((resolve, reject) => {
                const rzpConfig: Record<string, unknown> = {
                    key: subData.razorpay_key_id,
                    subscription_id: subData.razorpay_subscription_id,
                    name: "Assistra",
                    description: `${plan.name} Plan Subscription`,
                    prefill: {
                        name: "Test User",
                        email: "test@assistra.app",
                        contact: "9999999999"
                    },
                    theme: {
                        color: "#6366f1",
                        hide_topbar: false,
                    },
                    handler: async (response: {
                        razorpay_payment_id: string;
                        razorpay_subscription_id: string;
                        razorpay_signature: string;
                    }) => {
                        try {
                            const verifyRes = await fetch("/api/payment/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_subscription_id: response.razorpay_subscription_id,
                                    razorpay_signature: response.razorpay_signature,
                                    planId: plan.id,
                                }),
                            });
                            const verifyData = await verifyRes.json();
                            if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed");
                            setStep("success");
                            onSuccess(response.razorpay_payment_id);
                            resolve();
                        } catch (err: unknown) {
                            reject(err);
                        }
                    },
                    modal: {
                        ondismiss: () => reject(new Error("Payment cancelled")),
                        escape: true,
                        animation: true,
                    },
                };

                // EXPERT DEBUGGING LOGS (Step 5 request):
                console.log("📍 [CHECKOUT INIT] rzpConfig Key:", rzpConfig.key);
                console.log("📍 [CHECKOUT INIT] rzpConfig Sub ID:", rzpConfig.subscription_id);
                console.log("📍 [CHECKOUT INIT] Validating object:", rzpConfig);

                const rzp = new window.Razorpay(rzpConfig);

                rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
                    reject(new Error(response.error?.description || "Payment failed"));
                });

                rzp.open();
            });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
            if (errorMessage === "Payment cancelled") {
                setStep("confirm");
            } else {
                setErrorMsg(errorMessage);
                setStep("error");
            }
        }
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(12px)",
            }}
        >
            <div
                className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: "linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 100%)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    boxShadow: "0 25px 60px rgba(99,102,241,0.2), 0 0 0 1px rgba(255,255,255,0.05)",
                }}
            >
                {/* Top glow line */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px"
                    style={{ background: "linear-gradient(90deg, transparent, #6366f1, transparent)" }}
                />

                {/* ── CONFIRM ── */}
                {step === "confirm" && (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{
                                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                        boxShadow: "0 0 20px rgba(99,102,241,0.4)",
                                    }}
                                >
                                    <Zap className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-indigo-300/70 uppercase tracking-widest font-medium">
                                        Upgrade Plan
                                    </p>
                                    <h2 className="text-white font-bold text-lg leading-tight">{plan.name}</h2>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                                style={{ background: "rgba(255,255,255,0.05)" }}
                                onMouseOver={(e) =>
                                    ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)")
                                }
                                onMouseOut={(e) =>
                                    ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)")
                                }
                            >
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>

                        {/* Price card */}
                        <div className="px-6 pb-4">
                            <div
                                className="rounded-xl p-5"
                                style={{
                                    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))",
                                    border: "1px solid rgba(99,102,241,0.2)",
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm">Total Amount</p>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-3xl font-extrabold text-white">
                                                {priceInfo.display}
                                            </span>
                                            <span className="text-gray-400 text-sm">
                                                /{plan.interval === "one_time" ? "once" : plan.interval}
                                            </span>
                                        </div>
                                        {priceInfo.converted && (
                                            <p className="text-yellow-400/70 text-xs mt-1">
                                                ≈ Converted from {plan.currency.toUpperCase()} for Indian payments
                                            </p>
                                        )}
                                        {plan.trial_days > 0 && (
                                            <p className="text-indigo-400 text-xs mt-1">
                                                🎁 {plan.trial_days}-day free trial included
                                            </p>
                                        )}
                                    </div>
                                    <div
                                        className="text-4xl leading-none"
                                        style={{ filter: "drop-shadow(0 0 12px rgba(99,102,241,0.6))" }}
                                    >
                                        {priceInfo.currency === "INR" ? "₹" : "$"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Indian payment methods banner */}
                        {isIndia && (
                            <div className="px-6 pb-3">
                                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-widest">
                                    Available Payment Methods
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { icon: Smartphone, label: "UPI", sublabel: "GPay, PhonePe" },
                                        { icon: Building2, label: "Netbanking", sublabel: "All banks" },
                                        { icon: CreditCard, label: "Cards", sublabel: "Visa, MC, Rupay" },
                                        { icon: Wallet, label: "Wallets", sublabel: "Paytm & more" },
                                    ].map(({ icon: Icon, label, sublabel }) => (
                                        <div
                                            key={label}
                                            className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-center"
                                            style={{
                                                background: "rgba(99,102,241,0.06)",
                                                border: "1px solid rgba(99,102,241,0.15)",
                                            }}
                                        >
                                            <Icon className="h-4 w-4 text-indigo-400" />
                                            <span className="text-[10px] text-gray-300 font-semibold leading-tight">
                                                {label}
                                            </span>
                                            <span className="text-[9px] text-gray-600 leading-tight">
                                                {sublabel}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-600 mt-2 text-center">
                                    QR Code & UPI Collect also available at checkout
                                </p>
                            </div>
                        )}

                        {/* Description */}
                        {plan.description && (
                            <div className="px-6 pb-3">
                                <p className="text-gray-400 text-sm leading-relaxed">{plan.description}</p>
                            </div>
                        )}

                        {/* Trust signals */}
                        <div className="px-6 pb-4">
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { icon: Shield, label: "Secure SSL" },
                                    { icon: Lock, label: "Encrypted" },
                                    { icon: CreditCard, label: "PCI Compliant" },
                                ].map(({ icon: Icon, label }) => (
                                    <div
                                        key={label}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl"
                                        style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                        }}
                                    >
                                        <Icon className="h-4 w-4 text-indigo-400" />
                                        <span className="text-[10px] text-gray-500 font-medium">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="px-6 pb-6">
                            <button
                                id="razorpay-pay-btn"
                                onClick={initiatePayment}
                                className="w-full py-4 rounded-xl font-bold text-white relative overflow-hidden cursor-pointer transition-transform active:scale-[0.98]"
                                style={{
                                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
                                    boxShadow: "0 8px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                                }}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2 text-base">
                                    <Zap className="h-4 w-4" />
                                    Pay {priceInfo.display} Securely
                                </span>
                            </button>
                            <p className="text-center text-gray-600 text-xs mt-3">
                                Powered by{" "}
                                <span className="text-gray-500 font-medium">Razorpay</span>
                                {" · "}By proceeding you agree to our Terms & Privacy Policy
                            </p>
                        </div>
                    </>
                )}

                {/* ── PROCESSING ── */}
                {step === "processing" && (
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                            style={{
                                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",
                                border: "2px solid rgba(99,102,241,0.3)",
                                boxShadow: "0 0 40px rgba(99,102,241,0.2)",
                            }}
                        >
                            <Loader2 className="h-9 w-9 text-indigo-400 animate-spin" />
                        </div>
                        <h3 className="text-white font-bold text-xl mb-2">Processing Payment</h3>
                        <p className="text-gray-400 text-sm text-center">
                            Please complete the payment in the Razorpay window.{" "}
                            {isIndia && "You can pay via UPI, Card, Netbanking or Wallet."}
                        </p>
                    </div>
                )}

                {/* ── SUCCESS ── */}
                {step === "success" && (
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                            style={{
                                background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.15))",
                                border: "2px solid rgba(34,197,94,0.4)",
                                boxShadow: "0 0 40px rgba(34,197,94,0.2)",
                            }}
                        >
                            <CheckCircle2 className="h-10 w-10 text-green-400" />
                        </div>
                        <h3 className="text-white font-bold text-xl mb-2">Payment Successful! 🎉</h3>
                        <p className="text-gray-400 text-sm text-center mb-2">
                            Your <span className="text-indigo-300 font-semibold">{plan.name}</span> plan is now active.
                        </p>
                        <p className="text-gray-500 text-xs text-center mb-8">
                            A confirmation has been sent to your email.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 rounded-xl font-semibold text-white cursor-pointer"
                            style={{
                                background: "linear-gradient(135deg, #22c55e, #10b981)",
                                boxShadow: "0 8px 20px rgba(34,197,94,0.3)",
                            }}
                        >
                            Continue to Dashboard
                        </button>
                    </div>
                )}

                {/* ── ERROR ── */}
                {step === "error" && (
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                            style={{
                                background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))",
                                border: "2px solid rgba(239,68,68,0.4)",
                                boxShadow: "0 0 40px rgba(239,68,68,0.2)",
                            }}
                        >
                            <AlertCircle className="h-10 w-10 text-red-400" />
                        </div>
                        <h3 className="text-white font-bold text-xl mb-2">Payment Failed</h3>
                        <p className="text-gray-400 text-sm text-center mb-8 max-w-xs leading-relaxed">
                            {errorMsg || "An unexpected error occurred. Your card has NOT been charged."}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-semibold text-gray-300 cursor-pointer"
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setStep("confirm")}
                                className="px-6 py-3 rounded-xl font-semibold text-white cursor-pointer"
                                style={{
                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    boxShadow: "0 8px 20px rgba(99,102,241,0.3)",
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
