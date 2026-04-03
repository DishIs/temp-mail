"use client";
import { useState, useRef } from "react";
import {
  Check, X, Crown, Loader2, EyeOff, Zap, Globe, Link2,
  Paperclip, Clock, Mail, MessageSquareCode,
  Star, MailOpen, Shield, Sparkles,
  Keyboard, Lock, Users, HeartHandshake, Gift, RefreshCw,
  FileText, ShieldCheck, AlertTriangle,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ThemeProvider } from "@/components/theme-provider";
import { toast } from "@/components/ui/toast";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import {
  SiVisa, SiMastercard, SiAmericanexpress,
  SiPaypal, SiApplepay, SiGooglepay,
} from "react-icons/si";
import { PaddleInit } from "@/components/paddle-init";

type BillingCycle = "monthly" | "yearly";

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.09) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

const PAYMENT_METHODS = [
  { icon: SiVisa,            label: "Visa"        },
  { icon: SiMastercard,      label: "Mastercard"  },
  { icon: SiAmericanexpress, label: "Amex"        },
  { icon: SiPaypal,          label: "PayPal"      },
  { icon: SiApplepay,        label: "Apple Pay"   },
  { icon: SiGooglepay,       label: "Google Pay"  },
];

const ASCII_FRAGS = [
  { x: "2%",  y: "5%",  t: "EHLO api2.freecustom.email" },
  { x: "67%", y: "3%",  t: "250 2.1.0 Ok" },
  { x: "78%", y: "11%", t: "From: noreply@service.com" },
  { x: "1%",  y: "21%", t: "RCPT TO:<inbox@ditapi.info>" },
  { x: "71%", y: "27%", t: "Message-ID: <abc123@fce.email>" },
  { x: "4%",  y: "37%", t: "Content-Type: text/plain; charset=utf-8" },
  { x: "1%",  y: "51%", t: "X-OTP: 847291" },
  { x: "69%", y: "57%", t: "SMTP 220 mail.freecustom.email" },
  { x: "3%",  y: "67%", t: "Date: Thu, 4 Mar 2026 09:55:00 +0000" },
  { x: "72%", y: "73%", t: "250-STARTTLS" },
  { x: "2%",  y: "83%", t: "AUTH PLAIN" },
  { x: "67%", y: "87%", t: "MAIL FROM:<service@example.com>" },
  { x: "4%",  y: "93%", t: "Subject: Your verification code is 847291" },
];

function AsciiLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {ASCII_FRAGS.map((f, i) => (
        <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap"
          style={{ left: f.x, top: f.y, opacity: 0.038 }}>{f.t}</span>
      ))}
    </div>
  );
}

const Cols = () => (
  <>
    <div className="fixed inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />
    <div className="fixed inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />
  </>
);

function SectionMarker({ index, total, label }: { index: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <div className="w-0.5 h-4 bg-border" aria-hidden />
      <span className="font-mono text-xs text-foreground font-semibold">
        [ {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")} ]
      </span>
      <span className="text-muted-foreground/50 text-xs">·</span>
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

const Tick  = () => <Check className="h-4 w-4 text-foreground mx-auto shrink-0" />;
const Cross = () => <span className="h-4 w-4 rounded-full border border-border block mx-auto" />;

// ─── Plan definitions ──────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "guest",
    label: "Guest",
    desc: "No account needed",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    yearlyTotal: null,
    isPopular: false,
    planId: null as string | null,
    features: {
      freshDomains: "Never",
      retention: "10 hrs",
      inboxCapacity: "10",
      savedInboxes: false,
      privateInboxes: false,
      adFree: false,
      storage: false,
      attachments: false,
      customPrefix: false,
      customDomain: false,
      autoOtp: false,
      verifyLink: false,
      inboxNotes: false,
      realtimeDelivery: true,
      layouts: "1",
      keyboard: false,
    },
  },
  {
    name: "free",
    label: "Free",
    desc: "With account",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    yearlyTotal: null,
    isPopular: false,
    planId: null as string | null,
    features: {
      freshDomains: "Sometimes",
      retention: "24 hrs",
      inboxCapacity: "50",
      savedInboxes: "1",
      privateInboxes: false,
      adFree: false,
      storage: false,
      attachments: "Limited",
      customPrefix: true,
      customDomain: false,
      autoOtp: false,
      verifyLink: false,
      inboxNotes: "20 chars · local",
      realtimeDelivery: true,
      layouts: "3",
      keyboard: "Basics",
    },
  },
  {
    name: "pro",
    label: "Pro",
    desc: "Everything unlocked",
    monthlyPrice: "$3.99",
    yearlyPrice: "$2.50",
    yearlyTotal: "$29.99",
    isPopular: true,
    planId: "pro",
    features: {
      freshDomains: "Regularly",
      retention: "Forever",
      inboxCapacity: "∞",
      savedInboxes: "∞",
      privateInboxes: true,
      adFree: true,
      storage: "5 GB",
      attachments: true,
      customPrefix: true,
      customDomain: true,
      autoOtp: true,
      verifyLink: true,
      inboxNotes: "500 chars · cloud",
      realtimeDelivery: true,
      layouts: "All",
      keyboard: "All",
    },
  },
] as const;

// ─── Feature groups for comparison ────────────────────────────────────────────
const FEATURE_GROUPS = [
  {
    group: "Retention",
    rows: [
      { key: "freshDomains",    label: "Fresh domains",        hint: "New unblocked domains for Pro" },
      { key: "retention",       label: "Email retention",      hint: "How long emails stay stored" },
      { key: "inboxCapacity",   label: "Inbox capacity",       hint: "Max emails per address" },
      { key: "savedInboxes",    label: "Saved inboxes",        hint: "Addresses across sessions" },
      { key: "privateInboxes",  label: "Private inboxes",      hint: "No public lookups" },
    ],
  },
  {
    group: "Privacy & Storage",
    rows: [
      { key: "adFree",    label: "Ad-free" },
      { key: "storage",   label: "5 GB storage",      hint: "Persistent email archive" },
      { key: "attachments", label: "Attachments" },
    ],
  },
  {
    group: "Identity",
    rows: [
      { key: "customPrefix",  label: "Custom prefix",  hint: "e.g. yourname@domain.com" },
      { key: "customDomain",  label: "Custom domain",  hint: "Receive at your own domain" },
    ],
  },
  {
    group: "Smart Features",
    rows: [
      { key: "autoOtp",        label: "Auto OTP extraction",     hint: "Login codes shown instantly" },
      { key: "verifyLink",     label: "Verify link detection",   hint: "One-click verify button" },
      { key: "inboxNotes",     label: "Inbox notes",             hint: "Annotate saved addresses" },
      { key: "realtimeDelivery", label: "Real-time delivery",    hint: "WebSocket push, no reload" },
      { key: "layouts",        label: "Inbox layouts" },
      { key: "keyboard",       label: "Keyboard shortcuts" },
    ],
  },
] as const;

// ─── Render a feature cell value ──────────────────────────────────────────────
function FeatureCell({ value }: { value: unknown }) {
  if (value === true)  return <Tick />;
  if (value === false) return <Cross />;
  if (typeof value === "string") {
    const accent = ["Regularly", "Forever", "∞", "All", "5 GB"].includes(value);
    return (
      <span className={cn(
        "text-xs font-medium tabular-nums",
        accent ? "text-foreground font-semibold" : "text-muted-foreground"
      )}>{value}</span>
    );
  }
  return null;
}

export default function PricingClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [busy, setBusy] = useState(false);
  const t = useTranslations("Pricing");
  const locale = useLocale();

  const isPro     = session?.user?.plan === "pro";
  const isFree    = session?.user?.plan === "free";
  const isMonthly = cycle === "monthly";
  const isYearly  = cycle === "yearly";

  const upgrade = async (plan: "guest" | "free" | "pro") => {
    if (plan === "guest") { router.push("/"); return; }
    if (plan === "free") {
      router.push(session ? "/dashboard" : "/auth?callbackUrl=/dashboard");
      return;
    }
    if (!session) {
      toast.error(t("toasts.login_req"));
      router.push("/auth?callbackUrl=/pricing");
      return;
    }
    if (isPro) { toast.success("You're already Pro!"); router.push("/dashboard"); return; }

    setBusy(true);
    const tid = toast.loading("Opening checkout…");
    try {
      const res = await fetch("/api/paddle/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle }),
      });
      const d = await res.json();
      if (d.error) { toast.error(d.error, { id: tid }); setBusy(false); return; }
      if (!window.Paddle) { toast.error("Paddle.js not loaded.", { id: tid }); setBusy(false); return; }
      toast.dismiss(tid);
      window.Paddle.Checkout.open({
        settings: {
          displayMode: "overlay", theme: "light", locale,
          successUrl: `${window.location.origin}/payment/success?provider=paddle`,
        },
        items: [{ priceId: d.priceId, quantity: 1 }],
        customer: session.user?.email ? { email: session.user.email } : undefined,
        customData: { userId: session.user.id },
        onEvent: (event: any) => {
          if (event.name === "checkout.completed") {
            const txnId: string | undefined = event.data?.transaction_id;
            window.location.href = `/payment/success?provider=paddle${txnId ? `&_ptxn=${txnId}` : ""}`;
          }
        },
      });
    } catch { toast.error("Connection error. Please try again.", { id: tid }); }
    setBusy(false);
  };

  // ─── CTA per plan ────────────────────────────────────────────────────────────
  function PlanCta({ plan }: { plan: typeof PLANS[number] }) {
    if (plan.name === "guest") {
      return (
        <Button size="sm" variant="outline" className="w-full" onClick={() => router.push("/")}>
          Try free
        </Button>
      );
    }
    if (plan.name === "free") {
      return (
        <Button size="sm" variant="outline" className="w-full" onClick={() => upgrade("free")}>
          {isFree ? "Current plan" : "Sign up free"}
        </Button>
      );
    }
    // pro
    if (isPro) {
      return (
        <Button size="sm" variant="outline" className="w-full cursor-default" disabled>
          Current plan
        </Button>
      );
    }
    return (
      <Button size="sm" className="w-full" disabled={busy} onClick={() => upgrade("pro")}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isMonthly ? "Start 3-day free trial" : "Get Pro"}
      </Button>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="bg-background text-foreground overflow-x-hidden" style={DOT_BG}>
        <Cols />
        <AppHeader />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16">

          {/* ── [ 01 ] Header ─────────────────────────────────────────────── */}
          <AsciiLayer />
          <div className="mb-12 text-center sm:text-left">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <SectionMarker index={1} total={3} label="Simple Pricing" />
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3 leading-[1.1]"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>
              Never lose an important<br className="hidden sm:block" /> email again
            </motion.h1>

            <motion.p
              className="text-sm text-muted-foreground mb-8 max-w-md"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}>
              Permanent inbox. Fresh domains. Custom domains. Auto OTP.<br />One plan for everything.
            </motion.p>

            {/* Billing toggle */}
            <motion.div
              className="inline-flex items-center rounded-lg border border-border bg-muted/20 p-1 gap-1"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}>
              <button
                onClick={() => setCycle("monthly")}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  isMonthly ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                )}>
                Monthly
                <span className={cn(
                  "font-mono text-[9px] uppercase tracking-widest rounded px-1.5 py-px transition-colors border",
                  isMonthly ? "bg-muted/40 text-muted-foreground border-border" : "border-border/40 text-muted-foreground/50"
                )}>Popular</span>
              </button>
              <button
                onClick={() => setCycle("yearly")}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  isYearly ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                )}>
                Yearly
                <span className={cn(
                  "font-mono text-[9px] uppercase tracking-widest rounded px-1.5 py-px transition-colors border",
                  isYearly
                    ? "bg-emerald-600/15 text-emerald-600 border-emerald-600/25"
                    : "bg-muted/40 text-muted-foreground border-border"
                )}>2 months free</span>
              </button>
            </motion.div>
          </div>

          {/* ── Plan cards (desktop: 3-col grid, mobile: stacked) ─────────── */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden mb-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}>
            {PLANS.map((plan) => {
              const isCurrent = isPro && plan.name === "pro" || isFree && plan.name === "free";
              const showPopular = plan.isPopular && !isCurrent;
              const price = isYearly && plan.yearlyPrice !== "$0" ? plan.yearlyPrice : plan.monthlyPrice;
              const sub   = isYearly && plan.yearlyTotal ? (
                <p className="font-mono text-[9px] text-emerald-600/90 mb-3">{plan.yearlyTotal}/year · 2 months free</p>
              ) : plan.monthlyPrice !== "$0" ? (
                <p className="font-mono text-[9px] text-muted-foreground/50 mb-3">billed monthly</p>
              ) : (
                <div className="mb-[1.125rem]" />
              );

              return (
                <div
                  key={plan.name}
                  className={cn(
                    "relative bg-background px-5 py-6",
                    plan.isPopular && "ring-2 ring-inset ring-foreground/25",
                    isCurrent && "bg-muted/20"
                  )}>
                  {/* badges */}
                  {showPopular && (
                    <span className="absolute top-0 right-0 font-mono text-[8px] uppercase tracking-widest bg-foreground text-background px-2 py-1 rounded-bl-lg">
                      🔥 Popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute top-0 right-0 font-mono text-[8px] uppercase tracking-widest bg-muted/60 text-foreground px-2 py-1 rounded-bl-lg">
                      Current
                    </span>
                  )}

                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{plan.label}</p>
                  <p className="text-[11px] text-muted-foreground/70 mb-3">{plan.desc}</p>

                  <div className="flex items-baseline gap-0.5 mb-0.5">
                    <span className="text-2xl font-bold text-foreground">{price}</span>
                    {plan.monthlyPrice !== "$0" && (
                      <span className="text-xs text-muted-foreground">/mo</span>
                    )}
                  </div>
                  {sub}

                  {plan.name === "pro" && isMonthly && !isPro && (
                    <div className="flex items-center gap-1.5 border border-border rounded-md px-2.5 py-2 bg-muted/20 mb-3">
                      <Gift className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">3 days free</span> · no charge until day 4
                      </span>
                    </div>
                  )}

                  <PlanCta plan={plan} />
                </div>
              );
            })}
          </motion.div>

          {/* ── Trust strip ───────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 py-4 border-b border-border mb-4">
            <span className="flex items-center gap-1.5 border border-border rounded-md px-3 py-1.5 bg-background text-xs text-muted-foreground font-mono whitespace-nowrap">
              <ShieldCheck className="h-3.5 w-3.5 text-foreground/70 shrink-0" />Secure checkout via Paddle
            </span>
            <div className="flex items-center gap-1">
              {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
                <span key={label} title={label}
                  className="flex items-center justify-center rounded border border-border bg-muted/20 px-2 py-1.5 text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                  <Icon className="h-3.5 w-auto" />
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground border border-border rounded-md px-2.5 py-1.5 bg-background">
              <Globe className="h-3 w-3 shrink-0" />200+ countries
            </span>
          </div>

          {/* ── [ 02 ] Plan comparison ────────────────────────────────────── */}
          <div className="mt-16">
            <SectionMarker index={2} total={3} label="Plan comparison" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Every feature, side by side</h2>
            <p className="text-sm text-muted-foreground mb-8">Guest is no-account access. Free is with an account. Pro unlocks everything.</p>

            {/* ── DESKTOP table (md+) ── */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-border">
              {/* Sticky header */}
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
                <div className="grid grid-cols-[200px_repeat(3,1fr)] gap-px bg-border">
                  <div className="bg-background px-4 py-5 flex items-end">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Plan</span>
                  </div>
                  {PLANS.map((plan) => {
                    const isCurrent = isPro && plan.name === "pro" || isFree && plan.name === "free";
                    const price = isYearly && plan.yearlyPrice !== "$0" ? plan.yearlyPrice : plan.monthlyPrice;
                    return (
                      <div key={plan.name}
                        className={cn(
                          "bg-background px-4 py-5 relative",
                          plan.isPopular && "ring-2 ring-inset ring-foreground/20",
                          isCurrent && "bg-muted/20"
                        )}>
                        {plan.isPopular && !isCurrent && (
                          <span className="absolute top-0 right-0 font-mono text-[8px] uppercase tracking-widest bg-foreground text-background px-2 py-1 rounded-bl-lg">
                            🔥 Popular
                          </span>
                        )}
                        {isCurrent && (
                          <span className="absolute top-0 right-0 font-mono text-[8px] uppercase tracking-widest bg-muted/60 text-foreground px-2 py-1 rounded-bl-lg">
                            Current
                          </span>
                        )}
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{plan.label}</p>
                        <div className="flex items-baseline gap-0.5 mb-0.5">
                          <span className="text-xl font-bold text-foreground">{price}</span>
                          {plan.monthlyPrice !== "$0" && <span className="text-xs text-muted-foreground">/mo</span>}
                        </div>
                        {isYearly && plan.yearlyTotal ? (
                          <p className="font-mono text-[9px] text-emerald-600/90 mb-3">{plan.yearlyTotal}/yr · 2 mo free</p>
                        ) : (
                          <div className="mb-[1.125rem]" />
                        )}
                        <PlanCta plan={plan} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feature rows */}
              <div className="border-t-0">
                {FEATURE_GROUPS.map((group) => (
                  <div key={group.group}>
                    <div className="grid grid-cols-[200px_repeat(3,1fr)] bg-muted/30">
                      <div className="px-4 py-2.5 col-span-4">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{group.group}</span>
                      </div>
                    </div>
                    {group.rows.map((row) => (
                      <div key={row.key} className="grid grid-cols-[200px_repeat(3,1fr)] gap-px bg-border hover:bg-border/80 transition-colors">
                        <div className="bg-background px-4 py-3 flex flex-col justify-center">
                          <span className="text-xs font-medium text-foreground leading-tight">{row.label}</span>
                          {"hint" in row && row.hint && (
                            <span className="font-mono text-[9px] text-muted-foreground/60 mt-0.5 leading-tight">{row.hint}</span>
                          )}
                        </div>
                        {PLANS.map((plan) => (
                          <div key={plan.name}
                            className={cn(
                              "bg-background px-4 py-3 flex items-center justify-center",
                              plan.isPopular && "ring-inset ring-1 ring-foreground/10",
                              isPro && plan.name === "pro" && "bg-muted/20"
                            )}>
                            <FeatureCell value={plan.features[row.key as keyof typeof plan.features]} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* ── MOBILE: stacked plan cards ── */}
            <div className="md:hidden space-y-4">
              {PLANS.map((plan, pi) => {
                const isCurrent = isPro && plan.name === "pro" || isFree && plan.name === "free";
                const price = isYearly && plan.yearlyPrice !== "$0" ? plan.yearlyPrice : plan.monthlyPrice;

                return (
                  <FadeIn key={plan.name} delay={pi * 0.06}>
                    <div className={cn(
                      "rounded-lg border overflow-hidden",
                      plan.isPopular ? "border-foreground/30 ring-2 ring-foreground/20" : "border-border"
                    )}>
                      {/* Card header */}
                      <div className={cn(
                        "px-5 py-5 relative",
                        plan.isPopular ? "bg-muted/10" : "bg-background"
                      )}>
                        {plan.isPopular && !isCurrent && (
                          <span className="absolute top-0 right-0 font-mono text-[8px] uppercase tracking-widest bg-foreground text-background px-2 py-1 rounded-bl-lg">
                            🔥 Popular
                          </span>
                        )}
                        {isCurrent && (
                          <span className="absolute top-0 right-0 font-mono text-[8px] uppercase tracking-widest bg-muted/60 text-foreground px-2 py-1 rounded-bl-lg">
                            Current
                          </span>
                        )}

                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{plan.label}</p>
                            <p className="text-[11px] text-muted-foreground/70 mb-2">{plan.desc}</p>
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-3xl font-bold text-foreground">{price}</span>
                              {plan.monthlyPrice !== "$0" && <span className="text-sm text-muted-foreground">/mo</span>}
                            </div>
                            {isYearly && plan.yearlyTotal && (
                              <p className="font-mono text-[9px] text-emerald-600/90 mt-0.5">{plan.yearlyTotal}/year · 2 months free</p>
                            )}
                          </div>
                          <div className="shrink-0 pt-4">
                            <PlanCta plan={plan} />
                          </div>
                        </div>

                        {plan.name === "pro" && isMonthly && !isPro && (
                          <div className="flex items-center gap-1.5 border border-border rounded-md px-2.5 py-2 bg-background mt-3">
                            <Gift className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[11px] text-muted-foreground">
                              <span className="font-semibold text-foreground">3 days free</span> · no charge until day 4
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Feature list — only show notable ones on mobile */}
                      <div className="border-t border-border divide-y divide-border/60">
                        {FEATURE_GROUPS.map((group) => (
                          group.rows.map((row) => {
                            const val = plan.features[row.key as keyof typeof plan.features];
                            return (
                              <div key={row.key} className="flex items-center justify-between px-5 py-2.5">
                                <span className="text-xs text-muted-foreground">{row.label}</span>
                                <span className="text-right">
                                  <FeatureCell value={val} />
                                </span>
                              </div>
                            );
                          })
                        ))}
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>

          {/* ── Money-back guarantee ──────────────────────────────────────── */}
          <div className="mt-6 flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-background w-fit">
            <ShieldCheck className="h-5 w-5 text-foreground/70 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground leading-snug">14-day money-back guarantee</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Not satisfied? Full refund within 14 days.{" "}
                <Link href="/policies/refund" className="underline underline-offset-4 decoration-border hover:text-foreground transition-colors">Refund policy →</Link>
              </p>
            </div>
          </div>

          {/* Social proof strip */}
          <div className="mt-6 flex flex-wrap items-center gap-4 pt-6 border-t border-border text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {(["bg-blue-400","bg-emerald-400","bg-violet-400","bg-amber-400","bg-rose-400"] as const).map((color, i) => (
                <div key={i} className={cn("h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold text-white", color)}>
                  {["J","A","M","S","K"][i]}
                </div>
              ))}
            </div>
            <span><span className="font-semibold text-foreground">50,000+</span> users trust FreeCustom.Email every month</span>
            <span className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-foreground text-foreground opacity-70" />)}
              <span className="ml-1 font-mono text-xs">4.9 / 5</span>
            </span>
          </div>

          {/* ── [ 03 ] FAQ ────────────────────────────────────────────────── */}
          <div className="mt-16">
            <SectionMarker index={3} total={3} label="FAQ" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-8">Frequently asked questions</h2>
            <div className="max-w-2xl space-y-0">
              {[
                { id: "trial",     q: "How does the 3-day free trial work?",          a: "Select Monthly and start — no charge until day 4. Full Pro access during the trial. Cancel any time before day 4 and you won't be billed a cent." },
                { id: "recurring", q: "Is Pro a recurring subscription?",             a: "Yes. Monthly charges $3.99 automatically every month after the trial. Yearly charges $29.99 once per year. Cancel anytime from Profile → Billing → Manage Subscription." },
                { id: "cancel",    q: "How do I cancel?",                             a: "Go to Profile → Billing → Manage Subscription. One click in Paddle's portal — no forms, no waiting. You keep Pro until the end of the current billing period." },
                { id: "domains",   q: "Why do Pro domains work where others get blocked?", a: "Most temp mail providers reuse the same domains for years — they're on every blocklist. We rotate in fresh domains for Pro with zero spam history, so your signups and OTPs actually land." },
                { id: "retention", q: "What happens to my emails if I don't upgrade?", a: "Free plan emails are auto-deleted after 24 hours. Pro keeps everything forever (up to 5 GB)." },
                { id: "otp",       q: "How does auto OTP extraction work?",            a: "Our SMTP plugin scans the subject and body the moment an email arrives, using layered regex to detect 4–8 digit codes. The code appears instantly in your inbox list — no need to open the email. Pro only." },
                { id: "verify",    q: "What is verification link detection?",          a: "When an email contains a Verify, Confirm, Activate, or Magic Link button, we extract the URL and show a Verify chip in your inbox list. Pro only." },
                { id: "notes",     q: "What are inbox notes?",                        a: "Annotate each saved address to remember what it's for. Free users get 20 chars saved locally; Pro gets 500 chars synced to the cloud across all devices." },
                { id: "domain",    q: t("faq_domain_title"),                          a: t("faq_domain_desc") },
                { id: "storage",   q: t("faq_storage_title"),                         a: t("faq_storage_desc") },
                { id: "billing",   q: "Can I switch from monthly to yearly?",          a: "Yes. Contact us with your account email and we'll apply remaining credit to the yearly plan. No double charging." },
                { id: "api",       q: "Building with the API?",                        a: "The API plan is a separate subscription with its own rate limits, WebSocket support, OTP extraction, custom domains, and more. Credits never expire and stack on any plan." },
              ].map(({ id, q, a }, i) => (
                <details key={id} className="group border-t border-border py-4 last:border-b">
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                    <span className="leading-relaxed">{q}</span>
                    <span className="shrink-0 text-muted-foreground mt-0.5 group-open:rotate-45 transition-transform duration-200 text-lg leading-none">+</span>
                  </summary>
                  <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed pr-8">{a}</p>
                </details>
              ))}
            </div>

            {/* API upsell callout */}
            <div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-muted/10 px-4 py-3 max-w-2xl">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="text-foreground font-semibold">Building with the API?</span>{" "}
                The Pro plan is for the web app. For programmatic access — OTP extraction, WebSocket, custom domains, high-volume inboxes —{" "}
                <Link href="/api/pricing" className="underline underline-offset-4 decoration-border hover:text-foreground transition-colors">see API pricing →</Link>
              </p>
            </div>
          </div>

        </div>
      </div>
      <PaddleInit />
    </ThemeProvider>
  );
}