"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import {
    LayoutDashboard,
    MessageSquare,
    Settings,
    CreditCard,
    Users,
    Bot,
    Building2,
    ScrollText
} from "lucide-react";

const sidebarLinks = [
    { name: "Overview", href: "/pages/dashboard", icon: LayoutDashboard },
    { name: "Conversations", href: "/pages/conversations", icon: MessageSquare },
    { name: "Teams", href: "/pages/team", icon: Users },
    { name: "Billing", href: "/pages/billing", icon: CreditCard },
    { name: "Workspaces", href: "/pages/tenants", icon: Building2, roles: ["super_admin", "tenant_admin", 'sub_admin'] },
    { name: "Coupons", href: "/pages/coupons", icon: Users, roles: ["super_admin"] },
    { name: "Plans", href: "/pages/plans", icon: CreditCard, roles: ["super_admin"] },
    { name: "Logs", href: "/pages/logs", icon: ScrollText, roles: ["super_admin"] },
    { name: "Settings", href: "/pages/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    return (
        <div className="hidden border-r bg-muted/40 md:block w-64 min-h-screen">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        AssistraAI
                    </span>
                </Link>
            </div>
            <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4">
                    {sidebarLinks
                        .filter((link) => !link.roles || (user?.role && link.roles.includes(user.role)))
                        .map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    pathname === link.href
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                {link.name}
                            </Link>
                        ))}
                </nav>
            </div>
        </div>
    );
}
