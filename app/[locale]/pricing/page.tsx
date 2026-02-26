"use client";
import { useState } from "react";
import {
  Check, X, Crown, Loader2, EyeOff, Zap, Globe, Link2,
  Paperclip, Clock, Mail, MessageSquareCode,
  Star, MailOpen, Shield, Sparkles,
  Keyboard, Lock, Users, HeartHandshake, Gift, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ThemeProvider } from "@/components/theme-provider";
import toast from "react-hot-toast";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { SiVisa, SiMastercard, SiAmericanexpress, SiPaypal, SiApplepay, SiGooglepay } from "react-icons/si";

type BillingCycle = "monthly" | "yearly";

// ── Primitives ────────────────────────────────────────────────────────────────
const Tick = () => <Check className="mx-auto h-4 w-4 text-emerald-500" />;
const Cross = () => <X className="mx-auto h-4 w-4 text-muted-foreground/40" />;

const SectionRow = ({ label }: { label: string }) => (
  <div className="col-span-full bg-muted/40 px-3 py-1.5">
    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {label}
    </span>
  </div>
);

interface FRowProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  isNew?: boolean;
  highlight?: boolean;
  guest: React.ReactNode | boolean;
  free: React.ReactNode | boolean;
  pro: React.ReactNode | boolean;
}

const FRow = ({ icon, label, hint, isNew, highlight, guest, free, pro }: FRowProps) => {
  const cell = (v: React.ReactNode | boolean) => {
    if (v === true) return <div className="flex justify-center"><Tick /></div>;
    if (v === false) return <div className="flex justify-center"><Cross /></div>;
    return <div className="flex justify-center text-center">{v}</div>;
  };

  return (
    <div className={cn(
      "grid grid-cols-[1fr_64px_72px] sm:grid-cols-[1fr_80px_80px_80px] items-center gap-x-1 border-b border-border/50 px-3 py-2.5 last:border-0 transition-colors",
      highlight ? "bg-primary/[0.03] hover:bg-primary/[0.06]" : "hover:bg-muted/20"
    )}>
      <div className="min-w-0 pr-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("shrink-0", highlight ? "text-primary/60" : "text-muted-foreground/70")}>{icon}</span>
          <span className={cn("text-sm leading-snug", highlight ? "font-semibold" : "font-medium")}>{label}</span>
          {isNew && (
            <Badge className="h-4 rounded-sm px-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white border-0">
              NEW
            </Badge>
          )}
        </div>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug pl-5">{hint}</p>}
      </div>
      <div className="hidden sm:flex justify-center">{cell(guest)}</div>
      <div className="flex justify-center">{cell(free)}</div>
      <div className="flex justify-center">{cell(pro)}</div>
    </div>
  );
};

const V = ({ v, accent }: { v: string; accent?: boolean }) => (
  <span className={cn("text-xs font-semibold tabular-nums", accent ? "text-primary" : "text-foreground")}>
    {v}
  </span>
);

const TrustPill = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
    <span className="text-emerald-500 shrink-0">{icon}</span>
    <span>{children}</span>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [busy, setBusy] = useState(false);
  const t = useTranslations("Pricing");
  const locale = useLocale();

  const isPro = session?.user?.plan === "pro";
  const isFree = session?.user?.plan === "free";
  const isMonthly = cycle === "monthly";
  const isYearly = cycle === "yearly";

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
    if (isPro) {
      toast.success("You're already Pro!");
      router.push("/dashboard");
      return;
    }

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
      if (!window.Paddle) { toast.error("Paddle.js not loaded. Please refresh and try again.", { id: tid }); setBusy(false); return; }

      toast.dismiss(tid);

      window.Paddle.Checkout.open({
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale,
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
    } catch {
      toast.error("Connection error. Please try again.", { id: tid });
    }

    setBusy(false);
  };

  const prices: Record<BillingCycle, { price: string; sub: string; save?: string }> = {
    monthly: { price: "$3.99",  sub: "/ month" },
    yearly:  { price: "$19.99", sub: "/ year", save: "Save 58%" },
  };
  const { price, sub, save } = prices[cycle];

  const ctaLabel = busy
    ? "Processing…"
    : isMonthly
      ? "Start 3-day free trial"
      : "Get Pro for $1.66/mo";

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />

        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20 pt-10 sm:pt-16">

          {/* ── 1. Headline rewrite ── */}
          <div className="mb-6 sm:mb-8 text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Simple Pricing
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Never lose an important email again
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />Permanent inbox
              </span>
              <span className="text-border hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />Custom domains
              </span>
              <span className="text-border hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />No ads
              </span>
            </div>
          </div>

          {/* ── 2. Social proof bar (50K / month) ── */}
          <div className="mb-8 flex items-center justify-center gap-2 flex-wrap">
            <div className="flex -space-x-2">
              {(["bg-blue-400","bg-emerald-400","bg-violet-400","bg-amber-400","bg-rose-400"] as const).map((color, i) => (
                <div key={i} className={cn("h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold text-white", color)}>
                  {["J","A","M","S","K"][i]}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">50,000+</span> users trust FreeCustom.Email every month
            </span>
            <span className="hidden sm:inline text-muted-foreground/30 text-xs">·</span>
            <div className="hidden sm:flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
              <span className="ml-1 text-xs text-muted-foreground">4.9 / 5</span>
            </div>
          </div>

          {/* ── 9. Loss-framing nudge (strongest lever) ── */}
          <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80">
              <span className="font-semibold text-foreground">Free plan emails are deleted after 24 hours.</span>
              {" "}Pro keeps them forever — including attachments.
            </p>
          </div>

          {/* ── Billing cycle toggle ── */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <Tabs value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
              <TabsList className="h-9">
                <TabsTrigger value="monthly" className="text-xs sm:text-sm px-3 sm:px-4">
                  Monthly
                  <Badge className="ml-1.5 h-4 rounded-sm px-1 text-[10px] font-bold bg-emerald-500 text-white border-0 hidden sm:inline-flex">
                    MOST POPULAR
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="yearly" className="text-xs sm:text-sm px-3 sm:px-4">
                  Yearly
                  <Badge className="ml-1.5 h-4 rounded-sm px-1 text-[10px] font-bold bg-emerald-500 text-white border-0 hidden sm:inline-flex">
                    -58%
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 3. Trial with loss framing */}
            {isMonthly && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/8 px-4 py-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                <Gift className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Full Pro access for 3 days — keep your inbox forever
                </span>
              </div>
            )}

            {/* Yearly anchor: show monthly vs yearly comparison */}
            {isYearly && (
              <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                <Star className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-primary">
                  Only <span className="font-bold">$1.66/month</span> — billed as $19.99/year
                </span>
              </div>
            )}
            {isYearly && (
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground animate-in fade-in duration-300">
                <span className="flex items-center gap-1.5">
                  <span className="line-through opacity-50">Monthly: $3.99</span>
                </span>
                <span className="text-border">→</span>
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  Yearly: $1.66/mo
                  <Badge className="h-4 rounded-sm px-1 text-[10px] font-bold bg-emerald-500 text-white border-0">
                    58% cheaper
                  </Badge>
                </span>
              </div>
            )}
          </div>

          {/* ── Payment trust bar ── */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { icon: <SiVisa className="h-5 w-auto" />, label: "Visa" },
                { icon: <SiMastercard className="h-5 w-auto" />, label: "Mastercard" },
                { icon: <SiAmericanexpress className="h-5 w-auto" />, label: "Amex" },
                { icon: <SiPaypal className="h-5 w-auto" />, label: "PayPal" },
                { icon: <SiApplepay className="h-6 w-auto" />, label: "Apple Pay" },
                { icon: <SiGooglepay className="h-6 w-auto" />, label: "Google Pay" },
              ].map(({ icon, label }) => (
                <span key={label} title={label} className="flex items-center justify-center rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                  {icon}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Secure checkout via <span className="font-medium text-foreground">Paddle</span>
              {" "}· 200+ countries · All major cards &amp; wallets accepted
            </p>
          </div>

          {/* ── Comparison table ── */}
          <div className="rounded-xl border border-border overflow-hidden shadow-sm">

            {/* Plan headers */}
            <div className="grid grid-cols-[1fr_64px_72px] sm:grid-cols-[1fr_80px_80px_80px] md:grid-cols-[1fr_100px_100px_100px] bg-muted/30 border-b border-border">
              <div className="px-3 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Feature</div>

              {/* Guest */}
              <div className="hidden sm:flex flex-col items-center justify-center gap-1 py-3 border-l border-border/50">
                <span className="text-xs font-bold">Guest</span>
                <span className="text-[11px] text-muted-foreground">$0</span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">No account</span>
                <Button size="sm" variant="outline" className="mt-1 h-6 px-2 text-[11px]" onClick={() => router.push("/")}>
                  Try free
                </Button>
              </div>

              {/* Free */}
              <div className="flex flex-col items-center justify-center gap-1 py-3 border-l border-border/50">
                <span className="text-xs font-bold">Free</span>
                <span className="text-[11px] text-muted-foreground">$0</span>
                <span className="hidden sm:block text-[10px] text-muted-foreground leading-tight text-center">With account</span>
                <Button size="sm" variant="outline" className="mt-1 h-6 px-2 text-[11px]" onClick={() => upgrade("free")}>
                  {isFree ? "Current" : "Sign up"}
                </Button>
              </div>

              {/* Pro */}
              <div className="flex flex-col items-center justify-center gap-1 py-3 border-l border-border/50 bg-primary/5">
                <div className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-primary" />
                  <span className="text-xs font-bold text-primary">Pro</span>
                </div>
                {isMonthly ? (
                  <>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">3 days free</span>
                    <span className="text-[10px] text-muted-foreground">then {price}{sub}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-semibold">$1.66/mo</span>
                    <span className="text-[10px] text-muted-foreground">$19.99/yr</span>
                    <Badge className="h-4 rounded-sm px-1 text-[9px] font-bold bg-emerald-500 text-white border-0">Save 58%</Badge>
                  </>
                )}
                <Button size="sm" className="mt-1 h-6 px-2 text-[11px]" onClick={() => upgrade("pro")} disabled={busy || isPro}>
                  {busy
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : isPro ? "Current ✓"
                    : isMonthly ? "Try free →"
                    : "$1.66/mo →"
                  }
                </Button>
              </div>
            </div>

            {/* ── 8. Key Pro rows first: Retention ── */}
            <SectionRow label="Retention" />
            <FRow
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Email retention"
              hint="How long emails stay on our server"
              highlight
              guest={<V v="10 hrs" />}
              free={<V v="24 hrs" />}
              pro={<V v="Forever" accent />}
            />
            <FRow
              icon={<MailOpen className="h-3.5 w-3.5" />}
              label="Inbox capacity"
              hint="Max emails stored per address"
              guest={<V v="10" />}
              free={<V v="50" />}
              pro={<V v="∞" accent />}
            />
            <FRow
              icon={<Star className="h-3.5 w-3.5" />}
              label="Saved inboxes"
              hint="Addresses remembered across sessions"
              guest={false}
              free={<V v="1" />}
              pro={<V v="∞" accent />}
            />
            <FRow
              icon={<Lock className="h-3.5 w-3.5" />}
              label="Private inboxes"
              hint="All emails in your active address are private — no one else can view them"
              highlight
              guest={false}
              free={false}
              pro={true}
            />

            {/* ── Privacy & Extras (moved up) ── */}
            <SectionRow label="Privacy & Extras" />
            <FRow
              icon={<EyeOff className="h-3.5 w-3.5" />}
              label="Ad-free"
              highlight
              guest={false}
              free={false}
              pro={true}
            />
            <FRow
              icon={<Shield className="h-3.5 w-3.5" />}
              label="5 GB email storage"
              hint="Persistent email + attachment archive"
              highlight
              guest={false}
              free={false}
              pro={true}
            />
            <FRow
              icon={<Paperclip className="h-3.5 w-3.5" />}
              label="Attachment downloads"
              guest={false}
              free={<V v="Limited" />}
              pro={true}
            />

            {/* ── Identity ── */}
            <SectionRow label="Identity" />
            <FRow
              icon={<Mail className="h-3.5 w-3.5" />}
              label="Custom email prefix"
              hint="e.g. yourname@ditmail.info"
              guest={false}
              free={true}
              pro={true}
            />
            <FRow
              icon={<Globe className="h-3.5 w-3.5" />}
              label="Custom domain"
              hint="Receive mail at your own domain"
              guest={false}
              free={false}
              pro={true}
            />

            {/* ── Smart Features ── */}
            <SectionRow label="Smart Features" />
            <FRow
              icon={<Zap className="h-3.5 w-3.5" />}
              label="Auto OTP extraction"
              hint="Login codes shown instantly in inbox list"
              isNew
              guest={false}
              free={<span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">Pro only</span>}
              pro={true}
            />
            <FRow
              icon={<Link2 className="h-3.5 w-3.5" />}
              label="Verification link detection"
              hint="One-click verify button extracted from email"
              isNew
              guest={false}
              free={<span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">Pro only</span>}
              pro={true}
            />
            <FRow
              icon={<MessageSquareCode className="h-3.5 w-3.5" />}
              label="Real-time delivery"
              hint="WebSocket push — emails arrive without reloading"
              guest={true}
              free={true}
              pro={true}
            />
            <FRow
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Inbox layouts"
              hint="Classic, split, compact, zen, mobile & more"
              guest={<V v="1" />}
              free={<V v="3" />}
              pro={<V v="All" accent />}
            />
            <FRow
              icon={<Keyboard className="h-3.5 w-3.5" />}
              label="Keyboard shortcuts"
              hint="Press C for copy, R for refresh & more"
              guest={false}
              free={<span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">Basics</span>}
              pro={<span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">All</span>}
            />
          </div>

          {/* Mobile guest note */}
          <p className="mt-2 text-center text-[11px] text-muted-foreground sm:hidden">
            * Guest plan available without an account.{" "}
            <button onClick={() => router.push("/")} className="underline underline-offset-2">Try it free →</button>
          </p>

          {/* Billing switch note */}
          <p className="mt-4 text-center text-xs text-muted-foreground px-2">
            Want to switch from monthly → yearly?{" "}
            <Link href="/contact" className="underline underline-offset-2 hover:text-foreground">Contact us</Link>
            {" "}and we&apos;ll apply your remaining credit to the new plan.
          </p>

          {/* ── Conversion trigger + urgency ── */}
          {!isPro && (
            <div className="mt-10 space-y-1.5 text-center">
              <p className="text-sm text-muted-foreground">
                Most users upgrade when they receive an{" "}
                <span className="font-semibold text-foreground">important verification email.</span>
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                If your email expires, it cannot be recovered.
              </p>
            </div>
          )}

          {/* ── Pro CTA banner ── */}
          {!isPro && (
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center space-y-4">
              <Crown className="mx-auto h-8 w-8 text-primary" />

              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {isMonthly
                    ? "Try Pro free for 3 days"
                    : "Go Pro for $1.66 a month"
                  }
                </h2>

                {isMonthly ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    No charge now. Starts at <span className="font-semibold text-foreground">{price}{sub}</span> after your trial.
                  </p>
                ) : (
                  <div className="mt-1 flex flex-wrap items-baseline justify-center gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold">$1.66</span>
                    <span className="text-base text-muted-foreground">/ month</span>
                    <Badge className="rounded-sm px-1.5 bg-emerald-500 text-white border-0 text-xs">
                      billed yearly · save 58%
                    </Badge>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Keep emails forever. Auto OTP. Verify links. Custom domains. No ads.
              </p>

              <Button size="lg" className="w-full sm:w-auto px-8" onClick={() => upgrade("pro")} disabled={busy}>
                {busy ? <>Processing…</> : <>{ctaLabel}</>}
              </Button>

              {/* 7. Fear reduction */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-500" />No card charged today
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-500" />Cancel in one click
                </span>
              </div>

              {/* 2. Social proof near CTA + contact link */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 border-t border-border/40">
                <TrustPill icon={<Users className="h-3 w-3" />}>
                  50,000+ users every month
                </TrustPill>
                <TrustPill icon={<HeartHandshake className="h-3 w-3" />}>
                  Any doubts?{" "}
                  <Link href="/contact" className="underline underline-offset-2 hover:text-foreground transition-colors ml-0.5">
                    Talk to us
                  </Link>
                </TrustPill>
              </div>
            </div>
          )}

          {/* ── FAQ ── */}
          <div className="mt-14">
            <h2 className="mb-5 text-center text-xl sm:text-2xl font-bold">FAQ</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {[
                {
                  id: "trial",
                  q: "How does the 3-day free trial work?",
                  a: "Select the Monthly plan and start your trial — no charge until day 4. You'll have full Pro access during the trial. Cancel any time before day 4 and you won't be billed a single cent.",
                },
                {
                  id: "cancel",
                  q: "Can I cancel anytime?",
                  a: "Yes. Cancel from your account settings — no fees, no hoops. If you're on a trial, cancelling before day 4 means zero charges.",
                },
                {
                  id: "retention",
                  q: "What happens to my emails if I don't upgrade?",
                  a: "Free plan emails are automatically deleted after 24 hours. Pro keeps all your emails and attachments forever (up to 5 GB). If you receive an important verification email, reset link, or document, upgrade before the 24-hour window closes.",
                },
                {
                  id: "otp",
                  q: "How does auto OTP extraction work?",
                  a: "Our SMTP plugin scans the subject and body the moment an email arrives. It uses layered regex patterns to detect 4–8 digit codes near keywords like 'OTP', 'code', 'verification', and 'pin'. The code appears instantly in your inbox list without opening the email. Pro only.",
                },
                {
                  id: "verify",
                  q: "What is verification link detection?",
                  a: "When an email contains a Verify, Confirm, Activate, or Magic Link button, our server extracts the URL from the HTML. You'll see a blue Verify chip in your inbox list — click it to open the link without opening the email. Pro only.",
                },
                { id: "domain", q: t("faq_domain_title"), a: t("faq_domain_desc") },
                { id: "storage", q: t("faq_storage_title"), a: t("faq_storage_desc") },
                {
                  id: "billing",
                  q: "Can I switch from monthly to yearly?",
                  a: "Yes. Contact us with your account email and we'll calculate remaining credit and apply it to the yearly plan. No double charging.",
                },
              ].map(({ id, q, a }) => (
                <AccordionItem key={id} value={id} className="rounded-lg border border-border px-4">
                  <AccordionTrigger className="text-sm sm:text-base text-left">{q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

        </main>
      </div>
    </ThemeProvider>
  );
}