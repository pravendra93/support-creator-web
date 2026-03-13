"use client";

import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sidebarLinks } from "./sidebar";
import { useAuth } from "@/context/auth-context";
import { trackCtaClicked } from "@/lib/ga";


export function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const getInitials = () => {
        if (!user) return "JD";
        const first = user.first_name?.[0] || "";
        const last = user.last_name?.[0] || "";
        return (first + last).toUpperCase() || "U";
    };

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                    <nav className="grid gap-2 text-lg font-medium">
                        <Link
                            href="#"
                            className="flex items-center gap-2 text-lg font-semibold"
                        >
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                AssistraAI
                            </span>
                        </Link>
                        {sidebarLinks
                            .filter((link) => !link.roles || (user?.role && link.roles.includes(user.role)))
                            .map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={cn(
                                        "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground",
                                        pathname === link.href
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <link.icon className="h-5 w-5" />
                                    {link.name}
                                </Link>
                            ))}
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                {/* Add search or breadcrumbs here if needed */}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full cursor-pointer">
                        <Avatar className="h-8 w-8 cursor-pointer">
                            <AvatarImage src="" />
                            <AvatarFallback>{getInitials()}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild onClick={() => trackCtaClicked("Dashboard: Profile")}>
                        <Link href="/pages/me" className="cursor-pointer">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild onClick={() => trackCtaClicked("Dashboard: Settings")}>
                        <Link href="/pages/settings" className="cursor-pointer">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                        trackCtaClicked("Dashboard: Logout");
                        logout();
                    }} className="cursor-pointer">Logout</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
