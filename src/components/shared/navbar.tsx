"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader
} from "@/components/ui/sheet";
import { Menu, X, Layers, Settings, CreditCard, Users, LogIn, Rocket } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const navLinks = [
    { name: "Features", href: "#features", icon: Layers },
    { name: "How It Works", href: "#how-it-works", icon: Settings },
    { name: "Pricing", href: "#pricing", icon: CreditCard },
    { name: "About", href: "#about", icon: Users },
  ];

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            AssistraAI
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          {!isAuthPage && navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              {link.name}
            </Link>
          ))}
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" className="cursor-pointer text-slate-300 hover:text-white hover:bg-white/5">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="cursor-pointer rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-500/30 text-white border-0">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer text-slate-300 hover:bg-white/5">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-slate-950/95 border-l border-white/10 backdrop-blur-xl p-0 flex flex-col w-[300px] sm:w-[350px]">
              <div className="flex flex-col h-full">
                <SheetHeader className="p-6 border-b border-white/5 flex flex-row items-center justify-between space-y-0">
                  <SheetTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    AssistraAI
                  </SheetTitle>
                  <SheetDescription className="sr-only">Navigation links for mobile view</SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 px-4">
                  <div className="flex flex-col space-y-2">
                    {!isAuthPage && navLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={closeMenu}
                        className="flex items-center space-x-4 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                      >
                        <link.icon className="h-5 w-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                        <span className="text-base font-medium">{link.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t border-white/5">
                  <div className="flex flex-col gap-3">
                    <Link href="/login" onClick={closeMenu} className="block w-full">
                      <Button variant="outline" className="w-full justify-center space-x-2 border-white/10 text-slate-300 hover:bg-white/5 hover:text-white py-6 rounded-2xl transition-all duration-300">
                        <LogIn className="h-4 w-4" />
                        <span className="font-semibold">Log in</span>
                      </Button>
                    </Link>
                    <Link href="/register" onClick={closeMenu} className="block w-full">
                      <Button className="w-full justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-purple-500/25 py-6 rounded-2xl transition-all duration-300 transform active:scale-[0.98]">
                        <Rocket className="h-4 w-4" />
                        <span className="font-semibold">Get Started</span>
                      </Button>
                    </Link>
                  </div>
                  <div className="pt-6 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">© 2026 AssistraAI</p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

