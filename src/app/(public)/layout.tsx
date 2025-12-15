import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import { Suspense } from "react";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <Suspense fallback={<div>Loading...</div>}>
                <main className="flex-1">{children}</main>
            </Suspense>
            <Footer />
        </div>
    );
}
