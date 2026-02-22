"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const slides = [
    {
        src: "/images/slides/slide-1-upload.png",
        alt: "Step 1: Upload Your Business Data",
        title: "Upload Your Data",
        description: "Connect your knowledge base — PDFs, docs, FAQs, and more.",
    },
    {
        src: "/images/slides/slide-2-processing.png",
        alt: "Step 2: AI Learns Your Business",
        title: "AI Learns Your Business",
        description: "Our RAG engine transforms your data into intelligent, searchable knowledge.",
    },
    {
        src: "/images/slides/slide-3-deploy.png",
        alt: "Step 3: Deploy Your AI Agent",
        title: "Deploy in Minutes",
        description: "Embed a fully trained AI chatbot on your website with one line of code.",
    },
    {
        src: "/images/slides/slide-4-delight.png",
        alt: "Step 4: Delight Your Customers 24/7",
        title: "Delight Customers 24/7",
        description: "Instant, accurate answers that drive satisfaction and reduce support costs.",
    },
];

export default function HeroSlider() {
    const [current, setCurrent] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const goTo = useCallback(
        (index: number) => {
            if (isTransitioning) return;
            setIsTransitioning(true);
            setCurrent(index);
            setTimeout(() => setIsTransitioning(false), 600);
        },
        [isTransitioning]
    );

    const next = useCallback(() => {
        goTo((current + 1) % slides.length);
    }, [current, goTo]);

    const prev = useCallback(() => {
        goTo((current - 1 + slides.length) % slides.length);
    }, [current, goTo]);

    useEffect(() => {
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [next]);

    return (
        <div className="relative group" id="hero-slider">
            {/* Glow ring behind the slider */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-cyan-500/20 to-purple-600/20 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl">
                {/* Slide Container */}
                <div className="relative aspect-video overflow-hidden">
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-all duration-600 ease-in-out ${index === current
                                ? "opacity-100 scale-100 z-10"
                                : "opacity-0 scale-105 z-0"
                                }`}
                        >
                            <Image
                                src={slide.src}
                                alt={slide.alt}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-contain object-top bg-slate-900"
                                priority
                            />
                            {/* Gradient overlay at bottom for text */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                        </div>
                    ))}

                    {/* Text overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10 min-h-[160px] md:min-h-[180px] flex flex-col justify-end">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-purple-500/20 border border-purple-500/30 px-3 py-1 text-xs font-medium text-purple-300 backdrop-blur-sm">
                                Step {current + 1} of {slides.length}
                            </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                            {slides[current].title}
                        </h2>
                        <p className="text-sm md:text-base text-slate-300 max-w-lg">
                            {slides[current].description}
                        </p>
                    </div>
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:scale-110 cursor-pointer"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:scale-110 cursor-pointer"
                    aria-label="Next slide"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 right-6 md:right-8 z-20 flex gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goTo(index)}
                            className={`transition-all duration-300 rounded-full cursor-pointer ${index === current
                                ? "w-8 h-2 bg-purple-400"
                                : "w-2 h-2 bg-white/30 hover:bg-white/60"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
