import dynamic from "next/dynamic";
import Hero from "@/components/landing/hero";

const TrustSection = dynamic(() => import("@/components/landing/trust-section"));
const HowItWorks = dynamic(() => import("@/components/landing/how-it-works"));
const Features = dynamic(() => import("@/components/landing/features"));
const Pricing = dynamic(() => import("@/components/landing/pricing"));
const CTASection = dynamic(() => import("@/components/landing/cta-section"));

export default function Home() {
    return (
        <>
            <Hero />
            <TrustSection />
            <HowItWorks />
            <Features />
            <Pricing />
            <CTASection />
        </>
    );
}
