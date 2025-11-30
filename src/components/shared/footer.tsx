import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t bg-background">
            <div className="container py-12 md:py-16 lg:py-20">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                SupportAI
                            </span>
                        </Link>
                        <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                            Empowering travel agencies with intelligent, 24/7 customer support automation.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Product</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link href="#" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-foreground">Integrations</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Company</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link href="#" className="text-muted-foreground hover:text-foreground">About</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-foreground">Careers</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Legal</h3>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link href="#" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} SupportAI. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
