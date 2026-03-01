"use client";

import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description: string;
    howItWorks?: string;
    actions?: React.ReactNode;
    icon?: React.ElementType;
    gradient?: string;
}

export function PageHeader({
    title,
    description,
    howItWorks,
    actions,
    icon: Icon,
    gradient = "from-indigo-500 to-purple-500"
}: PageHeaderProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="flex flex-col gap-6 mb-8 animate-in fade-in slide-in-from-top duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    {Icon && (
                        <div className={cn(
                            "p-3 rounded-2xl bg-gradient-to-br shadow-lg shrink-0",
                            gradient
                        )}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        <p className="text-slate-400 text-sm font-medium mt-1">
                            {description}
                        </p>
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>

            {howItWorks && (
                <div className={cn(
                    "relative overflow-hidden transition-all duration-500 rounded-3xl border border-white/5 bg-[#13171F]/50 backdrop-blur-sm",
                    isExpanded ? "max-h-[500px]" : "max-h-[64px]"
                )}>
                    {/* Subtle Sparkle Background */}
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Sparkles className="w-16 h-16 text-indigo-500" />
                    </div>

                    <div
                        className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors group"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                <Info className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">
                                How this page works
                            </span>
                        </div>
                        <div className="text-slate-500">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </div>

                    <div className="px-5 pb-6 pt-0">
                        <div className="h-[1px] w-full bg-white/5 mb-5" />
                        <p className="text-sm text-slate-400 leading-relaxed max-w-4xl">
                            {howItWorks}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
