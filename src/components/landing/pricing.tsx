import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
    {
        name: "Starter",
        price: "$49",
        description: "Perfect for small agencies just getting started.",
        features: [
            "1 AI Chatbot",
            "1,000 Messages/mo",
            "Basic Analytics",
            "Email Support",
            "Standard Branding",
        ],
        popular: false,
    },
    {
        name: "Pro",
        price: "$149",
        description: "For growing agencies with higher volume.",
        features: [
            "3 AI Chatbots",
            "10,000 Messages/mo",
            "Advanced Analytics",
            "Priority Support",
            "Remove Branding",
            "Custom Training Data",
        ],
        popular: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Tailored solutions for large organizations.",
        features: [
            "Unlimited Chatbots",
            "Unlimited Messages",
            "Custom Integrations",
            "Dedicated Account Manager",
            "SLA Support",
            "On-premise Deployment",
        ],
        popular: false,
    },
];

export default function Pricing() {
    return (
        <section id="pricing" className="py-16 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                        Pricing
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                        Simple, transparent pricing
                    </h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Choose the plan that fits your needs. No hidden fees. Cancel anytime.
                    </p>
                </div>
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 lg:gap-8">
                    {plans.map((plan) => (
                        <Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    {plan.popular && <Badge>Most Popular</Badge>}
                                </div>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-4xl font-bold mb-6">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                                <ul className="space-y-3 text-sm">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center">
                                            <Check className="mr-2 h-4 w-4 text-primary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                                    {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
