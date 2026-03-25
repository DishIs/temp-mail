"use client";
import { useState, useRef } from "react";
import {
  Check, X, Crown, Loader2, EyeOff, Zap, Globe, Link2,
  Paperclip, Clock, Mail, MessageSquareCode,
  Star, MailOpen, Shield, Sparkles,
  Keyboard, Lock, Users, HeartHandshake, Gift, RefreshCw,
  FileText,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ThemeProvider } from "@/components/theme-provider";
import toast from "react-hot-toast";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  SiVisa, SiMastercard, SiAmericanexpress,
  SiPaypal, SiApplepay, SiGooglepay,
} from "react-icons/si";
import { PaddleInit } from "@/components/paddle-init";

type BillingCycle = "monthly" | "yearly";

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

const ASCII_FRAGS = [
  { x: "2%",  y: "5%",  t: "EHLO api2.freecustom.email" },
  { x: "67%", y: "3%",  t: "250 2.1.0 Ok" },
  { x: "78%", y: "11%", t: "From: noreply@service.com" },
  { x: "1%",  y: "21%", t: "RCPT TO:<inbox@ditmail.info>" },
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

const PAYMENT_METHODS = [
  { icon: SiVisa,            label: "Visa"        },
  { icon: SiMastercard,      label: "Mastercard"  },
  { icon: SiAmericanexpress, label: "Amex"        },
  { icon: SiPaypal,          label: "PayPal"      },
  { icon: SiApplepay,        label: "Apple Pay"   },
  { icon: SiGooglepay,       label: "Google Pay"  },
];

function PaddleTrustStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
      <span className="flex items-center gap-1.5 border border-border rounded-md px-3 py-1.5 bg-background text-xs text-muted-foreground font-mono">
        <svg className="h-3.5 w-3.5 shrink-0 text-foreground/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-11h2v2h-2V9zm0 4h2v6h-2v-6z"/>
        </svg>
        Secure checkout via Paddle
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
        <Globe className="h-3 w-3 shrink-0" />
        200+ countries
      </span>
    </div>
  );
}

function DomainCallout() {
  return (
    <div className="w-full max-w-xl mx-auto mt-10 rounded-lg border border-border bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/20">
        <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Fresh domains · Pro
        </span>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-widest border border-border rounded-sm px-1.5 py-px text-muted-foreground">
          Biggest advantage
        </span>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-foreground leading-snug mb-1">
          New domains added regularly — never blocked, never blacklisted.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Most temp mail services reuse the same old domains for years. Sites block them on day one.
          Pro members get access to freshly rotated domains that haven't been seen by spam filters yet —
          so your signups, verifications, and OTPs actually land.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-px bg-border rounded-md overflow-hidden">
          {[
            { label: "Rotation",  value: "Regular"   },
            { label: "Blocked",   value: "Rarely"    },
            { label: "Free plan", value: "Sometimes" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background px-3 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
              <p className="text-xs font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
    <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
    <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
  </>
);

function SectionMarker({ index, total, label }: { index: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-10">
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

const Tick  = () => <Check className="h-3.5 w-3.5 text-foreground shrink-0 mx-auto" />;
const Cross = () => <span className="block h-3.5 w-3.5 mx-auto rounded-full border border-border" />;
const V = ({ v, accent }: { v: string; accent?: boolean }) => (
  <span className={cn("font-mono text-xs font-semibold tabular-nums",
    accent ? "text-foreground" : "text-muted-foreground")}>{v}</span>
);

interface FRow {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  isNew?: boolean;
  highlight?: boolean;
  guest: React.ReactNode | boolean;
  free: React.ReactNode | boolean;
  pro: React.ReactNode | boolean;
}

function FeatureRow({ icon, label, hint, isNew, highlight, guest, free, pro }: FRow) {
  const cell = (v: React.ReactNode | boolean) => {
    if (v === true)  return <Tick />;
    if (v === false) return <Cross />;
    return v;
  };
  return (
    <tr className={cn("border-b border-border/50 last:border-0 transition-colors",
      highlight ? "bg-muted/10 hover:bg-muted/20" : "hover:bg-muted/10")}>
      <td className="py-3 px-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="shrink-0 text-muted-foreground/60">{icon}</span>
          <span className={cn("text-sm leading-snug",
            highlight ? "font-semibold text-foreground" : "font-medium text-foreground/90")}>
            {label}
          </span>
          {isNew && (
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-sm px-1.5 py-px">
              NEW
            </span>
          )}
        </div>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug pl-5">{hint}</p>}
      </td>
      <td className="py-3 px-4 text-center hidden sm:table-cell">{cell(guest)}</td>
      <td className="py-3 px-4 text-center">{cell(free)}</td>
      <td className="py-3 px-4 text-center">{cell(pro)}</td>
    </tr>
  );
}

function SectionRow({ label }: { label: string }) {
  return (
    <tr className="bg-muted/20 border-b border-border">
      <td colSpan={4} className="px-4 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </td>
    </tr>
  );
}

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [busy, setBusy] = useState(false);
  const t = useTranslations("Pricing");
  const locale = useLocale();

  const isPro  = session?.user?.plan === "pro";
  const isFree = session?.user?.plan === "free";
  const isMonthly = cycle === "monthly";
  const isYearly  = cycle === "yearly";

  const upgrade = async (plan: "free" | "pro") => {
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
        settings: { displayMode: "overlay", theme: "light", locale,
          successUrl: `${window.location.origin}/payment/success?provider=paddle` },
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

  const prices = { monthly: { price: "$3.99", sub: "/ month" }, yearly: { price: "$29.99", sub: "/ year" } };
  const { price, sub } = prices[cycle];
  const ctaLabel = busy ? "Processing…" : isMonthly ? "Start 3-day free trial" : "Get Pro for $2.50/mo";
  const T = isPro ? 3 : 4;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="bg-background text-foreground overflow-x-hidden">
        <AppHeader />

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative min-h-[72vh] flex flex-col items-center justify-center px-6 py-28 text-center border-b border-border" style={DOT_BG}>
          <AsciiLayer />
          <Cols />

          <div className="relative z-10 max-w-3xl w-full">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <SectionMarker index={1} total={T} label="Simple Pricing" />
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight text-foreground leading-[1.1] mb-5"
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
              Never lose an important<br />email again
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}>
              Permanent inbox. New domains regularly. Custom domains. Auto OTP. One plan for everything.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}>
              <DomainCallout />
            </motion.div>

            <motion.div className="flex flex-wrap items-center justify-center gap-4 mt-10 mb-10 text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}>
              <div className="flex -space-x-2">
                {(["bg-blue-400","bg-emerald-400","bg-violet-400","bg-amber-400","bg-rose-400"] as const).map((color, i) => (
                  <div key={i} className={cn("h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold text-white", color)}>
                    {["J","A","M","S","K"][i]}
                  </div>
                ))}
              </div>
              <span><span className="font-semibold text-foreground">50,000+</span> users trust FreeCustom.Email every month</span>
              <span className="hidden sm:flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-foreground text-foreground opacity-70" />)}
                <span className="ml-1 font-mono text-xs">4.9 / 5</span>
              </span>
            </motion.div>

            {/* Billing toggle */}
            <motion.div className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}>

              <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1 gap-1">
                {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
                  <button key={c} onClick={() => setCycle(c)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
                      cycle === c ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>
                    {c === "monthly" ? "Monthly" : "Yearly"}
                    <span className={cn(
                      "font-mono text-[9px] uppercase tracking-widest border rounded-sm px-1.5 py-px transition-colors",
                      cycle === c ? "border-border text-muted-foreground" : "border-border/50 text-muted-foreground/50"
                    )}>
                      {c === "monthly" ? "Popular" : "−37%"}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 border border-border rounded-lg px-5 py-3 bg-background min-w-[280px] justify-center">
                {isMonthly
                  ? <><Gift className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        Full Pro access for <span className="font-semibold text-foreground">3 days free</span> — no charge until day 4
                      </span></>
                  : <><Star className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        <span className="font-mono font-semibold text-foreground">$2.50/mo</span>
                        <span className="mx-1.5 text-border">·</span>
                        <span className="line-through opacity-40 font-mono">$3.99</span>
                        <span className="mx-1.5 text-border">·</span>
                        <span className="font-mono text-[9px] uppercase tracking-widest border border-border rounded-sm px-1.5 py-px">37% off</span>
                      </span></>
                }
              </div>

              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {!isPro && (
                  <Button size="lg" onClick={() => upgrade("pro")} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                    {ctaLabel}
                  </Button>
                )}
                <Button size="lg" variant="outline" onClick={() => upgrade("free")}>
                  {isFree ? "Go to Dashboard" : "Start free"}
                </Button>
              </div>

              {!isPro && (
                <p className="text-xs text-muted-foreground">
                  {isMonthly
                    ? "No card charged today · Renews monthly at $3.99 · Cancel anytime from Profile → Billing"
                    : "Billed as $29.99/year · Renews annually · Cancel anytime from Profile → Billing"}
                </p>
              )}

              {!isPro && <PaddleTrustStrip />}
            </motion.div>
          </div>
        </section>

        {/* ── PLAN COMPARISON ───────────────────────────────────────── */}
        <section className="relative border-b border-border px-6 py-24" style={DOT_BG}>
          <AsciiLayer />
          <Cols />
          <div className="relative z-10 max-w-5xl mx-auto">
            <FadeIn>
              <SectionMarker index={2} total={T} label="Plan comparison" />
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 leading-tight">
                Every feature, side by side
              </h2>
              <p className="text-sm text-muted-foreground mb-14 max-w-lg leading-relaxed">
                Guest is no-account access. Free is with a free account. Pro unlocks everything.
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Feature</th>
                      <th className="py-4 px-4 hidden sm:table-cell border-l border-border">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono text-xs font-semibold text-foreground">Guest</span>
                          <span className="font-mono text-[10px] text-muted-foreground">$0 · No account</span>
                          <Button size="sm" variant="outline" className="mt-1.5 h-6 px-2 text-[10px] font-mono" onClick={() => router.push("/")}>Try free</Button>
                        </div>
                      </th>
                      <th className="py-4 px-4 border-l border-border">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono text-xs font-semibold text-foreground">Free</span>
                          <span className="font-mono text-[10px] text-muted-foreground">$0 · With account</span>
                          <Button size="sm" variant="outline" className="mt-1.5 h-6 px-2 text-[10px] font-mono" onClick={() => upgrade("free")}>{isFree ? "Current" : "Sign up"}</Button>
                        </div>
                      </th>
                      <th className="py-4 px-4 border-l border-border bg-muted/10">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <Crown className="h-3 w-3 text-foreground" />
                            <span className="font-mono text-xs font-semibold text-foreground">Pro</span>
                          </div>
                          {isMonthly
                            ? <><span className="font-mono text-[10px] font-semibold text-foreground">3 days free</span><span className="font-mono text-[10px] text-muted-foreground">then {price}{sub}</span></>
                            : <><span className="font-mono text-[10px] font-semibold text-foreground">$2.50/mo</span><span className="font-mono text-[9px] uppercase tracking-widest border border-border rounded-sm px-1.5 py-px text-muted-foreground">Save 37%</span></>
                          }
                          <Button size="sm" className="mt-1.5 h-6 px-2 text-[10px] font-mono" onClick={() => upgrade("pro")} disabled={busy || isPro}>
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : isPro ? "Current ✓" : isMonthly ? "Try free →" : "$2.50/mo →"}
                          </Button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <SectionRow label="Retention" />
                    <FeatureRow icon={<RefreshCw className="h-3.5 w-3.5" />} label="Fresh domains added regularly" hint="New, unblocked domains rotated in for Pro — free plan gets leftovers, guests get nothing" highlight isNew
                      guest={<V v="Never" />} free={<V v="Sometimes" />} pro={<V v="Regularly" accent />} />
                    <FeatureRow icon={<Clock className="h-3.5 w-3.5" />} label="Email retention" hint="How long emails stay on our server" highlight
                      guest={<V v="10 hrs" />} free={<V v="24 hrs" />} pro={<V v="Forever" accent />} />
                    <FeatureRow icon={<MailOpen className="h-3.5 w-3.5" />} label="Inbox capacity" hint="Max emails stored per address"
                      guest={<V v="10" />} free={<V v="50" />} pro={<V v="∞" accent />} />
                    <FeatureRow icon={<Star className="h-3.5 w-3.5" />} label="Saved inboxes" hint="Addresses remembered across sessions"
                      guest={false} free={<V v="1" />} pro={<V v="∞" accent />} />
                    <FeatureRow icon={<Lock className="h-3.5 w-3.5" />} label="Private inboxes" hint="All emails private — no public lookups" highlight
                      guest={false} free={false} pro={true} />

                    <SectionRow label="Privacy & Extras" />
                    <FeatureRow icon={<EyeOff className="h-3.5 w-3.5" />} label="Ad-free" highlight guest={false} free={false} pro={true} />
                    <FeatureRow icon={<Shield className="h-3.5 w-3.5" />} label="5 GB email storage" hint="Persistent email + attachment archive" highlight guest={false} free={false} pro={true} />
                    <FeatureRow icon={<Paperclip className="h-3.5 w-3.5" />} label="Attachment downloads" guest={false} free={<V v="Limited" />} pro={true} />

                    <SectionRow label="Identity" />
                    <FeatureRow icon={<Mail className="h-3.5 w-3.5" />} label="Custom email prefix" hint="e.g. yourname@ditmail.info" guest={false} free={true} pro={true} />
                    <FeatureRow icon={<Globe className="h-3.5 w-3.5" />} label="Custom domain" hint="Receive mail at your own domain" guest={false} free={false} pro={true} />

                    <SectionRow label="Smart Features" />
                    <FeatureRow icon={<Zap className="h-3.5 w-3.5" />} label="Auto OTP extraction" hint="Login codes shown instantly in inbox list" isNew
                      guest={false} free={<span className="font-mono text-[10px] text-muted-foreground">Pro only</span>} pro={true} />
                    <FeatureRow icon={<Link2 className="h-3.5 w-3.5" />} label="Verification link detection" hint="One-click verify button extracted from email" isNew
                      guest={false} free={<span className="font-mono text-[10px] text-muted-foreground">Pro only</span>} pro={true} />
                    <FeatureRow
                      icon={<FileText className="h-3.5 w-3.5" />}
                      label="Inbox notes"
                      hint="Annotate each saved address — free users get 20 chars (local only), Pro gets 500 chars synced to cloud"
                      isNew
                      guest={false}
                      free={<span className="font-mono text-[10px] text-muted-foreground">20 chars · local</span>}
                      pro={<span className="font-mono text-[10px] text-foreground font-semibold">500 chars · cloud</span>}
                    />
                    <FeatureRow icon={<MessageSquareCode className="h-3.5 w-3.5" />} label="Real-time delivery" hint="WebSocket push — no reloading" guest={true} free={true} pro={true} />
                    <FeatureRow icon={<Sparkles className="h-3.5 w-3.5" />} label="Inbox layouts" hint="Classic, split, compact, zen, mobile & more"
                      guest={<V v="1" />} free={<V v="3" />} pro={<V v="All" accent />} />
                    <FeatureRow icon={<Keyboard className="h-3.5 w-3.5" />} label="Keyboard shortcuts" hint="Press C for copy, R for refresh & more"
                      guest={false} free={<span className="font-mono text-[10px] text-muted-foreground">Basics</span>} pro={<span className="font-mono text-[10px] text-muted-foreground">All</span>} />

                    {/* CTA row */}
                    <tr className="border-t border-border bg-muted/10">
                      <td className="py-5 px-4 text-xs text-muted-foreground">
                        <p className="mb-1">Want to switch monthly → yearly?{" "}
                          <Link href="/contact" className="underline underline-offset-4 decoration-border hover:text-foreground transition-colors">Contact us</Link>
                        </p>
                        <p>Building with our API?{" "}
                          <Link href="/api/pricing" className="underline underline-offset-4 decoration-border hover:text-foreground transition-colors">See API pricing →</Link>
                        </p>
                      </td>
                      <td className="py-5 px-4 hidden sm:table-cell border-l border-border text-center">
                        <Button size="sm" variant="outline" className="text-[10px] font-mono" onClick={() => router.push("/")}>Try free</Button>
                      </td>
                      <td className="py-5 px-4 border-l border-border text-center">
                        <Button size="sm" variant="outline" className="text-[10px] font-mono" onClick={() => upgrade("free")}>{isFree ? "Current" : "Sign up"}</Button>
                      </td>
                      <td className="py-5 px-4 border-l border-border text-center">
                        <Button size="sm" className="text-[10px] font-mono" onClick={() => upgrade("pro")} disabled={busy || isPro}>
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : isPro ? "Current ✓" : isMonthly ? "Try free →" : "$2.50/mo →"}
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground font-mono sm:hidden">
                * Guest plan available without an account.{" "}
                <button onClick={() => router.push("/")} className="underline underline-offset-2">Try it →</button>
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ── PRO CTA ───────────────────────────────────────────────── */}
        {!isPro && (
          <section className="relative border-b border-border px-6 py-24" style={DOT_BG}>
            <Cols />
            <div className="relative z-10 max-w-5xl mx-auto">
              <FadeIn>
                <SectionMarker index={3} total={T} label="Upgrade" />
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 leading-tight">
                  {isMonthly ? "Try Pro free for 3 days" : "Go Pro for $2.50 a month"}
                </h2>
                <p className="text-sm text-muted-foreground mb-14 max-w-lg leading-relaxed">
                  Most users upgrade when they receive an important verification email.
                  {" "}<span className="font-mono">→ If it expires, it cannot be recovered.</span>
                </p>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid gap-px bg-border md:grid-cols-3">

                    {/* Price cell */}
                    <div className="bg-background px-8 py-10 md:col-span-2">
                      <div className="flex items-center gap-2 mb-6">
                        <Crown className="h-5 w-5 text-foreground" />
                        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Pro Plan</span>
                        {/* Recurring billing badge */}
                        <span className="ml-auto font-mono text-[9px] uppercase tracking-widest border border-border rounded-sm px-1.5 py-px text-muted-foreground">
                          {isMonthly ? "Recurring monthly" : "Recurring yearly"}
                        </span>
                      </div>
                      {isMonthly ? (
                        <>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-6xl font-bold font-mono text-foreground leading-none">3</span>
                            <div>
                              <p className="text-base text-muted-foreground font-medium leading-snug">days free</p>
                              <p className="font-mono text-xs text-muted-foreground">then {price}{sub}, billed monthly</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-4">
                            No charge now. Cancel before day 4 and pay nothing. After the trial, your card is charged $3.99 every month until you cancel.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-6xl font-bold font-mono text-foreground leading-none">$2.50</span>
                            <div>
                              <p className="text-base text-muted-foreground font-medium leading-snug">/ month</p>
                              <p className="font-mono text-xs text-muted-foreground">billed as $29.99/year, renews annually</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-4">
                            Save 37% vs monthly. Your card is charged $29.99 once per year until you cancel. Same full Pro access.{" "}
                            <span className="font-mono text-[9px] uppercase tracking-widest border border-border rounded-sm px-1.5 py-px">37% off</span>
                          </p>
                        </>
                      )}

                      <div className="mt-8 grid sm:grid-cols-2 gap-3">
                        {[
                          { text: "Fresh domains added regularly",          key: true  },
                          { text: "New domains rarely blocked or blacklisted", key: true },
                          { text: "Emails kept forever + 5 GB storage",     key: false },
                          { text: "Auto OTP extraction",                     key: false },
                          { text: "Verification link detection",             key: false },
                          { text: "Inbox notes — 500 chars, synced to cloud", key: false },
                          { text: "Custom domains",                          key: false },
                          { text: "Private inboxes",                         key: false },
                          { text: "Completely ad-free",                      key: false },
                        ].map(({ text, key }, i) => (
                          <div key={text} className={cn(
                            "flex items-center gap-2 text-sm",
                            key ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />
                            {text}
                            {i === 0 && <span className="font-mono text-[9px] uppercase tracking-widest border border-border rounded-sm px-1.5 py-px text-muted-foreground ml-auto">Key feature</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA cell */}
                    <div className="bg-background px-8 py-10 flex flex-col justify-between gap-6 border-l border-border">
                      <div className="space-y-3">
                        <Button size="lg" className="w-full" onClick={() => upgrade("pro")} disabled={busy}>
                          {busy ? "Processing…" : ctaLabel}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          {isMonthly
                            ? <>No card charged today · renews monthly at $3.99</>
                            : <>Billed as $29.99/year · renews annually</>
                          }
                        </p>
                        {/* Cancellation instructions */}
                        <p className="text-[11px] text-muted-foreground text-center leading-relaxed border-t border-border pt-2">
                          Cancel anytime from{" "}
                          <span className="font-semibold text-foreground/80">Profile → Billing → Manage Subscription</span>
                          {" "}— you'll be taken to Paddle's customer portal where cancellation is one click.
                        </p>
                        <div className="pt-1 border-t border-border space-y-2">
                          <p className="text-[10px] text-muted-foreground font-mono text-center">Secure payment via Paddle · 200+ countries</p>
                          <div className="flex flex-wrap justify-center gap-1">
                            {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
                              <span key={label} title={label}
                                className="flex items-center justify-center rounded border border-border bg-muted/20 px-1.5 py-1 text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                                <Icon className="h-3 w-auto" />
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border pt-6 space-y-3">
                        {[
                          { icon: <Check className="h-3.5 w-3.5" />, label: "Cancel in one click — no hoops" },
                          { icon: <Users className="h-3.5 w-3.5" />, label: "50,000+ users / month" },
                        ].map(({ icon, label }) => (
                          <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                            {icon}{label}
                          </div>
                        ))}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <HeartHandshake className="h-3.5 w-3.5 shrink-0" />
                          Any doubts?{" "}
                          <Link href="/contact" className="underline underline-offset-4 decoration-border hover:text-foreground transition-colors">Talk to us</Link>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </FadeIn>
            </div>
          </section>
        )}

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <section className="relative px-6 py-24">
          <Cols />
          <div className="relative z-10 max-w-2xl mx-auto">
            <FadeIn>
              <SectionMarker index={isPro ? 3 : 4} total={T} label="FAQ" />
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-12">
                Frequently asked questions
              </h2>
            </FadeIn>
            <div className="space-y-0">
              {[
                { id: "trial",     q: "How does the 3-day free trial work?",          a: "Select the Monthly plan and start your trial — no charge until day 4. Full Pro access during the trial. Cancel any time before day 4 and you won't be billed a single cent." },
                { id: "recurring", q: "Is Pro a recurring subscription?",             a: "Yes. The monthly plan charges $3.99 automatically every month after your 3-day trial ends. The yearly plan charges $29.99 once per year. You're always in control — cancel anytime from Profile → Billing → Manage Subscription and your plan won't renew." },
                { id: "cancel",    q: "How do I cancel my subscription?",             a: "Go to Profile → Billing and click 'Manage Subscription'. This takes you directly to Paddle's customer portal, where cancellation is a single button click — no forms, no emails, no waiting. Cancel before your next renewal date and you won't be charged again. You keep Pro access until the end of your current billing period." },
                { id: "domains",   q: "Why do Pro domains actually work where others get blocked?", a: "Most temp mail providers have used the same domains for years — they're in every spam database and blocklist on the internet. We regularly rotate in new domains for Pro members that have zero history with spam filters. Fresh domains aren't on blocklists yet, so signups and verification emails land every time. Free plan users share older domains that sites may already know and reject." },
                { id: "retention", q: "What happens to my emails if I don't upgrade?",a: "Free plan emails are automatically deleted after 24 hours. Pro keeps all your emails and attachments forever (up to 5 GB)." },
                { id: "otp",       q: "How does auto OTP extraction work?",            a: "Our SMTP plugin scans the subject and body the moment an email arrives. It uses layered regex patterns to detect 4–8 digit codes. The code appears instantly in your inbox list without opening the email. Pro only." },
                { id: "verify",    q: "What is verification link detection?",          a: "When an email contains a Verify, Confirm, Activate, or Magic Link button, our server extracts the URL from the HTML. You'll see a Verify chip in your inbox list. Pro only." },
                { id: "notes",     q: "What are inbox notes?",                        a: "Inbox notes let you annotate each saved email address so you remember what it was used for. Free and authenticated users can add a short note (up to 20 characters) saved locally in their browser. Pro users get 500 characters per note, synced to the cloud so notes follow you across all devices." },
                { id: "domain",    q: t("faq_domain_title"),                          a: t("faq_domain_desc") },
                { id: "storage",   q: t("faq_storage_title"),                         a: t("faq_storage_desc") },
                { id: "billing",   q: "Can I switch from monthly to yearly?",          a: "Yes. Contact us with your account email and we'll apply remaining credit to the yearly plan. No double charging." },
              ].map((item, i) => (
                <FadeIn key={item.id} delay={i * 0.04}>
                  <details className="group border-t border-border py-5 last:border-b">
                    <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                      <span className="leading-relaxed">{item.q}</span>
                      <span className="shrink-0 text-muted-foreground mt-0.5 group-open:rotate-45 transition-transform duration-200 text-lg leading-none">+</span>
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed pr-8">{item.a}</p>
                  </details>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

      </div>
      <PaddleInit />
    </ThemeProvider>
  );
}