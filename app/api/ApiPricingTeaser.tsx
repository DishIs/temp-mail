// app/api/ApiPricingTeaser.tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

// ─── data ────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Developer",
    price: "$7",
    period: "/mo",
    reqMonth: "100k req/mo",
    features: {
      maxInboxes: "25",
      otp: false,
      ws: false,
      att: false,
      cd: false,
      support: "Email",
    },
  },
  {
    name: "Startup",
    price: "$19",
    period: "/mo",
    reqMonth: "500k req/mo",
    popular: true,
    features: {
      maxInboxes: "40",
      otp: false,
      ws: true,
      att: true,
      cd: false,
      support: "Email",
    },
  },
  {
    name: "Growth",
    price: "$49",
    period: "/mo",
    reqMonth: "2M req/mo",
    features: {
      maxInboxes: "100",
      otp: true,
      ws: true,
      att: true,
      cd: true,
      support: "Priority",
    },
  },
];

const FEATURE_ROWS: { label: string; key: keyof (typeof PLANS)[0]["features"] }[] = [
  { label: "Requests / mo", key: "support" }, // overridden below
  { label: "Max inboxes", key: "maxInboxes" },
  { label: "OTP extraction", key: "otp" },
  { label: "WebSocket push", key: "ws" },
  { label: "Attachments",    key: "att" },
  { label: "Custom domains", key: "cd" },
  { label: "Support",        key: "support" },
];

// ─── helpers ─────────────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const Tick  = () => <Check className="h-3.5 w-3.5 text-foreground shrink-0 mx-auto" />;
const Cross = () => (
  <span className="block h-3.5 w-3.5 mx-auto rounded-full border border-border/80" />
);

// ─── Component ───────────────────────────────────────────────────────────────
export function ApiPricingTeaser() {
  return (
    <div>
      {/* section header */}
      <FadeIn>
        <div className="flex items-center gap-2 mb-10">
          <div className="w-0.5 h-4 bg-border" aria-hidden />
          <span className="font-mono text-xs text-foreground font-semibold">
            [ 06 / 07 ]
          </span>
          <span className="text-muted-foreground/50 text-xs">·</span>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Pricing
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2 leading-tight">
              Simple pricing,<br />every stage
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              No credit card required to start. Credits never expire — top up
              once, use forever.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/api/pricing">Full pricing →</Link>
          </Button>
        </div>
      </FadeIn>

      {/* plan grid ── prices */}
      <div className="grid gap-px bg-border md:grid-cols-3 rounded-lg overflow-hidden">
        {PLANS.map((plan, i) => (
          <FadeIn key={plan.name} delay={i * 0.07}>
            <div
              className={`bg-background px-6 py-8 h-full flex flex-col gap-6 ${
                plan.popular ? "ring-1 ring-inset ring-foreground/20" : ""
              }`}
            >
              {/* plan header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    {plan.name}
                  </span>
                  {plan.popular && (
                    <span className="font-mono text-[9px] uppercase tracking-widest border border-foreground/30 text-foreground rounded px-1.5 py-px">
                      popular
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground leading-none">
                    {plan.price}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">/mo</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground mt-2">
                  {plan.reqMonth}
                </p>
              </div>

              {/* feature rows */}
              <ul className="space-y-2.5 flex-1">
                {[
                  { label: "Max inboxes",    val: plan.features.maxInboxes },
                  { label: "OTP extraction", val: plan.features.otp },
                  { label: "WebSocket push", val: plan.features.ws },
                  { label: "Attachments",    val: plan.features.att },
                  { label: "Custom domains", val: plan.features.cd },
                ].map(({ label, val }) => (
                  <li key={label} className="flex items-center gap-2.5">
                    {typeof val === 'string' ? (
                      <span className="h-3.5 w-3.5 flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">{val === 'Unlimited' ? '∞' : val}</span>
                    ) : val ? (
                      <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-border/70 shrink-0" />
                    )}
                    <span
                      className={`text-xs font-mono ${
                        val ? "text-foreground" : "text-muted-foreground/50"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                ))}
                <li className="flex items-center gap-2.5 pt-1 border-t border-border/50 mt-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 w-3.5 text-center">
                    ✉
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {plan.features.support} support
                  </span>
                </li>
              </ul>

              {/* cta */}
              <Button asChild size="sm" variant={plan.popular ? "default" : "outline"} className="w-full">
                <Link href="/auth?callbackUrl=/api/dashboard">
                  {plan.popular ? "Start building" : "Get started"}
                </Link>
              </Button>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* comparison note */}
      <FadeIn delay={0.25}>
        <div className="mt-4 rounded-lg border border-border bg-muted/10 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
          {[
            { v: "Free tier",    l: "5k req/mo, no card" },
            { v: "Credits",      l: "never expire" },
            { v: "WebSocket",    l: "Startup and above" },
            { v: "Custom MX",    l: "Growth and above" },
          ].map(({ v, l }) => (
            <div key={v} className="px-5 py-4 text-center">
              <p className="font-mono text-xs font-semibold text-foreground">{v}</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}