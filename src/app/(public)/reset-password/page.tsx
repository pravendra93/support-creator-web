import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata = {
    title: "Reset Password",
    description: "Set your new account password",
}

export default function ResetPasswordPage() {
    return (
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
            {/* Suspense required because ResetPasswordForm uses useSearchParams() */}
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    )
}
