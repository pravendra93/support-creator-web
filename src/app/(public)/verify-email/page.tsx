"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const verified = searchParams.get("verified") === "true"
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(verified)

    useEffect(() => {
        // If already verified via backend redirect, show success and redirect
        if (verified) {
            const timer = setTimeout(() => {
                router.push("/login?verified=true")
            }, 3000) // Redirect after 3 seconds
            return () => clearTimeout(timer)
        }

        // If token is present, verify it via API
        if (token && !verified) {
            verifyToken(token)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, verified])

    const verifyToken = async (tokenValue: string) => {
        setIsVerifying(true)
        setError(null)

        try {
            const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(tokenValue)}`, {
                method: "GET",
            })

            if (response.ok) {
                setSuccess(true)
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push("/login?verified=true")
                }, 3000)
            } else {
                const data = await response.json()
                setError(data.message || "Verification failed. The token may be invalid or expired.")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong during verification")
        } finally {
            setIsVerifying(false)
        }
    }

    return (
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Email Verification</CardTitle>
                    <CardDescription>
                        {success ? "Your email has been verified successfully!" : "Verifying your email address..."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {success && (
                        <Alert className="bg-green-50 text-green-900 border-green-200">
                            <AlertDescription>
                                Your email has been verified successfully! You will be redirected to the login page shortly.
                            </AlertDescription>
                        </Alert>
                    )}
                    {isVerifying && !success && (
                        <Alert>
                            <AlertDescription>Please wait while we verify your email...</AlertDescription>
                        </Alert>
                    )}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {success && (
                        <div className="flex justify-center">
                            <Button asChild>
                                <Link href="/login?verified=true">Go to Login</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

