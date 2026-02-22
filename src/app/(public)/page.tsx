import Hero from "@/components/landing/hero";
import TrustSection from "@/components/landing/trust-section";
import HowItWorks from "@/components/landing/how-it-works";
import Features from "@/components/landing/features";
import Pricing from "@/components/landing/pricing";
import CTASection from "@/components/landing/cta-section";
import { BACKEND_URL } from "@/lib/config";
import type { Plan } from "@/types/plan";

async function getPublicPlans(): Promise<Plan[]> {
    try {
        const response = await fetch(`${BACKEND_URL}/v1/plans/`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            next: { revalidate: 300 }, // Cache for 5 minutes
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.filter((p: Plan) => p.active);
    } catch {
        return [];
    }
}

export default async function Home() {
    const plans = await getPublicPlans();

    return (
        <>
            <Hero />
            <TrustSection />
            <HowItWorks />
            <Features />
            <Pricing initialPlans={plans} />
            <CTASection />
        </>
    );
}
