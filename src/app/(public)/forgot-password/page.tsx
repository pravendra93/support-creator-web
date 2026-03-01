import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata = {
    title: "Forgot Password",
    description: "Reset your account password",
}

export default function ForgotPasswordPage() {
    return (
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
            <ForgotPasswordForm />
        </div>
    )
}
