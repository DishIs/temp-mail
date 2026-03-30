"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const TEASER_PLANS = [
  {
    name: "Developer",
    price: "$7",
    desc: "For testing & small scripts",
    features: ["100k requests/mo", "Shared pool", "24h retention"],
    href: "/api/pricing",
  },
  {
    name: "Startup",
    price: "$19",
    desc: "Best for automation & production",
    features: ["500k requests/mo", "Dedicated MX", "Real-time WebSocket"],
    href: "/api/pricing",
    popular: true,
  },
  {
    name: "Growth",
    price: "$49",
    desc: "For scaling & high-volume workflows",
    features: ["2M requests/mo", "Custom Domains", "OTP Extraction"],
    href: "/api/pricing",
  },
];

export function ApiPricingTeaser() {
  return (
    <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
                Simple pricing for every stage
            </h2>
            <p className="text-sm text-muted-foreground">
                No credit card required • <Link href="/api/pricing" className="text-primary hover:underline">Start free</Link>
            </p>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TEASER_PLANS.map((plan, i) => (
          <div
            key={plan.name}
            className={`rounded-xl border border-border flex flex-col p-6 relative ${
              plan.popular ? "ring-2 ring-foreground/30" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-6 -mt-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background text-xs font-semibold px-3 py-1">
                  🔥 Most Popular
                </div>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold tracking-tight text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild size="lg" className="w-full mt-8">
              <Link href={plan.href}>
                {plan.popular ? "Get Started" : "Learn More"}
              </Link>
            </Button>
          </div>
        ))}
      </div>
       <div className="text-center mt-12">
        <Button asChild variant="outline">
          <Link href="/api/pricing">→ View full pricing</Link>
        </Button>
      </div>
    </div>
  );
}