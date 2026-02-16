"use client";

import { Bot, Zap, Shield, Globe, BarChart, Users, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const features = [
    {
        name: "AI-Powered Chatbots",
        description: "Deploy intelligent agents that understand context and resolve queries instantly using your business data.",
        icon: Bot,
        gradient: "from-blue-500 to-cyan-400",
        glow: "rgba(59, 130, 246, 0.15)",
    },
    {
        name: "Multi-Channel Support",
        description: "Seamlessly integrate with your website, mobile app, and social platforms for unified support.",
        icon: Globe,
        gradient: "from-purple-500 to-pink-500",
        glow: "rgba(168, 85, 247, 0.15)",
    },
    {
        name: "Real-time Analytics",
        description: "Track performance, user satisfaction, and agent efficiency with comprehensive dashboards.",
        icon: BarChart,
        gradient: "from-emerald-500 to-teal-400",
        glow: "rgba(16, 185, 129, 0.15)",
    },
    {
        name: "Team Collaboration",
        description: "Invite team members, assign roles, and manage support workflows together seamlessly.",
        icon: Users,
        gradient: "from-amber-500 to-orange-400",
        glow: "rgba(245, 158, 11, 0.15)",
    },
    {
        name: "Brand Customization",
        description: "Fully customize the look, feel, and tone of voice to match your unique brand identity.",
        icon: Zap,
        gradient: "from-pink-500 to-rose-400",
        glow: "rgba(236, 72, 153, 0.15)",
    },
    {
        name: "Enterprise Security",
        description: "Bank-grade encryption, SOC 2 compliance, and privacy controls to keep data safe.",
        icon: Shield,
        gradient: "from-slate-400 to-slate-300",
        glow: "rgba(148, 163, 184, 0.15)",
    },
];

export default function Features() {
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
                { threshold: 0.15 }
            );
            observer.observe(ref);
            return observer;
        });
        return () => {
            observers.forEach((observer) => observer?.disconnect());
        };
    }, []);

    return (
        <section id="features" className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                backgroundSize: "32px 32px",
            }} />

            <div className="container relative">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-400 backdrop-blur-sm">
                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                        Key Features
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                        Everything you need to{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            scale support
                        </span>
                    </h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Our platform provides all the tools necessary to automate customer interactions and improve satisfaction scores.
                    </p>
                </div>
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <div
                            key={feature.name}
                            ref={(el) => { cardRefs.current[index] = el; }}
                            className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-sm p-6 transition-all duration-700 hover:border-white/15 hover:bg-slate-900/50 ${visibleCards.has(index)
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-6"
                                }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            {/* Hover glow */}
                            <div
                                className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10"
                                style={{ background: `radial-gradient(400px at 50% 50%, ${feature.glow}, transparent)` }}
                            />

                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg mb-5`}>
                                <feature.icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{feature.name}</h3>
                                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
