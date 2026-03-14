"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface User {
    id: string; // was account_id
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    tenant_id?: string;
    is_active?: boolean;
    is_subscribed?: boolean;
    plan_name?: string;
    plan_slug?: string;
    created_at?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];

function isPublicPath(path: string) {
    return PUBLIC_PATHS.includes(path) || path.startsWith("/reset-password");
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const pathname = usePathname();
    const checkingRef = useRef(false); // Guard against concurrent checkAuth calls

    const logout = useCallback(async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("Logout API call failed:", error);
        }
        // ALWAYS clear user and hard-redirect to login
        // Using window.location.href instead of router.push because:
        // - Forces a full page reload so middleware re-evaluates the cleared cookie
        // - router.push (soft navigation) can race with cookie clearing
        setUser(null);
        window.location.href = "/login";
    }, []);

    const checkAuth = useCallback(async () => {
        // Prevent concurrent calls
        if (checkingRef.current) return;
        checkingRef.current = true;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000); // 15s client-side timeout

        try {
            const response = await fetch("/api/auth/me", { signal: controller.signal });

            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else {
                // 401 (expired token), 500 (backend error), or any other failure
                console.error("Auth check failed with status:", response.status);
                setUser(null);

                if (!isPublicPath(window.location.pathname)) {
                    await logout();
                    return;
                }
            }
        } catch (error: any) {
            console.error("Failed to check auth:", error?.name === "AbortError" ? "Request timed out" : error);
            setUser(null);

            if (!isPublicPath(window.location.pathname)) {
                await logout();
                return;
            }
        } finally {
            clearTimeout(timeout);
            setIsLoading(false);
            checkingRef.current = false;
        }
    }, [logout]);

    useEffect(() => {
        if (isPublicPath(pathname)) {
            setIsLoading(false);
            return;
        }
        // Only check auth if we don't have a user yet
        if (!user?.id) {
            checkAuth();
        }
        // NOTE: intentionally NOT including `user` in deps to avoid re-trigger loops
        // when setUser(null) is called inside checkAuth
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, checkAuth]);

    return (
        <AuthContext.Provider value={{ user, isLoading, checkAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
