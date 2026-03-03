"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { trackSignupClick, trackCtaClicked } from "@/lib/ga";

export default function CTASection() {
    return (
        <section className="relative py-20 md:py-28 overflow-hidden" id="cta-section">
            {/* Background glow */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-purple-600/10 blur-[120px]" />
                <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />
            </div>

            <div className="container relative">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-400 backdrop-blur-sm mb-6">
                        <Zap className="w-3.5 h-3.5 mr-2" />
                        Get Started Today
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                        Ready to Transform Your{" "}
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            Customer Support?
                        </span>
                    </h2>

                    <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                        Join hundreds of businesses using AI-powered support agents. Set up in minutes, no coding required.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register">
                            <Button
                                size="lg"
                                className="h-14 px-10 text-base rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.02] cursor-pointer"
                                onClick={() => trackSignupClick()}
                            >
                                Start Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="#how-it-works">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-14 px-10 text-base rounded-xl border-white/10 hover:bg-white/5 transition-all duration-300 cursor-pointer"
                                onClick={() => trackCtaClicked("CTA Section: See How It Works")}
                            >
                                See How It Works
                            </Button>
                        </Link>
                    </div>

                    <p className="mt-6 text-xs text-muted-foreground">
                        No credit card required • Free 14-day trial • Cancel anytime
                    </p>
                </div>
            </div>
        </section>
    );
}
