// app/api/pricing/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Globe, ShieldCheck, AlertTriangle, Info, RefreshCw, ExternalLink, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import {
  SiVisa, SiMastercard, SiAmericanexpress,
  SiPaypal, SiApplepay, SiGooglepay,
} from "react-icons/si";

// ─── Plan order + types ───────────────────────────────────────────────────────
const PLAN_ORDER = ["free", "developer", "startup", "growth", "enterprise"] as const;
type ApiPlanName = typeof PLAN_ORDER[number];

const PLANS = [
  { name: "free"      , label: "Free",       price: "$0",   sub: "/mo", reqSec: "1",   reqMonth: "5,000",      otp: false, attachments: false, maxAttachment: "—",     ws: false, maxWs: "—",    customDomains: false, persistence: "Anonymous (10h)", freshDomains: false, planId: null as string | null },
  { name: "developer" , label: "Developer",  price: "$7",   sub: "/mo", reqSec: "10",  reqMonth: "100,000",    otp: false, attachments: false, maxAttachment: "—",     ws: false, maxWs: "—",    customDomains: false, persistence: "Free (24h)",      freshDomains: false, planId: "developer" },
  { name: "startup"   , label: "Startup",    price: "$19",  sub: "/mo", reqSec: "25",  reqMonth: "500,000",    otp: false, attachments: true,  maxAttachment: "5 MB",  ws: true,  maxWs: "5",    customDomains: false, persistence: "Free (24h)",      freshDomains: false, planId: "startup" },
  { name: "growth"    , label: "Growth",     price: "$49",  sub: "/mo", reqSec: "50",  reqMonth: "2,000,000",  otp: true,  attachments: true,  maxAttachment: "25 MB", ws: true,  maxWs: "20",   customDomains: true,  persistence: "Pro (forever)",   freshDomains: true,  planId: "growth" },
  { name: "enterprise", label: "Enterprise", price: "$149", sub: "/mo", reqSec: "100", reqMonth: "10,000,000", otp: true,  attachments: true,  maxAttachment: "50 MB", ws: true,  maxWs: "100",  customDomains: true,  persistence: "Pro (forever)",   freshDomains: true,  planId: "enterprise" },
] as const;

const CREDITS = [
  { amount: "$10",  requests: "200,000", perK: "$0.05",  package: "starter" as const },
  { amount: "$25",  requests: "600,000", perK: "$0.042", package: "builder" as const },
  { amount: "$50",  requests: "1.5M",    perK: "$0.033", package: "scale"   as const },
  { amount: "$100", requests: "4M",      perK: "$0.025", package: "pro"     as const },
];

const DOWNGRADE_REASONS = [
  { value: "too_expensive",   label: "Too expensive" },
  { value: "not_using",       label: "Not using all features" },
  { value: "switching",       label: "Switching to another service" },
  { value: "personal_use",    label: "Personal / hobby use only" },
  { value: "lower_volume",    label: "My request volume is lower than expected" },
  { value: "other",           label: "Other" },
];

const FAQ_ITEMS = [
  {
    q: "Can we use pro features by just buying credits with no plans (free)?",
    a: "No. Features (OTP extraction, attachments, WebSocket, custom domains) are determined by your API plan only. Credits only add request capacity; they don't change your plan or unlock paid features.",
  },
  {
    q: "What's the difference between credits and API plans?",
    a: "Your API plan sets which features you get and your base rate limits. Credits only add extra request capacity on top of your monthly quota; they never expire and are consumed when you exceed your plan limit.",
  },
  {
    q: "Do credits expire?",
    a: "No. Credits never expire. Top up once and use them whenever you need.",
  },
  {
    q: "What happens when I hit my monthly limit?",
    a: "If you have credits, they are consumed automatically. If you have no credits, you'll receive HTTP 429 until the next reset or until you add credits.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes, on Growth and Enterprise. Add and verify your domain in the dashboard; then register inboxes like user@yourdomain.com via the API.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan is always available. Paid API plans do not include a separate trial period; you can upgrade or add credits at any time.",
  },
  {
    q: "How does WebSocket billing work?",
    a: "Each push event counts as one request toward your monthly quota. Connection limits apply per plan.",
  },
  {
    q: "Can I switch plans mid-cycle?",
    a: "Yes. Upgrades take effect immediately; you're charged a prorated amount. Downgrades take effect at the end of the current billing period.",
  },
  {
    q: "What is the difference between API plan and Pro plan?",
    a: "The Pro plan is for the main FreeCustom.Email web app — it unlocks client-side features like the ad-free interface, OTP extraction UI, verification link chips, inbox layouts, and keyboard shortcuts. The API plan is for programmatic access to inboxes via our API. They are separate subscriptions; you can have one, both, or neither.",
  },
  {
    q: 'What does "Pro inbox" mean on Growth / Enterprise API plans?',
    a: 'When your API plan includes "Pro (forever)" persistence, inboxes you create are treated as Pro inboxes at the backend level. This means: emails are stored permanently (no 24-hour deletion), you get access to freshly rotated domain lists, and inboxes are private (not publicly searchable). It does NOT grant a webapp Pro account — you won\'t get the ad-free interface, OTP extraction UI, verification link detection chips, or inbox layout options in the web client. Those are exclusive to a webapp Pro subscription.',
  },
  {
    q: "What are fresh domain updates and why do they matter?",
    a: "Most disposable email services reuse the same small set of domains for years — those domains end up on every spam blocklist and registration service rejects them immediately. On Growth and Enterprise API plans, your inboxes are provisioned on recently added, unblocked domains that have no spam history. We rotate new domains in regularly so that emails from services like GitHub, Google, or Stripe actually land instead of being silently rejected.",
  },
  {
    q: "Do my API-created inboxes share the fresh domain pool with webapp Pro users?",
    a: "Yes. Growth and Enterprise API inboxes draw from the same regularly updated domain pool as webapp Pro subscribers. Both tiers get fresh, low-history domains. The difference is that webapp Pro users also get the visual OTP and verification-link UI in their browser, while API plans expose those capabilities programmatically.",
  },
  {
    q: "Can I get both an API plan and a webapp Pro plan?",
    a: "Absolutely. They are independent subscriptions. If you want to use the API programmatically AND use the polished web client with all Pro UI features, subscribe to both. Each subscription is billed separately.",
  },
];

const PAYMENT_METHODS = [
  { icon: SiVisa,            label: "Visa"       },
  { icon: SiMastercard,      label: "Mastercard" },
  { icon: SiAmericanexpress, label: "Amex"       },
  { icon: SiPaypal,          label: "PayPal"     },
  { icon: SiApplepay,        label: "Apple Pay"  },
  { icon: SiGooglepay,       label: "Google Pay" },
];

// ─── Pro-inbox info popover ───────────────────────────────────────────────────
function ProInboxBadge() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1">
      {/* Link to pricing page */}
      <Link
        href="/pricing"
        className="text-xs font-medium text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors whitespace-nowrap"
        title="See webapp Pro plan"
      >
        Pro (forever)
      </Link>

      {/* Info toggle */}
      <button
        type="button"
        aria-label="What is Pro inbox?"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-border"
      >
        <Info className="h-3 w-3" />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 z-50 rounded-lg border border-border bg-background shadow-lg text-left">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Pro inbox — what's included?</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* Included */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">Backend inbox benefits ✓</p>
              <ul className="space-y-1">
                {[
                  "Emails stored permanently (no expiry)",
                  "Access to fresh, regularly rotated domain list",
                  "Private inboxes — not publicly searchable",
                  "Large attachment support",
                ].map(item => (
                  <li key={item} className="flex items-start gap-1.5 text-xs text-foreground">
                    <Check className="h-3 w-3 text-foreground shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Not included */}
            <div className="border-t border-border pt-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">Not included (webapp Pro only)</p>
              <ul className="space-y-1">
                {[
                  "Ad-free web interface",
                  "OTP extraction UI in browser",
                  "Verification link detection chips",
                  "Inbox layout options & keyboard shortcuts",
                ].map(item => (
                  <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="h-3 w-3 rounded-full border border-border shrink-0 mt-0.5 block" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="border-t border-border pt-3">
              <Link
                href="/pricing"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setOpen(false)}
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                See webapp Pro plan features →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function PaddleTrustStrip() {
  return (
    <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-border">
      <span className="flex items-center gap-1.5 border border-border rounded-md px-3 py-1.5 bg-muted/20 text-xs text-muted-foreground font-mono whitespace-nowrap">
        <svg className="h-3.5 w-3.5 shrink-0 text-foreground/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-11h2v2h-2V9zm0 4h2v6h-2v-6z"/>
        </svg>
        Secure checkout via Paddle
      </span>
      <div className="flex items-center gap-1">
        {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
          <span key={label} title={label} className="flex items-center justify-center rounded border border-border bg-muted/20 px-2 py-1.5 text-muted-foreground/70 hover:text-muted-foreground transition-colors">
            <Icon className="h-3.5 w-auto" />
          </span>
        ))}
      </div>
      <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground border border-border rounded-md px-2.5 py-1.5 bg-muted/20 whitespace-nowrap">
        <Globe className="h-3 w-3 shrink-0" />200+ countries
      </span>
    </div>
  );
}

function MoneyBackBadge() {
  return (
    <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-background w-fit">
      <ShieldCheck className="h-5 w-5 text-foreground/70 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-foreground leading-snug">14-day money-back guarantee</p>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
          Not satisfied? Get a full refund within 14 days — no questions asked.{" "}
          <Link href="/policies/refund" className="underline underline-offset-4 decoration-border hover:text-foreground transition-colors">Refund policy →</Link>
        </p>
      </div>
    </div>
  );
}

const Cross = () => <span className="h-4 w-4 rounded-full border border-border block mx-auto" />;

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.09) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

const ASCII_FRAGS = [
  { x: "2%",  y: "8%",  t: "EHLO api2.freecustom.email" },
  { x: "70%", y: "6%",  t: "250 2.1.0 Ok"               },
  { x: "1%",  y: "55%", t: "X-OTP: 847291"               },
  { x: "71%", y: "52%", t: "RCPT TO:<inbox@ditmail.info>" },
];

// ─── Downgrade modal ──────────────────────────────────────────────────────────
interface DowngradeModalProps {
  open:       boolean;
  fromPlan:   string;
  toPlan:     string;
  effectiveAt?: string | null;
  onConfirm:  (reason: string, comment: string) => Promise<void>;
  onClose:    () => void;
}

function DowngradeModal({ open, fromPlan, toPlan, onConfirm, onClose }: DowngradeModalProps) {
  const [reason,  setReason]  = useState("");
  const [comment, setComment] = useState("");
  const [busy,    setBusy]    = useState(false);

  useEffect(() => {
    if (open) { setReason(""); setComment(""); }
  }, [open]);

  const handleConfirm = async () => {
    if (!reason) { toast.error("Please select a reason."); return; }
    setBusy(true);
    try { await onConfirm(reason, comment); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Downgrade to {toPlan.charAt(0).toUpperCase() + toPlan.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Your plan will change from <strong>{fromPlan}</strong> to <strong>{toPlan}</strong> at the
            end of your current billing period. You keep all current features until then.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Why are you downgrading?</p>
          <div className="space-y-1.5">
            {DOWNGRADE_REASONS.map(r => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors ${
                  reason === r.value
                    ? "border-foreground bg-muted/40 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">
            Anything else? <span className="text-muted-foreground font-normal">(optional)</span>
          </p>
          <Textarea
            placeholder="Tell us more — we read every response."
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="resize-none text-sm"
            rows={3}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Keep current plan</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={busy || !reason}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm downgrade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Plan card CTA button ─────────────────────────────────────────────────────
interface PlanCtaProps {
  plan:          typeof PLANS[number];
  currentPlan:   ApiPlanName | null;
  isLoggedIn:    boolean;
  busy:          boolean;
  scheduledDowngradePlan?: string | null;
  onUpgrade:     (plan: typeof PLANS[number]) => void;
  onDowngrade:   (plan: typeof PLANS[number]) => void;
  onGetStarted:  (plan: typeof PLANS[number]) => void;
}

function PlanCta({
  plan, currentPlan, isLoggedIn, busy,
  scheduledDowngradePlan, onUpgrade, onDowngrade, onGetStarted,
}: PlanCtaProps) {
  const planName = plan.name as ApiPlanName;

  if (!isLoggedIn || !currentPlan) {
    if (planName === "free") {
      return (
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/auth?callbackUrl=/api/dashboard">Get started</Link>
        </Button>
      );
    }
    return (
      <Button size="sm" className="w-full" disabled={busy} onClick={() => onGetStarted(plan)}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get started"}
      </Button>
    );
  }

  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const planIdx    = PLAN_ORDER.indexOf(planName);

  if (planName === currentPlan) {
    const isScheduledDown = scheduledDowngradePlan != null;
    return (
      <Button size="sm" variant="outline" className="w-full cursor-default" disabled>
        {isScheduledDown ? "Changing soon" : "Current plan"}
      </Button>
    );
  }

  if (planIdx > currentIdx) {
    return (
      <Button size="sm" className="w-full" disabled={busy} onClick={() => onUpgrade(plan)}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade"}
      </Button>
    );
  }

  if (planName === "free") {
    return (
      <Button asChild size="sm" variant="ghost" className="w-full text-muted-foreground">
        <Link href="/api/dashboard">Cancel plan</Link>
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" className="w-full text-muted-foreground hover:text-foreground" disabled={busy} onClick={() => onDowngrade(plan)}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Downgrade"}
    </Button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function ApiPricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentPlan, setCurrentPlan]                 = useState<ApiPlanName | null>(null);
  const [scheduledDowngradePlan, setScheduledDnPlan]  = useState<string | null>(null);
  const [planLoading, setPlanLoading]                 = useState(false);

  const [busyPlanId,    setBusyPlanId]    = useState<string | null>(null);
  const [busyCredits,   setBusyCredits]   = useState<string | null>(null);

  const [downgradeTarget, setDowngradeTarget] = useState<typeof PLANS[number] | null>(null);

  const isLoggedIn = status === "authenticated" && !!session?.user;

  useEffect(() => {
    if (!isLoggedIn) return;
    setPlanLoading(true);
    fetch("/api/user/api-status")
      .then(r => r.json())
      .then(d => {
        const data = d?.data ?? d;
        const name = typeof data?.plan === "object"
          ? (data.plan?.name as ApiPlanName)
          : (data?.plan as ApiPlanName) ?? "free";
        setCurrentPlan(name ?? "free");
        setScheduledDnPlan(data?.scheduledDowngradePlan ?? null);
      })
      .catch(() => setCurrentPlan("free"))
      .finally(() => setPlanLoading(false));
  }, [isLoggedIn]);

  const openCheckout = async (payload: {
    productType: "api" | "credits";
    apiPlan?:    string;
    package?:    string;
  }) => {
    if (!session?.user?.id) {
      toast.error("Please sign in first.");
      router.push("/auth?callbackUrl=/api/pricing");
      return;
    }
    const body: Record<string, unknown> = payload.productType === "api"
      ? { type: "api", plan: payload.apiPlan }
      : { type: "credits", package: payload.package };

    const tid = toast.loading("Opening checkout…");
    try {
      const res = await fetch("/api/paddle/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.error) { toast.error(d.error, { id: tid }); return; }

      const Paddle = typeof window !== "undefined" ? (window as any).Paddle : null;
      if (!Paddle) { toast.error("Checkout not ready. Please refresh.", { id: tid }); return; }
      toast.dismiss(tid);

      const customData: Record<string, unknown> = {
        userId: session.user.id,
        productType: d.productType ?? payload.productType,
      };
      if (d.apiPlan)              customData.apiPlan      = d.apiPlan;
      if (d.creditsToAdd != null) customData.creditsToAdd = d.creditsToAdd;

      Paddle.Checkout.open({
        settings: {
          displayMode: "overlay",
          theme: "light",
          successUrl: `${window.location.origin}/api/dashboard?checkout=success`,
        },
        items: [{ priceId: d.priceId, quantity: 1 }],
        customer: session.user?.email ? { email: session.user.email as string } : undefined,
        customData,
        onEvent: (event: any) => {
          if (event.name === "checkout.completed")
            router.push("/api/dashboard?checkout=success");
        },
      });
    } catch {
      toast.error("Something went wrong.", { id: tid });
    } finally {
      setBusyPlanId(null);
      setBusyCredits(null);
    }
  };

  const changePlan = async (
    targetPlan: typeof PLANS[number],
    reason?:    string,
    comment?:   string,
  ) => {
    const tid = toast.loading(
      PLAN_ORDER.indexOf(targetPlan.name as ApiPlanName) > PLAN_ORDER.indexOf(currentPlan!)
        ? "Upgrading plan…"
        : "Scheduling downgrade…",
    );
    try {
      const res = await fetch("/api/paddle/change-plan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlan: targetPlan.name,
          reason:  reason  ?? null,
          comment: comment ?? null,
        }),
      });
      const d = await res.json();

      if (!res.ok || d.error) {
        toast.error(d.error ?? d.message ?? "Failed to change plan.", { id: tid });
        return;
      }

      toast.success(d.message ?? "Plan updated.", { id: tid });
      if (d.changeType === "upgrade") {
        setCurrentPlan(targetPlan.name as ApiPlanName);
        setScheduledDnPlan(null);
      } else {
        setScheduledDnPlan(targetPlan.name);
      }
      setDowngradeTarget(null);
    } catch {
      toast.error("Something went wrong.", { id: tid });
    } finally {
      setBusyPlanId(null);
    }
  };

  const handleUpgrade = (plan: typeof PLANS[number]) => {
    if (!plan.planId) return;
    setBusyPlanId(plan.planId);
    if (currentPlan && currentPlan !== "free") {
      changePlan(plan);
    } else {
      openCheckout({ productType: "api", apiPlan: plan.planId });
    }
  };

  const handleDowngrade  = (plan: typeof PLANS[number]) => { setDowngradeTarget(plan); };
  const handleGetStarted = (plan: typeof PLANS[number]) => {
    if (!plan.planId) return;
    setBusyPlanId(plan.planId);
    openCheckout({ productType: "api", apiPlan: plan.planId });
  };
  const handleCreditsClick = (pkg: typeof CREDITS[number]) => {
    setBusyCredits(pkg.package);
    openCheckout({ productType: "credits", package: pkg.package });
  };
  const confirmDowngrade = async (reason: string, comment: string) => {
    if (!downgradeTarget) return;
    setBusyPlanId(downgradeTarget.planId ?? null);
    await changePlan(downgradeTarget, reason, comment);
  };

  // ─── Persistence cell renderer ────────────────────────────────────────────
  const renderPersistence = (plan: typeof PLANS[number]) => {
    if (plan.persistence === "Pro (forever)") {
      return <ProInboxBadge />;
    }
    return <span className="text-xs text-right leading-tight">{plan.persistence}</span>;
  };

  // ─── Fresh domains cell renderer ─────────────────────────────────────────
  const renderFreshDomains = (plan: typeof PLANS[number]) => {
    if (!plan.freshDomains) return <Cross />;
    return (
      <div className="flex flex-col items-center gap-0.5">
        <Check className="h-4 w-4 mx-auto" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground border border-border rounded-sm px-1 py-px leading-none">
          Regular
        </span>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-background text-foreground overflow-x-hidden" style={DOT_BG}>
        {/* ASCII bg */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
          {ASCII_FRAGS.map((f, i) => (
            <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap"
              style={{ left: f.x, top: f.y, opacity: 0.035 }}>{f.t}</span>
          ))}
        </div>

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
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3">
              Simple, predictable pricing
            </h1>
            <p className="text-sm text-muted-foreground">Pay per plan or top up with credits. Credits never expire.</p>

            {scheduledDowngradePlan && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-muted-foreground">
                  Your plan is scheduled to change to{" "}
                  <strong className="text-foreground capitalize">{scheduledDowngradePlan}</strong>{" "}
                  at the end of your current billing period.
                </p>
              </div>
            )}
          </div>

          {/* Plans grid */}
          <div className="grid gap-px bg-border rounded-lg overflow-hidden grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            {PLANS.map((plan) => {
              const planName = plan.name as ApiPlanName;
              const isCurrent = isLoggedIn && currentPlan === planName;
              const isScheduledTarget = scheduledDowngradePlan === planName;

              return (
                <div
                  key={plan.name}
                  className={`bg-background flex flex-col p-6 relative ${isCurrent ? "ring-1 ring-inset ring-foreground/20" : ""}`}
                >
                  {isCurrent && !isScheduledTarget && (
                    <span className="absolute top-0 right-0 text-[10px] font-semibold font-mono uppercase tracking-widest text-foreground bg-muted/60 px-2 py-1 rounded-bl-lg">
                      Current
                    </span>
                  )}
                  {isScheduledTarget && (
                    <span className="absolute top-0 right-0 text-[10px] font-semibold font-mono uppercase tracking-widest text-muted-foreground bg-muted/40 px-2 py-1 rounded-bl-lg">
                      Scheduled
                    </span>
                  )}

                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">{plan.label}</p>
                  <div className="flex items-baseline gap-0.5 mb-6">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.sub}</span>
                  </div>

                  <div className="space-y-3 text-sm flex-1">
                    {[
                      { label: "Req/sec",        value: plan.reqSec },
                      { label: "Req/month",      value: plan.reqMonth },
                      { label: "OTP",            value: plan.otp ? <Check className="h-4 w-4 mx-auto" /> : <Cross /> },
                      { label: "Attachments",    value: plan.attachments ? <span className="text-xs">{plan.maxAttachment}</span> : <Cross /> },
                      { label: "WebSocket",      value: plan.ws ? <span className="text-xs">{plan.maxWs} conn</span> : <Cross /> },
                      { label: "Custom domain",  value: plan.customDomains ? <Check className="h-4 w-4 mx-auto" /> : <Cross /> },
                      {
                        label: "Fresh domains",
                        value: renderFreshDomains(plan),
                        hint: plan.freshDomains ? "Inboxes provisioned on newly added, unblocked domains" : undefined,
                      },
                      {
                        label: "Persistence",
                        value: renderPersistence(plan),
                      },
                    ].map(row => (
                      <div key={row.label} className="border-t border-border pt-3 flex items-start justify-between gap-2 first:border-t-0 first:pt-0">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground text-xs">{row.label}</span>
                          {(row as any).hint && (
                            <span className="text-[10px] text-muted-foreground/60 leading-tight">{(row as any).hint}</span>
                          )}
                        </div>
                        <span className="font-medium shrink-0">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    {planLoading && isLoggedIn ? (
                      <Button size="sm" variant="outline" className="w-full" disabled>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </Button>
                    ) : (
                      <PlanCta
                        plan={plan}
                        currentPlan={currentPlan}
                        isLoggedIn={isLoggedIn}
                        busy={busyPlanId === plan.planId}
                        scheduledDowngradePlan={scheduledDowngradePlan}
                        onUpgrade={handleUpgrade}
                        onDowngrade={handleDowngrade}
                        onGetStarted={handleGetStarted}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pro inbox callout banner */}
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/10 px-4 py-3 text-sm mb-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5">
                Growth &amp; Enterprise: Pro inbox features included
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Inboxes are treated as{" "}
                <Link href="/pricing" className="underline underline-offset-4 decoration-border hover:text-foreground transition-colors">
                  webapp Pro
                </Link>{" "}
                at the backend level — permanent retention, fresh domain rotation, and private inboxes.
                Client-side features (ad-free UI, OTP chips, inbox layouts) require a separate{" "}
                <Link href="/pricing" className="underline underline-offset-4 decoration-border hover:text-foreground transition-colors">
                  webapp Pro subscription →
                </Link>
              </p>
            </div>
          </div>

          <PaddleTrustStrip />
          <div className="mt-4"><MoneyBackBadge /></div>

          {/* Credits */}
          <div className="mb-16 mt-16">
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

      {/* Downgrade modal */}
      <DowngradeModal
        open={downgradeTarget != null}
        fromPlan={currentPlan ? (currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)) : ""}
        toPlan={downgradeTarget?.label ?? ""}
        onConfirm={confirmDowngrade}
        onClose={() => { setDowngradeTarget(null); setBusyPlanId(null); }}
      />
    </>
  );
}