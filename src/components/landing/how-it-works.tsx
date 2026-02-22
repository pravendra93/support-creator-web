"use client";

import { Upload, Brain, Code, Sparkles, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const steps = [
    {
        icon: Upload,
        step: "01",
        title: "Upload Your Data",
        description:
            "Connect your knowledge base — upload PDFs, documents, FAQs, website URLs, or any text data. Our system accepts all major formats.",
        color: "from-blue-500 to-cyan-400",
        glowColor: "rgba(59, 130, 246, 0.3)",
    },
    {
        icon: Brain,
        step: "02",
        title: "AI Learns & Indexes",
        description:
            "Our RAG engine chunks, embeds, and indexes your data into a high-performance vector store. Your AI agent becomes an expert on your business.",
        color: "from-purple-500 to-pink-500",
        glowColor: "rgba(168, 85, 247, 0.3)",
    },
    {
        icon: Code,
        step: "03",
        title: "Deploy in Seconds",
        description:
            "Embed a fully trained AI chatbot on your website with a single script tag. Customize colors, tone, and behavior to match your brand.",
        color: "from-emerald-500 to-teal-400",
        glowColor: "rgba(16, 185, 129, 0.3)",
    },
    {
        icon: Sparkles,
        step: "04",
        title: "Delight Customers 24/7",
        description:
            "Your AI agent answers customer questions instantly and accurately — day or night. Reduce support tickets by up to 80%.",
        color: "from-amber-500 to-orange-400",
        glowColor: "rgba(245, 158, 11, 0.3)",
    },
];

export default function HowItWorks() {
    const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const observers = cardRefs.current.map((ref, index) => {
            if (!ref) return null;
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setVisibleCards((prev) => new Set(prev).add(index));
                    }
                },
                { threshold: 0.2 }
            );
            observer.observe(ref);
            return observer;
        });

        return () => {
            observers.forEach((observer) => observer?.disconnect());
        };
    }, []);

    return (
        <section className="relative py-20 md:py-32 overflow-hidden" id="how-it-works">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-slate-950/80 to-background" />
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                backgroundSize: "40px 40px",
            }} />

            <div className="container relative">
                {/* Section Header */}
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16 md:mb-20">
                    <div className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-400 backdrop-blur-sm">
                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                        How It Works
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                        From Data to AI Agent in 4 Steps
                    </h2>
                    <p className="max-w-[700px] text-muted-foreground md:text-lg">
                        Transform your business knowledge into an intelligent AI support agent that serves your customers around the clock.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
                    {steps.map((step, index) => (
                        <div key={step.step} className="relative flex flex-col items-center">
                            {/* Connector Arrow (hidden on last item and mobile) */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-12 -right-3 z-10">
                                    <ArrowRight className="w-5 h-5 text-slate-600" />
                                </div>
                            )}

                            <div
                                ref={(el) => { cardRefs.current[index] = el; }}
                                className={`group relative w-full rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm p-6 transition-all duration-700 hover:border-white/15 hover:bg-slate-900/80 ${visibleCards.has(index)
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 translate-y-8"
                                    }`}
                                style={{ transitionDelay: `${index * 150}ms` }}
                            >
                                {/* Glow on hover */}
                                <div
                                    className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
                                    style={{ background: `linear-gradient(135deg, ${step.glowColor}, transparent)` }}
                                />

                                <div className="relative">
                                    {/* Step number */}
                                    <div className="text-xs font-mono text-slate-400 mb-4 tracking-widest">
                                        STEP {step.step}
                                    </div>

                                    {/* Icon */}
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} mb-5 shadow-lg`}>
                                        <step.icon className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
