"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle, User, Lock } from "lucide-react";

export default function SetupAccountPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [alreadySetup, setAlreadySetup] = useState(false);
    const [validatingToken, setValidatingToken] = useState(true);

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing invitation token");
            setValidatingToken(false);
            return;
        }

        // Validate token on page load
        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            setValidatingToken(true);
            const response = await fetch("/api/validate-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 400 && data.message?.includes("already been used")) {
                    setAlreadySetup(true);
                } else if (response.status === 400) {
                    setError(data.message || "Invalid or expired invitation token");
                }
            }
            // If validation succeeds, just continue to show the form
        } catch (err: any) {
            setError("Failed to validate invitation token");
        } finally {
            setValidatingToken(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch("/api/setup-tenant-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Check if account is already set up
                if (response.status === 400 && data.message?.includes("already been used")) {
                    setAlreadySetup(true);
                    return;
                }
                throw new Error(data.message || "Failed to set up account");
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/login?setup=success");
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Invalid Invitation
                        </h1>
                        <p className="text-gray-600">
                            This invitation link is invalid or has expired.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Account Setup Complete!
                        </h1>
                        <p className="text-gray-600 mb-4">
                            Your account has been successfully set up.
                        </p>
                        <p className="text-sm text-gray-500">
                            Redirecting to login...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (alreadySetup) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Account Already Set Up
                        </h1>
                        <p className="text-gray-600 mb-6">
                            You've already completed your account setup. Please log in to continue.
                        </p>
                        <a
                            href="/login"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Go to Login
                        </a>
                        <p className="text-sm text-gray-500 mt-4">
                            If you forgot your password, you can reset it on the login page.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (validatingToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Validating Invitation
                        </h1>
                        <p className="text-gray-600">
                            Please wait while we verify your invitation link...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Complete Your Account Setup
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        You've been invited to join a tenant organization. Please set up your
                        account below.
                    </p>
                </div>

                <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                                First Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, first_name: e.target.value })
                                    }
                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="John"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, last_name: e.target.value })
                                    }
                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, confirmPassword: e.target.value })
                                    }
                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Setting up...
                                </>
                            ) : (
                                "Complete Setup"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
