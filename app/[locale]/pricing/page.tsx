"use client";
import { useState } from "react";
import {
  Check, X, Crown, Loader2, EyeOff, Zap, Globe, Link2,
  Paperclip, Clock, Mail, MessageSquareCode, ExternalLink,
  ArrowRight, Infinity, Star, MailOpen, Shield, Sparkles,
  Keyboard,
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

type BillingCycle = "weekly" | "monthly" | "yearly";

// ── Tick / Cross ──────────────────────────────────────────────────────────────
const Tick = () => (
  <Check className="mx-auto h-4 w-4 text-emerald-500" />
);
const Cross = () => (
  <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
);

// ── Section divider row ───────────────────────────────────────────────────────
const SectionRow = ({ label }: { label: string }) => (
  <div className="col-span-full bg-muted/40 px-3 py-1.5">
    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {label}
    </span>
  </div>
);

// ── Feature row ───────────────────────────────────────────────────────────────
interface FRowProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  isNew?: boolean;
  guest: React.ReactNode | boolean;
  free: React.ReactNode | boolean;
  pro: React.ReactNode | boolean;
}

const FRow = ({ icon, label, hint, isNew, guest, free, pro }: FRowProps) => {
  const cell = (v: React.ReactNode | boolean) => {
    if (v === true) return <div className="flex justify-center"><Tick /></div>;
    if (v === false) return <div className="flex justify-center"><Cross /></div>;
    return <div className="flex justify-center text-center">{v}</div>;
  };

  return (
    <div className="grid grid-cols-[1fr_64px_72px] sm:grid-cols-[1fr_80px_80px_80px] items-center gap-x-1 border-b border-border/50 px-3 py-2.5 last:border-0 hover:bg-muted/20 transition-colors">
      <div className="min-w-0 pr-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground/70 shrink-0">{icon}</span>
          <span className="text-sm font-medium leading-snug">{label}</span>
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

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [busy, setBusy] = useState(false);
  const t = useTranslations("Pricing");
  // add inside PricingPage() alongside other hooks
  const locale = useLocale();

  const isPro = session?.user?.plan === "pro";
  const isFree = session?.user?.plan === "free";

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

      if (d.error) {
        toast.error(d.error, { id: tid });
        setBusy(false);
        return;
      }

      if (!window.Paddle) {
        toast.error("Paddle.js not loaded. Please refresh and try again.", { id: tid });
        setBusy(false);
        return;
      }

      toast.dismiss(tid);

      window.Paddle.Checkout.open({
        settings: {
          displayMode: "overlay",
          theme: "light",  // follows user's theme
          locale: locale,                                        // e.g. "en", "de", "fr"
          successUrl: `${window.location.origin}/payment/success?provider=paddle`,
        },
        items: [{ priceId: d.priceId, quantity: 1 }],
        customer: session.user?.email ? { email: session.user.email } : undefined,
        customData: { userId: session.user.id },
        onEvent: (event: any) => {
          console.log('[Paddle] event:', event.name);
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
    weekly: { price: "$1.99", sub: "/ week" },
    monthly: { price: "$3.99", sub: "/ month" },
    yearly: { price: "$19.99", sub: "/ year", save: "Save 58%" },
  };
  const { price, sub, save } = prices[cycle];

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />

        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20 pt-10 sm:pt-16">

          {/* ── Page heading ── */}
          <div className="mb-8 sm:mb-10 text-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Simple Pricing
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Plans &amp; Pricing</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Start free. Upgrade for smart features.
            </p>
          </div>

          {/* ── Billing cycle toggle ── */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <Tabs value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
              <TabsList className="h-9">
                <TabsTrigger value="weekly" className="text-xs sm:text-sm px-3 sm:px-4">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs sm:text-sm px-3 sm:px-4">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="text-xs sm:text-sm px-3 sm:px-4">
                  Yearly
                  <Badge className="ml-1.5 h-4 rounded-sm px-1 text-[10px] font-bold bg-emerald-500 text-white border-0 hidden sm:inline-flex">
                    -58%
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* ── Payment trust bar ── */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* Provider icons */}
              {[
                { icon: <SiVisa className="h-5 w-auto" />, label: "Visa" },
                { icon: <SiMastercard className="h-5 w-auto" />, label: "Mastercard" },
                { icon: <SiAmericanexpress className="h-5 w-auto" />, label: "Amex" },
                { icon: <SiPaypal className="h-5 w-auto" />, label: "PayPal" },
                { icon: <SiApplepay className="h-6 w-auto" />, label: "Apple Pay" },
                { icon: <SiGooglepay className="h-6 w-auto" />, label: "Google Pay" },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  title={label}
                  className="flex items-center justify-center rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                >
                  {icon}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Secure checkout via{" "}
              <span className="font-medium text-foreground">Paddle</span>
              {" "}· 200+ countries · All major cards &amp; wallets accepted
            </p>
          </div>

          {/* ── Comparison table ── */}
          <div className="rounded-xl border border-border overflow-hidden shadow-sm">

            {/* ── Plan headers ── */}
            <div className="grid grid-cols-[1fr_64px_72px] sm:grid-cols-[1fr_80px_80px_80px] bg-muted/30 border-b border-border">
              <div className="px-3 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Feature
              </div>

              {/* Guest — hidden on mobile */}
              <div className="hidden sm:flex flex-col items-center justify-center gap-1 py-3 border-l border-border/50">
                <span className="text-xs font-bold">Guest</span>
                <span className="text-[11px] text-muted-foreground">$0</span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">No account</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1 h-6 px-2 text-[11px]"
                  onClick={() => router.push("/")}
                >
                  Try free
                </Button>
              </div>

              {/* Free */}
              <div className="flex flex-col items-center justify-center gap-1 py-3 border-l border-border/50">
                <span className="text-xs font-bold">Free</span>
                <span className="text-[11px] text-muted-foreground">$0</span>
                <span className="hidden sm:block text-[10px] text-muted-foreground leading-tight text-center">
                  With account
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1 h-6 px-2 text-[11px]"
                  onClick={() => upgrade("free")}
                >
                  {isFree ? "Current" : "Sign up"}
                </Button>
              </div>

              {/* Pro */}
              <div className="flex flex-col items-center justify-center gap-1 py-3 border-l border-border/50 bg-primary/5">
                <div className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-primary" />
                  <span className="text-xs font-bold text-primary">Pro</span>
                </div>
                <span className="text-[11px] font-semibold">{price}</span>
                <span className="text-[10px] text-muted-foreground">{sub}</span>
                {save && (
                  <Badge className="h-4 rounded-sm px-1 text-[9px] sm:text-[10px] font-bold bg-emerald-500 text-white border-0">
                    {save}
                  </Badge>
                )}
                <Button
                  size="sm"
                  className="mt-1 h-6 px-2 text-[11px]"
                  onClick={() => upgrade("pro")}
                  disabled={busy || isPro}
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : isPro ? "Current ✓" : "Upgrade →"}
                </Button>
              </div>
            </div>

            {/* ── Retention ── */}
            <SectionRow label="Retention" />
            <FRow
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Email retention"
              hint="How long emails stay on our server"
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

            {/* ── Storage & Extras ── */}
            <SectionRow label="Storage & Extras" />
            <FRow
              icon={<Paperclip className="h-3.5 w-3.5" />}
              label="Attachment downloads"
              guest={false}
              free={<V v="Limited" />}
              pro={true}
            />
            <FRow
              icon={<Shield className="h-3.5 w-3.5" />}
              label="5 GB email storage"
              hint="Persistent email + attachment archive"
              guest={false}
              free={false}
              pro={true}
            />
            <FRow
              icon={<EyeOff className="h-3.5 w-3.5" />}
              label="Ad-free"
              guest={false}
              free={false}
              pro={true}
            />
          </div>

          {/* Guest column note on mobile */}
          <p className="mt-2 text-center text-[11px] text-muted-foreground sm:hidden">
            * Guest plan available without an account.{" "}
            <button onClick={() => router.push("/")} className="underline underline-offset-2">
              Try it free →
            </button>
          </p>

          {/* ── Billing change note ── */}
          <p className="mt-4 text-center text-xs text-muted-foreground px-2">
            Want to switch from weekly → monthly or monthly → yearly?{" "}
            <Link href="/contact" className="underline underline-offset-2 hover:text-foreground">
              Contact us
            </Link>{" "}
            and we&apos;ll apply your remaining credit to the new plan.
          </p>

          {/* ── Pro CTA banner ── */}
          {!isPro && (
            <div className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center space-y-4">
              <Crown className="mx-auto h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Go Pro today</h2>
                <div className="mt-1 flex flex-wrap items-baseline justify-center gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold">{price}</span>
                  <span className="text-base text-muted-foreground">{sub}</span>
                  {save && (
                    <Badge className="rounded-sm px-1.5 bg-emerald-500 text-white border-0 text-xs">
                      {save} vs monthly
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Auto OTP, verify links, custom domains, unlimited storage, no ads.
              </p>
              <Button
                size="lg"
                className="w-full sm:w-auto px-8"
                onClick={() => upgrade("pro")}
                disabled={busy}
              >
                {busy ? <>Processing…</> : <>Upgrade to Pro</>}
              </Button>
              <p className="text-xs text-muted-foreground">
                Cancel anytime.{" "}
                <Link href="/contact" className="underline underline-offset-2">
                  Need a different billing cycle?
                </Link>
              </p>
            </div>
          )}

          {/* ── FAQ ── */}
          <div className="mt-14">
            <h2 className="mb-5 text-center text-xl sm:text-2xl font-bold">FAQ</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {[
                {
                  id: "otp",
                  q: "How does auto OTP extraction work?",
                  a: "Our SMTP plugin scans the subject and body the moment an email arrives. It uses layered regex patterns to detect 4–8 digit codes near keywords like 'OTP', 'code', 'verification', and 'pin' — in any order. The code is stored alongside the message and appears instantly in your inbox list. Pro only.",
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
                  q: "Can I change my billing cycle?",
                  a: "Yes. We support switching between weekly, monthly, and yearly plans. Contact us with your account email and we'll calculate remaining credit from your current cycle and apply it to the new one. No double charging.",
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