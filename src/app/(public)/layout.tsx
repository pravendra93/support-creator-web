import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import { Suspense } from "react";
import Script from "next/script";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <Script
                src="https://assistra-widget-stage.sgp1.cdn.digitaloceanspaces.com/widget/loader.js"
                data-api-key="sk_live_0CB_E4vbs9mpCRsfA19lBctmuy8Aj2hD"
                strategy="afterInteractive"
            />
            <Navbar />
            <Suspense fallback={<div>Loading...</div>}>
                <main className="flex-1">{children}</main>
            </Suspense>
            <Footer />
        </div>
    );
}
