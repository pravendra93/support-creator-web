import React, { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";

import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://assistra.app"),
  title: "AssistraAI - AI Customer Support Platform | RAG-Powered Chatbots",
  description: "Deploy intelligent AI chatbots trained on your business data in minutes. RAG-powered support agents that understand context, customize branding, and delight your customers 24/7.",
  keywords: "AI chatbot, customer support, RAG, retrieval augmented generation, business AI, chatbot platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
          <GoogleAnalytics />
        </AuthProvider>
      </body>
    </html>
  );
}
