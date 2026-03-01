"use client";

import { useState, useEffect } from "react";

export interface GeoInfo {
    isIndia: boolean;
    currency: "INR" | "USD";
    currencySymbol: "₹" | "$";
    locale: string;
    /** true while detection is still running */
    loading: boolean;
}

/**
 * Detects if the user is in India using:
 * 1. Intl timezone  → "Asia/Calcutta" | "Asia/Kolkata"
 * 2. navigator.language → "en-IN" or regional variants
 *
 * Instant — no network call required.
 */
export function useGeoDetect(): GeoInfo {
    const [info, setInfo] = useState<GeoInfo>({
        isIndia: false,
        currency: "USD",
        currencySymbol: "$",
        locale: "en-US",
        loading: true,
    });

    useEffect(() => {
        // ---------- 1. Timezone check ----------
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
        const isIndiaByTz =
            tz === "Asia/Calcutta" ||
            tz === "Asia/Kolkata" ||
            tz.startsWith("Asia/Kolkata") ||
            tz.startsWith("Asia/Calcutta");

        // ---------- 2. Language / locale check ----------
        const langs = [...(navigator.languages ?? [navigator.language ?? ""])];
        const isIndiaByLang = langs.some(
            (l) =>
                l.toLowerCase().startsWith("en-in") ||
                l.toLowerCase().startsWith("hi") ||
                l.toLowerCase().startsWith("bn") ||
                l.toLowerCase().startsWith("ta") ||
                l.toLowerCase().startsWith("te") ||
                l.toLowerCase().startsWith("mr") ||
                l.toLowerCase().startsWith("gu") ||
                l.toLowerCase().startsWith("kn") ||
                l.toLowerCase().startsWith("ml") ||
                l.toLowerCase().startsWith("pa")
        );

        const isIndia = isIndiaByTz || isIndiaByLang;

        // Defer state update to avoid synchronous setState in the same effect
        setTimeout(() => {
            setInfo({
                isIndia,
                currency: isIndia ? "INR" : "USD",
                currencySymbol: isIndia ? "₹" : "$",
                locale: isIndia ? "en-IN" : "en-US",
                loading: false,
            });
        }, 0);
    }, []);

    return info;
}

/** Convert USD cents to INR paise using a fixed fallback rate */
export const USD_TO_INR_RATE = 84; // approx rate — update as needed

export function convertUsdCentsToInrPaise(usdCents: number): number {
    return Math.round(usdCents * USD_TO_INR_RATE);
}

export function formatCurrency(
    priceCents: number,
    planCurrency: string,
    isIndia: boolean
): { amount: number; currency: string; display: string; converted: boolean } {
    const planCurrencyUpper = planCurrency.toUpperCase();

    // If plan is already INR, use as-is
    if (planCurrencyUpper === "INR") {
        const amount = priceCents / 100;
        return {
            amount,
            currency: "INR",
            display: `₹${amount.toLocaleString("en-IN")}`,
            converted: false,
        };
    }

    // If user is Indian and plan is USD → convert to INR for display & payment
    if (isIndia && planCurrencyUpper === "USD") {
        const amountInr = (priceCents * USD_TO_INR_RATE) / 100;
        return {
            amount: amountInr,
            currency: "INR",
            display: `₹${Math.round(amountInr).toLocaleString("en-IN")}`,
            converted: true,
        };
    }

    // Otherwise show in plan's native currency
    const amount = priceCents / 100;
    return {
        amount,
        currency: planCurrencyUpper,
        display: new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: planCurrencyUpper,
        }).format(amount),
        converted: false,
    };
}
