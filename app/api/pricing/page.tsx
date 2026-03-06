// app/api/pricing/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import toast from "react-hot-toast";

const PLANS = [
  { name: "Free",       price: "$0",   sub: "/mo", reqSec: "1",   reqMonth: "5,000",     otp: false, attachments: false, maxAttachment: "—", ws: false, maxWs: "—", customDomains: false, persistence: "Anonymous (10h)", recommended: false, planId: null as string | null },
  { name: "Developer",  price: "$7",   sub: "/mo", reqSec: "10",  reqMonth: "100,000",   otp: true,  attachments: false, maxAttachment: "—", ws: false, maxWs: "—", customDomains: false, persistence: "Free (24h)",      recommended: true,  planId: "developer" },
  { name: "Startup",    price: "$19",  sub: "/mo", reqSec: "25",  reqMonth: "500,000",   otp: true,  attachments: true,  maxAttachment: "5 MB",  ws: true,  maxWs: "5",   customDomains: false, persistence: "Free (24h)",      recommended: false, planId: "startup" },
  { name: "Growth",     price: "$49",  sub: "/mo", reqSec: "50",  reqMonth: "2,000,000", otp: true,  attachments: true,  maxAttachment: "25 MB", ws: true,  maxWs: "20",  customDomains: true,  persistence: "Pro (forever)",   recommended: false, planId: "growth" },
  { name: "Enterprise", price: "$149", sub: "/mo", reqSec: "100", reqMonth: "10,000,000",otp: true,  attachments: true,  maxAttachment: "50 MB", ws: true,  maxWs: "100", customDomains: true,  persistence: "Pro (forever)",   recommended: false, planId: "enterprise" },
];

const CREDITS = [
  { amount: "$10",  requests: "200,000", perK: "$0.05",  package: "starter" as const },
  { amount: "$25",  requests: "600,000", perK: "$0.042", package: "builder" as const },
  { amount: "$50",  requests: "1.5M",    perK: "$0.033", package: "scale"   as const },
  { amount: "$100", requests: "4M",      perK: "$0.025", package: "pro"     as const },
];

const FAQ_ITEMS = [
  { q: "Can we use pro features by just buying credits with no plans (free)?", a: "No. Features (OTP extraction, attachments, WebSocket, custom domains) are determined by your API plan only. Credits only add request capacity; they don't change your plan or unlock paid features." },
  { q: "What's the difference between credits and API plans?", a: "Your API plan sets which features you get and your base rate limits. Credits only add extra request capacity on top of your monthly quota; they never expire and are consumed when you exceed your plan limit." },
  { q: "Do credits expire?", a: "No. Credits never expire. Top up once and use them whenever you need." },
  { q: "What happens when I hit my monthly limit?", a: "If you have credits, they are consumed automatically. If you have no credits, you'll receive HTTP 429 until the next reset or until you add credits." },
  { q: "Can I use my own domain?", a: "Yes, on Growth and Enterprise. Add and verify your domain in the dashboard; then register inboxes like user@yourdomain.com via the API." },
  { q: "Is there a free trial?", a: "The Free plan is always available. Paid API plans do not include a separate trial period; you can upgrade or add credits at any time." },
  { q: "How does WebSocket billing work?", a: "Each push event counts as one request toward your monthly quota. Connection limits apply per plan." },
  { q: "Can I switch plans mid-cycle?", a: "Yes. Upgrades take effect immediately; you're charged a prorated amount. Downgrades take effect at the end of the current billing period." },
  { q: "What is the difference between API plan and Pro plan?", a: "The Pro plan is for the main FreeCustom.Email web app. The API plan is for programmatic access. They are separate subscriptions; you can have one or both." },
];

const Tick  = () => <Check className="h-4 w-4 text-foreground shrink-0 mx-auto" />;
const Cross = () => <span className="h-4 w-4 rounded-full border border-border block mx-auto" />;

const DOT_BG = { backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.09) 1px, transparent 0)", backgroundSize: "28px 28px" } as const;

const ASCII_FRAGS = [
  { x: "2%", y: "8%",  t: "EHLO api2.freecustom.email" },
  { x: "70%", y: "6%", t: "250 2.1.0 Ok" },
  { x: "1%", y: "55%", t: "X-OTP: 847291" },
  { x: "71%", y: "52%", t: "RCPT TO:<inbox@ditmail.info>" },
];

export default function ApiPricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [busyCredits, setBusyCredits] = useState<string | null>(null);

  const isLoggedIn = status === "authenticated" && !!session?.user;

  const openCheckout = async (payload: { productType: "api" | "credits"; apiPlan?: string; creditsToAdd?: number; package?: string; }) => {
    if (!session?.user?.id) {
      toast.error("Please sign in first.");
      router.push("/auth?callbackUrl=/api/pricing");
      return;
    }
    const body: Record<string, unknown> = payload.productType === "api" ? { type: "api", plan: payload.apiPlan } : { type: "credits", package: payload.package };
    const tid = toast.loading("Opening checkout…");
    try {
      const res = await fetch("/api/paddle/create-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (d.error) { toast.error(d.error, { id: tid }); return; }
      const Paddle = typeof window !== "undefined" ? (window as any).Paddle : null;
      if (!Paddle) { toast.error("Checkout not ready. Please refresh.", { id: tid }); return; }
      toast.dismiss(tid);
      const customData: Record<string, unknown> = { userId: session.user.id, productType: d.productType ?? payload.productType };
      if (d.apiPlan) customData.apiPlan = d.apiPlan;
      if (d.creditsToAdd != null) customData.creditsToAdd = d.creditsToAdd;
      Paddle.Checkout.open({
        settings: { displayMode: "overlay", theme: "light", successUrl: `${window.location.origin}/api/dashboard?checkout=success` },
        items: [{ priceId: d.priceId, quantity: 1 }],
        customer: session.user?.email ? { email: session.user.email as string } : undefined,
        customData,
        onEvent: (event: any) => { if (event.name === "checkout.completed") router.push("/api/dashboard?checkout=success"); },
      });
    } catch { toast.error("Something went wrong.", { id: tid }); }
    finally { setBusyPlan(null); setBusyCredits(null); }
  };

  const handlePlanClick = (plan: typeof PLANS[0]) => {
    if (plan.name === "Free") {
      if (isLoggedIn) router.push("/api/dashboard"); else router.push("/auth?callbackUrl=/api/dashboard");
      return;
    }
    if (!plan.planId) return;
    setBusyPlan(plan.planId);
    openCheckout({ productType: "api", apiPlan: plan.planId });
  };

  const handleCreditsClick = (pkg: typeof CREDITS[0]) => {
    setBusyCredits(pkg.package);
    openCheckout({ productType: "credits", package: pkg.package });
  };

  return (
    <div className="bg-background text-foreground overflow-x-hidden" style={DOT_BG}>
      {/* ASCII bg */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
        {ASCII_FRAGS.map((f, i) => <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap" style={{ left: f.x, top: f.y, opacity: 0.035 }}>{f.t}</span>)}
      </div>

      {/* Decorative border columns */}
      <div className="fixed inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />
      <div className="fixed inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-0.5 h-4 bg-border" aria-hidden />
            <span className="font-mono text-xs text-foreground font-semibold">[ 01 / 03 ]</span>
            <span className="text-muted-foreground/50 text-xs">·</span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">API Pricing</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3">Simple, predictable pricing</h1>
          <p className="text-sm text-muted-foreground">Pay per plan or top up with credits. Credits never expire.</p>
        </div>

        {/* Plans */}
        <div className="grid gap-px bg-border rounded-lg overflow-hidden grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-16">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`bg-background flex flex-col p-6 relative ${plan.recommended ? "ring-1 ring-inset ring-border" : ""}`}>
              {plan.recommended && (
                <span className="absolute top-0 right-0 text-[10px] font-semibold font-mono uppercase tracking-widest text-muted-foreground bg-muted/40 px-2 py-1 rounded-bl-lg">
                  Recommended
                </span>
              )}
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">{plan.name}</p>
              <div className="flex items-baseline gap-0.5 mb-6">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.sub}</span>
              </div>

              <div className="space-y-3 text-sm flex-1">
                {[
                  { label: "Req/sec",       value: plan.reqSec },
                  { label: "Req/month",     value: plan.reqMonth },
                  { label: "OTP",           value: plan.otp ? <Tick /> : <Cross /> },
                  { label: "Attachments",   value: plan.attachments ? <span className="text-xs">{plan.maxAttachment}</span> : <Cross /> },
                  { label: "WebSocket",     value: plan.ws ? <span className="text-xs">{plan.maxWs} conn</span> : <Cross /> },
                  { label: "Custom domain", value: plan.customDomains ? <Tick /> : <Cross /> },
                  { label: "Persistence",   value: <span className="text-xs text-right leading-tight">{plan.persistence}</span> },
                ].map(row => (
                  <div key={row.label} className="border-t border-border pt-3 flex items-center justify-between gap-2 first:border-t-0 first:pt-0">
                    <span className="text-muted-foreground text-xs">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                {plan.name === "Free" ? (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={isLoggedIn ? "/api/dashboard" : "/auth?callbackUrl=/api/dashboard"}>Get started</Link>
                  </Button>
                ) : (
                  <Button size="sm" className="w-full" disabled={!!busyPlan} onClick={() => handlePlanClick(plan)}>
                    {busyPlan === plan.planId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get started"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Credits */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-0.5 h-4 bg-border" aria-hidden />
            <span className="font-mono text-xs text-foreground font-semibold">[ 02 / 03 ]</span>
            <span className="text-muted-foreground/50 text-xs">·</span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Credits — never expire</span>
          </div>
          <div className="grid gap-px bg-border rounded-lg overflow-hidden grid-cols-2 sm:grid-cols-4">
            {CREDITS.map(c => (
              <div key={c.package} className="bg-background px-5 py-6 flex flex-col gap-3">
                <div>
                  <p className="text-2xl font-bold text-foreground">{c.amount}</p>
                  <p className="text-sm text-muted-foreground mt-1">{c.requests} requests</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.perK} / 1k</p>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-auto" disabled={!!busyCredits} onClick={() => handleCreditsClick(c)}>
                  {busyCredits === c.package ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy credits"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-0.5 h-4 bg-border" aria-hidden />
            <span className="font-mono text-xs text-foreground font-semibold">[ 03 / 03 ]</span>
            <span className="text-muted-foreground/50 text-xs">·</span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">FAQ</span>
          </div>
          <div className="space-y-0 max-w-2xl">
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <details key={i} className="group border-t border-border py-5 last:border-b">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  <span className="leading-relaxed">{q}</span>
                  <span className="shrink-0 text-muted-foreground mt-0.5 group-open:rotate-45 transition-transform duration-200 text-lg leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed pr-8">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}