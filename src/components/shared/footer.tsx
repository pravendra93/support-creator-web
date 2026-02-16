import Link from "next/link";

export default function Footer() {
    return (
        <footer className="relative border-t border-white/5 bg-slate-950">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            <div className="container py-12 md:py-16 lg:py-20">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                AssistraAI
                            </span>
                        </Link>
                        <p className="mt-4 text-sm text-slate-400 max-w-xs leading-relaxed">
                            Empowering businesses with intelligent, 24/7 AI-powered customer support. Train on your data, deploy in minutes.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Product</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link href="#features" className="text-slate-400 hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How It Works</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Company</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">About</Link></li>
                            <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Blog</Link></li>
                            <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Careers</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Legal</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</Link></li>
                            <li><Link href="#" className="text-slate-400 hover:text-white transition-colors">Terms</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-white/5 pt-8 text-center text-sm text-slate-500">
                    © {new Date().getFullYear()} AssistraAI. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
