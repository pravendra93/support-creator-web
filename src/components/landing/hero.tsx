import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        <span className="mr-1">🚀</span> Now in Public Beta
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                        AI Support Agents for <br className="hidden md:inline" />
                        Modern Travel Agencies
                    </h1>
                    <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                        Deploy intelligent chatbots in minutes. Train on your data, customize branding, and delight your customers 24/7.
                    </p>
                    <div className="space-x-4">
                        <Link href="/register">
                            <Button size="lg" className="h-12 px-8">
                                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="#demo">
                            <Button variant="outline" size="lg" className="h-12 px-8">
                                View Demo
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Visual Element / Placeholder for Dashboard Preview */}
                <div className="mx-auto mt-16 max-w-5xl rounded-xl border bg-background p-4 shadow-2xl lg:p-8">
                    <div className="aspect-video overflow-hidden rounded-lg border bg-muted/50 flex items-center justify-center">
                        <div className="text-center">
                            <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Dashboard Preview / Chat Interface</p>
                        </div>
                    </div>
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
