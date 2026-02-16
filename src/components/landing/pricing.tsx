"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const plans = [
    {
        name: "Starter",
        price: "$49",
        description: "Perfect for small businesses just getting started.",
        features: [
            "1 AI Chatbot",
            "1,000 Messages/mo",
            "Basic Analytics",
            "Email Support",
            "Standard Branding",
        ],
        popular: false,
        cta: "Get Started",
        gradient: "",
    },
    {
        name: "Pro",
        price: "$149",
        description: "For growing businesses with higher volume.",
        features: [
            "3 AI Chatbots",
            "10,000 Messages/mo",
            "Advanced Analytics",
            "Priority Support",
            "Remove Branding",
            "Custom Training Data",
        ],
        popular: true,
        cta: "Get Started",
        gradient: "from-purple-600 to-blue-600",
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Tailored solutions for large organizations.",
        features: [
            "Unlimited Chatbots",
            "Unlimited Messages",
            "Custom Integrations",
            "Dedicated Account Manager",
            "SLA Support",
            "On-premise Deployment",
        ],
        popular: false,
        cta: "Contact Sales",
        gradient: "",
    },
];

export default function Pricing() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ref = sectionRef.current;
        if (!ref) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.1 }
        );
        observer.observe(ref);
        return () => observer.disconnect();
    }, []);

    return (
        <section id="pricing" ref={sectionRef} className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-purple-600/5 blur-[150px]" />

            <div className="container relative">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-400 backdrop-blur-sm">
                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                        Pricing
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                        Simple,{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            transparent
                        </span>{" "}
                        pricing
                    </h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Choose the plan that fits your needs. No hidden fees. Cancel anytime.
                    </p>
                </div>
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 lg:gap-8">
                    {plans.map((plan, index) => (
                        <div
                            key={plan.name}
                            className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                } ${plan.popular
                                    ? "border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-transparent shadow-2xl shadow-purple-500/10 scale-[1.02]"
                                    : "border-white/5 bg-slate-900/30 hover:border-white/15"
                                }`}
                            style={{ transitionDelay: `${index * 150}ms` }}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-purple-500/25">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                <span className="text-sm text-muted-foreground">/mo</span>
                            </div>

                            <ul className="space-y-3 text-sm mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center text-slate-300">
                                        <div className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full ${plan.popular ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-slate-400"}`}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Link href={plan.cta === "Contact Sales" ? "mailto:sales@assistra.ai" : "/register"} className="w-full">
                                <Button
                                    className={`w-full rounded-xl h-12 cursor-pointer transition-all duration-300 ${plan.popular
                                        ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 text-white"
                                        : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                                        }`}
                                    variant={plan.popular ? "default" : "outline"}
                                >
                                    {plan.cta}
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
