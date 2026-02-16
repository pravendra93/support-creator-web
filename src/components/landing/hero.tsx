import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import HeroSlider from "./hero-slider";

export default function Hero() {
    return (
        <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16">
            <div className="container">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 px-4 py-1.5 text-sm font-medium text-purple-400 backdrop-blur-sm transition-colors">
                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                        Now in Public Beta
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-white dark:to-slate-400 bg-clip-text text-transparent">
                        AI Support Agents for <br className="hidden md:inline" />
                        <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
                            Modern Businesses
                        </span>
                    </h1>
                    <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                        Deploy intelligent chatbots trained on{" "}
                        <span className="font-semibold text-foreground">your data</span>.
                        Customize branding, and delight your customers 24/7 with instant, accurate answers.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-2">
                        <Link href="/register">
                            <Button
                                size="lg"
                                className="h-13 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.02] cursor-pointer"
                            >
                                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="#how-it-works">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-13 px-8 rounded-xl border-white/10 hover:bg-white/5 transition-all duration-300 cursor-pointer"
                            >
                                See How It Works
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Slider — replaces the old placeholder */}
                <div className="mx-auto mt-16 max-w-5xl">
                    <HeroSlider />
                </div>
            </div>

            {/* Background Gradients */}
            <div className="absolute top-0 -z-10 h-full w-full bg-white dark:bg-slate-950">
                <div className="absolute bottom-auto left-auto right-0 top-0 h-[500px] w-[500px] -translate-x-[30%] translate-y-[20%] rounded-full bg-[rgba(173,109,244,0.5)] opacity-50 blur-[80px]"></div>
                <div className="absolute bottom-auto left-0 right-auto top-0 h-[500px] w-[500px] -translate-x-[30%] translate-y-[20%] rounded-full bg-[rgba(108,56,255,0.5)] opacity-50 blur-[80px]"></div>
            </div>
        </section>
    );
}
