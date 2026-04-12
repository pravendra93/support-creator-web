import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false);
    const [position, setPosition] = React.useState({ top: 0, left: 0 });
    const triggerRef = React.useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Default to showing above the element
            setPosition({
                top: rect.top - 10,
                left: rect.left + rect.width / 2
            });
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <div 
            ref={triggerRef}
            className="inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {isVisible && (
                <div 
                    className={cn(
                        "fixed z-[100] -translate-x-1/2 -translate-y-full px-3 py-1.5",
                        "bg-slate-900/90 text-white text-[11px] font-medium rounded-md shadow-lg backdrop-blur-sm",
                        "animate-in fade-in zoom-in-95 duration-200 pointer-events-none whitespace-nowrap",
                        className
                    )}
                    style={{ 
                        top: position.top, 
                        left: position.left 
                    }}
                >
                    {content}
                    {/* Arrow */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-0.5 border-4 border-transparent border-t-slate-900/90" />
                </div>
            )}
        </div>
    );
}
