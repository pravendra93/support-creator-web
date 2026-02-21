"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2 } from "lucide-react";

function PreviewEmbedContent() {
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
            <div className="flex h-screen w-full items-center justify-center bg-[#1e293b] text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full bg-[#1e293b] flex flex-col items-center justify-center font-sans overflow-hidden">
            {/* Background Decorative Elements - Aurora Effect */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-25%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-500/10 blur-[100px] animate-aurora-1"></div>
                <div className="absolute bottom-[-25%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-500/10 blur-[100px] animate-aurora-2"></div>
                <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-blue-500/5 blur-[80px] animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            </div>

            <div className="z-10 text-center px-6">
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-slate-200 mb-4 tracking-tight drop-shadow-lg">Simulator Hub</h1>
                <p className="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed">
                    Test your widget against this <span className="text-indigo-300 font-semibold shadow-indigo-500/50">immersive backdrop</span> to ensure perfect visibility.
                </p>
                <div className="mt-8 flex items-center justify-center gap-3">
                    <span className="px-4 py-1.5 rounded-full text-[11px] font-bold text-indigo-300 border border-indigo-500/30 uppercase tracking-[0.2em] bg-indigo-500/10 backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        Sandbox Active
                    </span>
                </div>
            </div>

            {/* Widget Script Injection */}
            <script
                src="/widget.js"
                data-tenant-id={tenantId}
                async
            ></script>

            <style jsx global>{`
                body {
                    background: #0f172a;
                    margin: 0;
                    padding: 0;
                }
                @keyframes aurora-1 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                    50% { transform: translate(20px, -20px) scale(1.1); opacity: 0.6; }
                }
                @keyframes aurora-2 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                    50% { transform: translate(-20px, 20px) scale(1.1); opacity: 0.6; }
                }
                .animate-aurora-1 { animation: aurora-1 10s ease-in-out infinite alternate; }
                .animate-aurora-2 { animation: aurora-2 12s ease-in-out infinite alternate; }
                .animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </div>
    );
}

export default function PreviewEmbedPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-[#1e293b] text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <PreviewEmbedContent />
        </Suspense>
    );
}
