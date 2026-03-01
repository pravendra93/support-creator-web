"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"
import { useState } from "react"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

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
    email: z.string().email({ message: "Please enter a valid email address." }),
})

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "" },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: values.email }),
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                setError(data.message || "Something went wrong. Please try again.")
            } else {
                setSuccess(true)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
                    <div className="rounded-full bg-green-100 p-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold">Check your email</h2>
                        <p className="text-sm text-muted-foreground">
                            We&apos;ve sent a password reset link to{" "}
                            <span className="font-medium text-foreground">{form.getValues("email")}</span>.
                            Please check your inbox and spam folder.
                        </p>
                    </div>
                    <Link
                        href="/login"
                        className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to login
                    </Link>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>
                    Enter your email address and we&apos;ll send you a link to reset your password.
                </CardDescription>
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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="name@example.com"
                                                className="pl-9"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading} style={{ cursor: "pointer" }}>
                            {isLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Link
                    href="/login"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to login
                </Link>
            </CardFooter>
        </Card>
    )
}
