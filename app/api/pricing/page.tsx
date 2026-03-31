// app/api/pricing/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Check, Loader2, Globe, ShieldCheck, AlertTriangle, Info,
  RefreshCw, ExternalLink, X, Terminal, Zap,
} from "lucide-react";
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
import { PaddleInit } from "@/components/paddle-init";
import { cn } from "@/lib/utils";

// ─── constants ───────────────────────────────────────────────────────────────
const PLAN_ORDER = ["free", "developer", "startup", "growth", "enterprise"] as const;
type ApiPlanName = typeof PLAN_ORDER[number];

const PLANS = [
  { name: "free",       label: "Free",       desc: "Try the API",               price: "$0",   reqSec: "1",   reqMonth: "5,000",      otp: false, attachments: false, maxAttachment: "—",     ws: false, maxWs: "—",    customDomains: false, persistence: "Anonymous (10h)", freshDomains: false as const,     pool: "shared",    planId: null as string | null, imap: false, wait: false as boolean | string, sla: false },
  { name: "developer",  label: "Developer",  desc: "Scripts & testing",          price: "$7",   reqSec: "10",  reqMonth: "100,000",    otp: false, attachments: false, maxAttachment: "—",     ws: false, maxWs: "—",    customDomains: false, persistence: "24h",             freshDomains: false as const,     pool: "shared",    planId: "developer",           imap: false, wait: false as boolean | string, sla: false },
  { name: "startup",    label: "Startup",    desc: "Automation & production",    price: "$19",  reqSec: "25",  reqMonth: "500,000",    otp: false, attachments: true,  maxAttachment: "5 MB",  ws: true,  maxWs: "5",    customDomains: false, persistence: "24h",             freshDomains: "partial" as const, pool: "dedicated", planId: "startup",             imap: false, wait: true as boolean | string, sla: false },
  { name: "growth",     label: "Growth",     desc: "High-scale workflows",       price: "$49",  reqSec: "50",  reqMonth: "2,000,000",  otp: true,  attachments: true,  maxAttachment: "25 MB", ws: true,  maxWs: "20",   customDomains: true,  persistence: "Pro (forever)",   freshDomains: true as const,      pool: "dedicated", planId: "growth",              imap: true,  wait: true as boolean | string, sla: false },
  { name: "enterprise", label: "Enterprise", desc: "Business-critical systems",  price: "$149", reqSec: "100", reqMonth: "10,000,000", otp: true,  attachments: true,  maxAttachment: "50 MB", ws: true,  maxWs: "100",  customDomains: true,  persistence: "Pro (forever)",   freshDomains: true as const,      pool: "dedicated", planId: "enterprise",          imap: true,  wait: true as boolean | string, sla: true },
] as const;

const CREDITS = [
  { amount: "$10",  requests: "200,000", perK: "$0.05",  package: "starter" as const },
  { amount: "$25",  requests: "600,000", perK: "$0.042", package: "builder" as const },
  { amount: "$50",  requests: "1.5M",    perK: "$0.033", package: "scale"   as const },
  { amount: "$100", requests: "4M",      perK: "$0.025", package: "pro"     as const },
];

const YEARLY_PRICING: Record<string, { total: string; effective: string; planIdYearly: string }> = {
  developer:  { total: "$67",    effective: "~$5.6",  planIdYearly: "developer-yearly"  },
  startup:    { total: "$182",   effective: "~$15.2", planIdYearly: "startup-yearly"    },
  growth:     { total: "$470",   effective: "~$39.1", planIdYearly: "growth-yearly"     },
  enterprise: { total: "$1,430", effective: "~$119",  planIdYearly: "enterprise-yearly" },
};

const DOWNGRADE_REASONS = [
  { value: "too_expensive",  label: "Too expensive" },
  { value: "not_using",      label: "Not using all features" },
  { value: "switching",      label: "Switching to another service" },
  { value: "personal_use",   label: "Personal / hobby use only" },
  { value: "lower_volume",   label: "My request volume is lower than expected" },
  { value: "other",          label: "Other" },
];

const FAQ_ITEMS = [
  { q: "Can we use pro features by just buying credits with no plans (free)?", a: "No. Features (OTP extraction, attachments, WebSocket, custom domains) are determined by your API plan only. Credits only add request capacity; they don't change your plan or unlock paid features." },
  { q: "Is there a guaranteed uptime SLA?", a: "Yes, the Enterprise plan includes a 99.5% uptime SLA with real-time monitoring, based on real production performance." },
  { q: "What's the difference between credits and API plans?", a: "Your API plan sets which features you get and your base rate limits. Credits only add extra request capacity on top of your monthly quota; they never expire and are consumed when you exceed your plan limit." },
  { q: "Do credits expire?", a: "No. Credits never expire. Top up once and use them whenever you need." },
  { q: "What happens when I hit my monthly limit?", a: "If you have credits, they are consumed automatically. If you have no credits, you'll receive HTTP 429 until the next reset or until you add credits." },
  { q: "Can I use my own domain?", a: "Yes, on Growth and Enterprise. Add and verify your domain in the dashboard; then register inboxes like user@yourdomain.com via the API." },
  { q: "Can I switch plans mid-cycle?", a: "Yes. Upgrades take effect immediately; you're charged a prorated amount. Downgrades take effect at the end of the current billing period." },
  { q: "What is the difference between API plan and Pro plan?", a: "The Pro plan is for the main FreeCustom.Email web app — it unlocks client-side features. The API plan is for programmatic access. They are separate subscriptions." },
  { q: 'What does "Pro inbox" mean on Growth / Enterprise API plans?', a: 'Inboxes are stored permanently, provisioned on fresh domains, and private. It does NOT grant a webapp Pro account.' },
  { q: "What are fresh domain updates and why do they matter?", a: "Most disposable email services reuse the same domains that end up on blocklists. On Growth and Enterprise, your inboxes are on recently added, unblocked domains. We rotate new domains in regularly." },
  { q: "What is the shared pool vs. dedicated pool?", a: "On the Free plan, your inboxes share an MX infrastructure pool with all other free-tier users. On any paid plan (Developer and above) you get a dedicated pool — separate MX routing reserved for paying customers." },
];

const PAYMENT_METHODS = [
  { icon: SiVisa,            label: "Visa"       },
  { icon: SiMastercard,      label: "Mastercard" },
  { icon: SiAmericanexpress, label: "Amex"       },
  { icon: SiPaypal,          label: "PayPal"     },
  { icon: SiApplepay,        label: "Apple Pay"  },
  { icon: SiGooglepay,       label: "Google Pay" },
];

// ─── feature row groups ───────────────────────────────────────────────────────
type FeatureRowDef = {
  label:  string;
  hint?:  string;
  render: (plan: typeof PLANS[number]) => React.ReactNode;
};
type FeatureGroup = { group: string; rows: FeatureRowDef[] };

// ─── helpers ──────────────────────────────────────────────────────────────────
const Tick  = () => <Check className="h-4 w-4 text-foreground mx-auto shrink-0" />;
const Cross = () => <span className="h-4 w-4 rounded-full border border-border block mx-auto" />;

// ─── small popovers ───────────────────────────────────────────────────────────
function InfoPopover({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative inline-flex items-center gap-1">
      <span className="text-xs text-foreground">{label}</span>
      <button type="button" onClick={() => setOpen(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
        <Info className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-64 z-50 rounded-lg border border-border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
          </div>
          <div className="px-3 py-3">{children}</div>
        </div>
      )}
    </div>
  );
}

function ProInboxBadge() {
  return (
    <InfoPopover label="Pro (forever)">
      <ul className="space-y-1 mb-2">
        {["Permanent email retention", "Fresh rotated domain list", "Private inboxes"].map(i => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
            <Check className="h-3 w-3 mt-0.5 shrink-0" />{i}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground">OTP UI / ad-free interface requires separate webapp Pro plan.</p>
      <Link href="/pricing" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors">
        <ExternalLink className="h-3 w-3" />Webapp Pro →
      </Link>
    </InfoPopover>
  );
}

function SlaBadge() {
  return (
    <InfoPopover label="99.5% SLA">
      <p className="text-xs text-muted-foreground mb-2">Real-time monitoring based on production performance.</p>
      <a href="https://status.freecustom.email" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ExternalLink className="h-3 w-3" />Live status →
      </a>
    </InfoPopover>
  );
}

function CliBadge({ withWatch }: { withWatch: boolean }) {
  if (!withWatch) {
    return (
      <Link href="/api/cli" className="text-xs font-medium text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors">
        CLI
      </Link>
    );
  }
  return (
    <InfoPopover label="CLI + Watch">
      <ul className="space-y-1">
        {["fce watch — stream via WebSocket", "fce dev — inbox + watch combined", "fce otp — auto OTP extract (Growth+)"].map(i => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
            <Check className="h-3 w-3 mt-0.5 shrink-0" />{i}
          </li>
        ))}
      </ul>
      <Link href="/api/cli" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors">
        <ExternalLink className="h-3 w-3" />CLI docs →
      </Link>
    </InfoPopover>
  );
}

// ─── Downgrade modal ──────────────────────────────────────────────────────────
interface DowngradeModalProps {
  open: boolean; fromPlan: string; toPlan: string;
  onConfirm: (reason: string, comment: string) => Promise<void>;
  onClose: () => void;
}
function DowngradeModal({ open, fromPlan, toPlan, onConfirm, onClose }: DowngradeModalProps) {
  const [reason, setReason]   = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy]       = useState(false);
  useEffect(() => { if (open) { setReason(""); setComment(""); } }, [open]);
  const handleConfirm = async () => {
    if (!reason) { toast.error("Please select a reason."); return; }
    setBusy(true);
    try { await onConfirm(reason, comment); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-muted-foreground" />Downgrade to {toPlan}</DialogTitle>
          <DialogDescription>Your plan changes from <strong>{fromPlan}</strong> to <strong>{toPlan}</strong> at end of billing period.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">Why are you downgrading?</p>
          {DOWNGRADE_REASONS.map(r => (
            <button key={r.value} onClick={() => setReason(r.value)}
              className={cn(
                "w-full text-left text-sm px-3 py-2 rounded-md border transition-colors",
                reason === r.value ? "border-foreground bg-muted/40 text-foreground" : "border-border bg-background text-muted-foreground hover:border-foreground/40"
              )}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">Anything else? <span className="text-muted-foreground font-normal">(optional)</span></p>
          <Textarea placeholder="Tell us more…" value={comment} onChange={e => setComment(e.target.value)} className="resize-none text-sm" rows={3} />
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

// ─── Plan CTA ─────────────────────────────────────────────────────────────────
interface PlanCtaProps {
  plan: typeof PLANS[number]; currentPlan: ApiPlanName | null;
  isLoggedIn: boolean; busy: boolean; scheduledDowngradePlan?: string | null;
  onUpgrade: (p: typeof PLANS[number]) => void;
  onDowngrade: (p: typeof PLANS[number]) => void;
  onGetStarted: (p: typeof PLANS[number]) => void;
}
function PlanCta({ plan, currentPlan, isLoggedIn, busy, scheduledDowngradePlan, onUpgrade, onDowngrade, onGetStarted }: PlanCtaProps) {
  const planName = plan.name as ApiPlanName;
  if (!isLoggedIn || !currentPlan) {
    if (planName === "free") return <Button asChild variant="outline" size="sm" className="w-full"><Link href="/auth?callbackUrl=/api/dashboard">Get started</Link></Button>;
    return <Button size="sm" className="w-full" disabled={busy} onClick={() => onGetStarted(plan)}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Get started"}</Button>;
  }
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const planIdx    = PLAN_ORDER.indexOf(planName);
  if (planName === currentPlan) return <Button size="sm" variant="outline" className="w-full cursor-default" disabled>{scheduledDowngradePlan ? "Changing soon" : "Current plan"}</Button>;
  if (planIdx > currentIdx)    return <Button size="sm" className="w-full" disabled={busy} onClick={() => onUpgrade(plan)}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upgrade"}</Button>;
  if (planName === "free")     return <Button asChild size="sm" variant="ghost" className="w-full text-muted-foreground"><Link href="/api/dashboard">Cancel plan</Link></Button>;
  return <Button size="sm" variant="outline" className="w-full text-muted-foreground hover:text-foreground" disabled={busy} onClick={() => onDowngrade(plan)}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Downgrade"}</Button>;
}

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.09) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

// ─── Mobile plan card ─────────────────────────────────────────────────────────
// Renders a single plan as a self-contained card with all features listed inline.
// Used on small screens instead of the wide comparison table.
interface MobilePlanCardProps {
  plan: typeof PLANS[number];
  billing: "monthly" | "yearly";
  currentPlan: ApiPlanName | null;
  isLoggedIn: boolean;
  busy: boolean;
  scheduledDowngradePlan: string | null;
  featureGroups: FeatureGroup[];
  onUpgrade: (p: typeof PLANS[number]) => void;
  onDowngrade: (p: typeof PLANS[number]) => void;
  onGetStarted: (p: typeof PLANS[number]) => void;
}
function MobilePlanCard({
  plan, billing, currentPlan, isLoggedIn, busy, scheduledDowngradePlan,
  featureGroups, onUpgrade, onDowngrade, onGetStarted,
}: MobilePlanCardProps) {
  const isPopular  = plan.name === "startup";
  const isCurrent  = isLoggedIn && currentPlan === plan.name;
  const yearlyData = plan.planId ? YEARLY_PRICING[plan.planId] : null;

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden",
      isPopular && !isCurrent ? "border-foreground/30 ring-2 ring-foreground/20" : "border-border"
    )}>
      {/* Card header */}
      <div className={cn(
        "relative px-5 py-5",
        isPopular && !isCurrent ? "bg-muted/10" : "bg-background",
        isCurrent && "bg-muted/20"
      )}>
        {isPopular && !isCurrent && (
          <span className="absolute top-0 right-0 font-mono text-[8px] uppercase tracking-widest bg-foreground text-background px-2 py-1 rounded-bl-lg">
            🔥 Popular
          </span>
        )}
        {isCurrent && (
          <span className="absolute top-0 right-0 font-mono text-[8px] uppercase tracking-widest bg-muted/60 text-foreground px-2 py-1 rounded-bl-lg">
            {scheduledDowngradePlan ? "Changing soon" : "Current"}
          </span>
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{plan.label}</p>
            <p className="text-[11px] text-muted-foreground/70 mb-2">{plan.desc}</p>

            {billing === "monthly" || plan.name === "free" ? (
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                {plan.price !== "$0" && <span className="text-sm text-muted-foreground">/mo</span>}
              </div>
            ) : yearlyData ? (
              <>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-bold text-foreground">{yearlyData.effective}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="font-mono text-[9px] text-emerald-600/90 mt-0.5">{yearlyData.total}/year · 2 months free</p>
              </>
            ) : (
              <div className="flex items-baseline gap-0.5">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 pt-5 w-28">
            <PlanCta
              plan={plan} currentPlan={currentPlan} isLoggedIn={isLoggedIn}
              busy={busy} scheduledDowngradePlan={scheduledDowngradePlan}
              onUpgrade={onUpgrade} onDowngrade={onDowngrade} onGetStarted={onGetStarted}
            />
          </div>
        </div>
      </div>

      {/* Feature list */}
      <div className="border-t border-border divide-y divide-border/60">
        {featureGroups.map((group) => (
          <div key={group.group}>
            <div className="px-5 py-2 bg-muted/20">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{group.group}</span>
            </div>
            {group.rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground leading-tight">{row.label}</p>
                  {row.hint && <p className="font-mono text-[9px] text-muted-foreground/60 mt-0.5 leading-tight">{row.hint}</p>}
                </div>
                <div className="shrink-0 text-right">
                  {row.render(plan)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ApiPricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPlan, setCurrentPlan]                = useState<ApiPlanName | null>(null);
  const [scheduledDowngradePlan, setScheduledDnPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading]                = useState(false);
  const [busyPlanId, setBusyPlanId]                  = useState<string | null>(null);
  const [busyCredits, setBusyCredits]                = useState<string | null>(null);
  const [downgradeTarget, setDowngradeTarget]        = useState<typeof PLANS[number] | null>(null);
  const [billing, setBilling]                        = useState<"monthly" | "yearly">("monthly");

  const isLoggedIn = status === "authenticated" && !!session?.user;

  useEffect(() => {
    if (!isLoggedIn) return;
    setPlanLoading(true);
    fetch("/api/user/api-status")
      .then(r => r.json())
      .then(d => {
        const data = d?.data ?? d;
        const name = typeof data?.plan === "object" ? (data.plan?.name as ApiPlanName) : (data?.plan as ApiPlanName) ?? "free";
        setCurrentPlan(name ?? "free");
        setScheduledDnPlan(data?.scheduledDowngradePlan ?? null);
      })
      .catch(() => setCurrentPlan("free"))
      .finally(() => setPlanLoading(false));
  }, [isLoggedIn]);

  const openCheckout = async (payload: { productType: "api" | "credits"; apiPlan?: string; package?: string; billing?: "monthly" | "yearly" }) => {
    if (!session?.user?.id) { toast.error("Please sign in first."); router.push("/auth?callbackUrl=/api/pricing"); return; }
    const body: Record<string, unknown> = payload.productType === "api"
      ? { type: "api", plan: payload.apiPlan, billing: payload.billing ?? "monthly" }
      : { type: "credits", package: payload.package };
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
    finally { setBusyPlanId(null); setBusyCredits(null); }
  };

  const changePlan = async (targetPlan: typeof PLANS[number], reason?: string, comment?: string) => {
    const tid = toast.loading(PLAN_ORDER.indexOf(targetPlan.name as ApiPlanName) > PLAN_ORDER.indexOf(currentPlan!) ? "Upgrading plan…" : "Scheduling downgrade…");
    try {
      const res = await fetch("/api/paddle/change-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetPlan: targetPlan.name, reason: reason ?? null, comment: comment ?? null }) });
      const d = await res.json();
      if (!res.ok || d.error) { toast.error(d.error ?? d.message ?? "Failed to change plan.", { id: tid }); return; }
      toast.success(d.message ?? "Plan updated.", { id: tid });
      if (d.changeType === "upgrade") { setCurrentPlan(targetPlan.name as ApiPlanName); setScheduledDnPlan(null); }
      else setScheduledDnPlan(targetPlan.name);
      setDowngradeTarget(null);
    } catch { toast.error("Something went wrong.", { id: tid }); }
    finally { setBusyPlanId(null); }
  };

  const handleUpgrade    = (plan: typeof PLANS[number]) => { if (!plan.planId) return; setBusyPlanId(plan.planId); if (currentPlan && currentPlan !== "free") changePlan(plan); else openCheckout({ productType: "api", apiPlan: plan.planId, billing }); };
  const handleDowngrade  = (plan: typeof PLANS[number]) => setDowngradeTarget(plan);
  const handleGetStarted = (plan: typeof PLANS[number]) => { if (!plan.planId) return; setBusyPlanId(plan.planId); openCheckout({ productType: "api", apiPlan: plan.planId, billing }); };
  const handleCredits    = (pkg: typeof CREDITS[number]) => { setBusyCredits(pkg.package); openCheckout({ productType: "credits", package: pkg.package }); };
  const confirmDowngrade = async (reason: string, comment: string) => { if (!downgradeTarget) return; setBusyPlanId(downgradeTarget.planId ?? null); await changePlan(downgradeTarget, reason, comment); };

  // ─── feature groups ──────────────────────────────────────────────────────────
  const FEATURE_GROUPS: FeatureGroup[] = [
    {
      group: "Core Features",
      rows: [
        {
          label: "Real-time Email",
          hint: "WebSocket push + Wait API, no polling",
          render: (p) => p.wait ? <Tick /> : <Cross />,
        },
        {
          label: "OTP Extraction",
          hint: "Auto-parse one-time codes from emails",
          render: (p) => p.otp ? <Tick /> : <Cross />,
        },
        {
          label: "IMAP Access",
          render: (p) => p.imap
            ? <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-600/90 border border-emerald-600/30 rounded px-1.5 py-px">Soon</span>
            : <Cross />,
        },
        {
          label: "Custom Domains",
          hint: "Register inboxes on your own domain",
          render: (p) => p.customDomains ? <Tick /> : <Cross />,
        },
        {
          label: "Attachments",
          render: (p) => p.attachments
            ? <span className="text-xs font-medium text-foreground">{p.maxAttachment}</span>
            : <Cross />,
        },
        {
          label: "Uptime SLA",
          render: (p) => p.sla ? <SlaBadge /> : <Cross />,
        },
      ],
    },
    {
      group: "Deliverability",
      rows: [
        {
          label: "MX Pool",
          hint: "Dedicated = lower latency & consistent delivery",
          render: (p) => p.pool === "shared"
            ? <div className="text-center"><p className="text-xs text-muted-foreground">Shared</p><p className="font-mono text-[9px] text-muted-foreground/60">~10–30s</p></div>
            : <div className="text-center"><p className="text-xs text-foreground font-medium">Dedicated</p><p className="font-mono text-[9px] text-emerald-600/80">⚡ &lt;1s</p></div>,
        },
        {
          label: "Fresh Domains",
          hint: "Regularly rotated, not on blocklists",
          render: (p) => {
            if (!p.freshDomains) return <Cross />;
            if (p.freshDomains === "partial") return (
              <div className="flex flex-col items-center gap-0.5">
                <Check className="h-4 w-4 text-muted-foreground mx-auto" />
                <span className="font-mono text-[9px] text-muted-foreground border border-border rounded px-1 py-px">Partial</span>
              </div>
            );
            return (
              <div className="flex flex-col items-center gap-0.5">
                <Tick />
                <span className="font-mono text-[9px] text-muted-foreground border border-border rounded px-1 py-px">Regular</span>
              </div>
            );
          },
        },
        {
          label: "Inbox Retention",
          render: (p) => p.persistence === "Pro (forever)"
            ? <ProInboxBadge />
            : <span className="text-xs text-foreground">{p.persistence}</span>,
        },
      ],
    },
    {
      group: "Rate Limits",
      rows: [
        {
          label: "Requests / sec",
          render: (p) => <span className="text-sm font-semibold text-foreground tabular-nums">{p.reqSec}</span>,
        },
        {
          label: "Requests / month",
          render: (p) => <span className="text-xs font-semibold text-foreground tabular-nums">{p.reqMonth}</span>,
        },
        {
          label: "WebSocket conns",
          render: (p) => p.ws
            ? <span className="text-xs font-medium text-foreground">{p.maxWs}</span>
            : <Cross />,
        },
      ],
    },
    {
      group: "Developer",
      rows: [
        {
          label: "CLI",
          hint: "fce CLI works on all plans",
          render: (p) => <CliBadge withWatch={!!p.ws} />,
        },
        {
          label: "Support",
          render: (p) => {
            const map: Record<string, string> = { free: "Community", developer: "Email", startup: "Email", growth: "Priority", enterprise: "Dedicated" };
            const val = map[p.name] ?? "Email";
            return <span className={cn("text-xs", val === "Dedicated" ? "text-foreground font-medium" : val === "Priority" ? "text-foreground" : "text-muted-foreground")}>{val}</span>;
          },
        },
      ],
    },
  ];

  // ─── plan column highlight ────────────────────────────────────────────────────
  const getColClass = (planName: string) => {
    const isCurrent = isLoggedIn && currentPlan === planName;
    const isPopular = planName === "startup";
    if (isPopular) return "bg-background ring-2 ring-inset ring-foreground/25";
    if (isCurrent) return "bg-muted/20";
    return "bg-background";
  };

  return (
    <>
      <div className="bg-background text-foreground" style={DOT_BG}>
        <div className="fixed inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />
        <div className="fixed inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-0.5 h-4 bg-border" aria-hidden />
              <span className="font-mono text-xs text-foreground font-semibold">[ 01 / 03 ]</span>
              <span className="text-muted-foreground/50 text-xs">·</span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">API Pricing</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-2">
              Simple, predictable pricing
            </h1>
            <p className="text-sm text-muted-foreground mb-6">Pay per plan. Top up with credits. Credits never expire.</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center rounded-lg border border-border bg-muted/20 p-1 gap-1">
              <button
                onClick={() => setBilling("monthly")}
                className={cn(
                  "relative px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  billing === "monthly"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  billing === "yearly"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                Yearly
                <span className={cn(
                  "font-mono text-[9px] uppercase tracking-widest rounded px-1.5 py-px transition-colors",
                  billing === "yearly"
                    ? "bg-emerald-600/15 text-emerald-600 border border-emerald-600/25"
                    : "bg-muted/40 text-muted-foreground border border-border"
                )}>
                  2 months free
                </span>
              </button>
            </div>

            {scheduledDowngradePlan && (
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-muted-foreground">
                  Scheduled change to{" "}
                  <strong className="text-foreground capitalize">{scheduledDowngradePlan}</strong>{" "}
                  at end of billing period.
                </p>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              DESKTOP comparison table (lg+)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
              <div className="min-w-[700px]">
                {/* sticky plan header */}
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
                  <div className="grid grid-cols-[200px_repeat(5,1fr)] gap-px bg-border rounded-t-lg overflow-hidden">
                    <div className="bg-background px-4 py-5 flex items-end">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Plan</span>
                    </div>
                    {PLANS.map((plan) => {
                      const isPopular   = plan.name === "startup";
                      const isCurrent   = isLoggedIn && currentPlan === plan.name;
                      const isScheduled = scheduledDowngradePlan === plan.name;
                      return (
                        <div key={plan.name} className={cn(getColClass(plan.name), "px-4 py-5 relative")}>
                          {isPopular && !isCurrent && (
                            <span className="absolute top-0 right-0 font-mono text-[8px] uppercase tracking-widest bg-foreground text-background px-2 py-1 rounded-bl-lg">
                              🔥 Popular
                            </span>
                          )}
                          {isCurrent && (
                            <span className="absolute top-0 right-0 font-mono text-[8px] uppercase tracking-widest bg-muted/60 text-foreground px-2 py-1 rounded-bl-lg">
                              {isScheduled ? "Scheduled" : "Current"}
                            </span>
                          )}
                          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{plan.label}</p>
                          {billing === "monthly" || plan.name === "free" ? (
                            <>
                              <div className="flex items-baseline gap-0.5 mb-0.5">
                                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                                <span className="text-xs text-muted-foreground">/mo</span>
                              </div>
                              {plan.price !== "$0" ? (
                                <p className="font-mono text-[9px] text-muted-foreground/50 mb-3">billed monthly</p>
                              ) : (
                                <div className="mb-[1.125rem]" />
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-2xl font-bold text-foreground">
                                  {YEARLY_PRICING[plan.planId!]?.effective ?? plan.price}
                                </span>
                                <span className="text-xs text-muted-foreground">/mo</span>
                              </div>
                              <p className="font-mono text-[9px] text-emerald-600/90 mb-3">
                                {YEARLY_PRICING[plan.planId!]?.total}/year · 2 months free
                              </p>
                            </>
                          )}
                          {planLoading && isLoggedIn ? (
                            <Button size="sm" variant="outline" className="w-full" disabled><Loader2 className="h-3.5 w-3.5 animate-spin" /></Button>
                          ) : (
                            <PlanCta
                              plan={plan} currentPlan={currentPlan} isLoggedIn={isLoggedIn}
                              busy={busyPlanId === plan.planId} scheduledDowngradePlan={scheduledDowngradePlan}
                              onUpgrade={handleUpgrade} onDowngrade={handleDowngrade} onGetStarted={handleGetStarted}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* feature rows */}
                <div className="border border-t-0 border-border rounded-b-lg overflow-hidden">
                  {FEATURE_GROUPS.map((group) => (
                    <div key={group.group}>
                      <div className="grid grid-cols-[200px_repeat(5,1fr)] bg-muted/30">
                        <div className="px-4 py-2.5 col-span-6">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{group.group}</span>
                        </div>
                      </div>
                      {group.rows.map((row) => (
                        <div
                          key={row.label}
                          className="grid grid-cols-[200px_repeat(5,1fr)] gap-px bg-border hover:bg-border/80 transition-colors"
                        >
                          <div className="bg-background px-4 py-3 flex flex-col justify-center">
                            <span className="text-xs font-medium text-foreground leading-tight">{row.label}</span>
                            {row.hint && <span className="font-mono text-[9px] text-muted-foreground/60 mt-0.5 leading-tight">{row.hint}</span>}
                          </div>
                          {PLANS.map((plan) => (
                            <div key={plan.name} className={cn(getColClass(plan.name), "px-4 py-3 flex items-center justify-center")}>
                              {row.render(plan)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              MOBILE stacked plan cards (< lg)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:hidden space-y-4">
            {/* Mobile billing toggle hint */}
            <p className="text-[11px] text-muted-foreground font-mono">
              Tap a plan to see all features. Scroll to compare.
            </p>
            {PLANS.map((plan) => (
              <MobilePlanCard
                key={plan.name}
                plan={plan}
                billing={billing}
                currentPlan={currentPlan}
                isLoggedIn={isLoggedIn}
                busy={busyPlanId === plan.planId}
                scheduledDowngradePlan={scheduledDowngradePlan}
                featureGroups={FEATURE_GROUPS}
                onUpgrade={handleUpgrade}
                onDowngrade={handleDowngrade}
                onGetStarted={handleGetStarted}
              />
            ))}
          </div>

          {/* callout banners */}
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/10 px-4 py-3">
              <RefreshCw className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="text-foreground font-semibold">Growth &amp; Enterprise:</span>{" "}
                Inboxes include permanent retention, fresh domain rotation, and private access at the backend level.
                Client-side features (ad-free UI, OTP chips) require a separate{" "}
                <Link href="/pricing" className="underline underline-offset-4 decoration-border hover:text-foreground transition-colors">webapp Pro plan →</Link>
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/10 px-4 py-3">
              <Terminal className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="text-foreground font-semibold">CLI on all plans.</span>{" "}
                Live watching (<code className="bg-muted/40 px-1 rounded text-foreground text-[10px]">fce watch</code>, <code className="bg-muted/40 px-1 rounded text-foreground text-[10px]">fce dev</code>) requires Startup+.
                OTP extract (<code className="bg-muted/40 px-1 rounded text-foreground text-[10px]">fce otp</code>) requires Growth+.
                <Link href="/api/cli" className="ml-1 underline underline-offset-4 decoration-border hover:text-foreground transition-colors">CLI docs →</Link>
              </p>
            </div>
          </div>

          {/* trust strip */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-border">
            <span className="flex items-center gap-1.5 border border-border rounded-md px-3 py-1.5 bg-muted/20 text-xs text-muted-foreground font-mono whitespace-nowrap">
              <ShieldCheck className="h-3.5 w-3.5 text-foreground/70 shrink-0" />Secure checkout via Paddle
            </span>
            <div className="flex items-center gap-1">
              {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
                <span key={label} title={label} className="flex items-center justify-center rounded border border-border bg-muted/20 px-2 py-1.5 text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                  <Icon className="h-3.5 w-auto" />
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground border border-border rounded-md px-2.5 py-1.5 bg-muted/20">
              <Globe className="h-3 w-3 shrink-0" />200+ countries
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-background w-fit">
            <ShieldCheck className="h-5 w-5 text-foreground/70 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground leading-snug">14-day money-back guarantee</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Not satisfied? Full refund within 14 days.{" "}
                <Link href="/policies/refund" className="underline underline-offset-4 decoration-border hover:text-foreground transition-colors">Refund policy →</Link>
              </p>
            </div>
          </div>

          {/* ── Credits ────────────────────────────────────────────────────── */}
          <div className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-0.5 h-4 bg-border" aria-hidden />
              <span className="font-mono text-xs text-foreground font-semibold">[ 02 / 03 ]</span>
              <span className="text-muted-foreground/50 text-xs">·</span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Credits — never expire</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Need more capacity?</h2>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Credits never expire. Consumed automatically when you exceed your monthly quota.
                </p>
              </div>
            </div>

            <div className="grid gap-px bg-border rounded-lg overflow-hidden grid-cols-2 sm:grid-cols-4">
              {CREDITS.map((c) => (
                <div key={c.package} className="bg-background px-5 py-6 flex flex-col gap-4">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{c.amount}</p>
                    <p className="text-sm text-muted-foreground mt-1">{c.requests} requests</p>
                    <p className="font-mono text-xs text-muted-foreground mt-0.5">{c.perK} per 1k</p>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-auto" disabled={!!busyCredits} onClick={() => handleCredits(c)}>
                    {busyCredits === c.package ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Buy credits"}
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-px bg-border rounded-lg overflow-hidden grid-cols-2 sm:grid-cols-4">
              {[
                { v: "Never expire",  l: "use whenever you need" },
                { v: "Stackable",     l: "with any plan" },
                { v: "Auto-consumed", l: "after monthly quota" },
                { v: "Any time",      l: "buy more anytime" },
              ].map(({ v, l }) => (
                <div key={v} className="bg-background px-4 py-3 text-center">
                  <p className="font-mono text-xs font-semibold text-foreground">{v}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FAQ ────────────────────────────────────────────────────────── */}
          <div className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-0.5 h-4 bg-border" aria-hidden />
              <span className="font-mono text-xs text-foreground font-semibold">[ 03 / 03 ]</span>
              <span className="text-muted-foreground/50 text-xs">·</span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">FAQ</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-8">Frequently asked questions</h2>
            <div className="max-w-2xl space-y-0">
              {FAQ_ITEMS.map(({ q, a }, i) => (
                <details key={i} className="group border-t border-border py-4 last:border-b">
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                    <span className="leading-relaxed">{q}</span>
                    <span className="shrink-0 text-muted-foreground mt-0.5 group-open:rotate-45 transition-transform duration-200 text-lg leading-none">+</span>
                  </summary>
                  <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed pr-8">{a}</p>
                </details>
              ))}
            </div>
          </div>

        </div>
      </div>

      <DowngradeModal
        open={downgradeTarget != null}
        fromPlan={currentPlan ? (currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)) : ""}
        toPlan={downgradeTarget?.label ?? ""}
        onConfirm={confirmDowngrade}
        onClose={() => { setDowngradeTarget(null); setBusyPlanId(null); }}
      />
      <PaddleInit />
    </>
  );
}