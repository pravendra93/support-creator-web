import { Bot, Zap, Shield, Globe, BarChart, Users } from "lucide-react";

const features = [
    {
        name: "AI-Powered Chatbots",
        description: "Deploy intelligent agents that understand context and resolve queries instantly.",
        icon: Bot,
    },
    {
        name: "Multi-Channel Support",
        description: "Seamlessly integrate with your website, mobile app, and social platforms.",
        icon: Globe,
    },
    {
        name: "Real-time Analytics",
        description: "Track performance, user satisfaction, and agent efficiency in real-time.",
        icon: BarChart,
    },
    {
        name: "Team Collaboration",
        description: "Invite team members, assign roles, and manage support workflows together.",
        icon: Users,
    },
    {
        name: "Brand Customization",
        description: "Fully customize the look and feel to match your brand identity.",
        icon: Zap,
    },
    {
        name: "Enterprise Security",
        description: "Bank-grade encryption and compliance to keep your data safe.",
        icon: Shield,
    },
];

export default function Features() {
    return (
        <section id="features" className="py-16 md:py-24 lg:py-32 bg-slate-50 dark:bg-slate-900/50">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                        Key Features
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                        Everything you need to scale support
                    </h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Our platform provides all the tools necessary to automate customer interactions and improve satisfaction scores.
                    </p>
                </div>
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div
                            key={feature.name}
                            className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-bold">{feature.name}</h3>
                                <p className="mt-2 text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
