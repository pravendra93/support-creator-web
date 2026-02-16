import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import Features from "@/components/landing/features";
import TrustSection from "@/components/landing/trust-section";
import Pricing from "@/components/landing/pricing";
import CTASection from "@/components/landing/cta-section";

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
