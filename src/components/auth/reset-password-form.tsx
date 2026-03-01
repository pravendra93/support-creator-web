"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

const formSchema = z.object({
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don&amp;apos;t match",
    path: ["confirmPassword"],
})

export function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { password: "", confirmPassword: "" },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!token) {
            setError("Invalid or missing reset token. Please request a new reset link.")
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, new_password: values.password }),
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                setError(data.message || "Password reset failed. The link may have expired.")
            } else {
                setSuccess(true)
                // Redirect to login after 3 seconds
                setTimeout(() => router.push("/login"), 3000)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
                    <Alert variant="destructive">
                        <AlertDescription>
                            Invalid or missing reset token. Please request a new{" "}
                            <Link href="/forgot-password" className="underline font-medium">
                                password reset link
                            </Link>
                            .
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    if (success) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
                    <div className="rounded-full bg-green-100 p-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold">Password Reset!</h2>
                        <p className="text-sm text-muted-foreground">
                            Your password has been reset successfully. Redirecting you to login...
                        </p>
                    </div>
                    <Link href="/login" className="text-sm text-primary hover:underline">
                        Go to login now
                    </Link>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>Enter your new password below.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter new password"
                                                className="pr-10"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showPassword
                                                    ? <EyeOff className="h-4 w-4" />
                                                    : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm your password"
                                                className="pr-10"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showConfirmPassword
                                                    ? <EyeOff className="h-4 w-4" />
                                                    : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading} style={{ cursor: "pointer" }}>
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Back to login
                </Link>
            </CardFooter>
        </Card>
    )
}
