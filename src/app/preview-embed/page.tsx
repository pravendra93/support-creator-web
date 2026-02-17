"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function PreviewEmbedPage() {
    const searchParams = useSearchParams();
    const tenantIdInput = searchParams.get("tenant_id");
    const [tenantId, setTenantId] = useState<string | null>(null);

    useEffect(() => {
        if (tenantIdInput) {
            setTenantId(tenantIdInput);
        }
    }, [tenantIdInput]);

    if (!tenantId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full bg-slate-100/50 flex flex-col items-center justify-center font-sans">
            <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
                <h1 className="text-xl font-semibold text-slate-900 mb-2">Live Preview</h1>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Interact with the chat widget in the bottom-right corner to test your AI assistant.
                    This preview simulates how your customers will see the widget on your website.
                </p>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    Preview Mode
                </div>
            </div>

            {/* Widget Script Injection */}
            <script
                src="/widget.js"
                data-tenant-id={tenantId}
                async
            ></script>
        </div>
    );
}
