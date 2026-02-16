"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
    { value: "99.9%", label: "Uptime Guarantee", prefix: "", suffix: "" },
    { value: "< 2s", label: "Avg Response Time", prefix: "", suffix: "" },
    { value: "50K+", label: "Conversations Powered", prefix: "", suffix: "" },
    { value: "4.9/5", label: "Customer Satisfaction", prefix: "", suffix: "" },
];

const trustedBy = [
    "TravelCo",
    "JetSetGo",
    "WanderLux",
    "TripWise",
    "VoyageAI",
    "BookSmart",
];

export default function TrustSection() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ref = sectionRef.current;
        if (!ref) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.2 }
        );
        observer.observe(ref);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="relative py-16 md:py-24 overflow-hidden" id="trust-section">
            {/* Subtle gradient divider top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            <div className="container">
                {/* Stats Row */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="text-center group"
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                                {stat.value}
                            </div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Trusted By */}
                <div className={`text-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-8">
                        Trusted by forward-thinking businesses
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                        {trustedBy.map((brand) => (
                            <div
                                key={brand}
                                className="text-lg md:text-xl font-semibold text-slate-400/50 hover:text-slate-400 transition-colors duration-300 cursor-default"
                            >
                                {brand}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Subtle gradient divider bottom */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </section>
    );
}
