// app/pricing/page.tsx
"use client";

import { useState } from "react";
import {
  Check, X, Crown, Loader2, EyeOff, Zap, Globe, Link2,
  Paperclip, Clock, Mail, MessageSquareCode, ExternalLink,
  ArrowRight, Infinity, Star, MailOpen, Shield, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ThemeProvider } from "@/components/theme-provider";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import Link from "next/link";

type BillingCycle = "weekly" | "monthly" | "yearly";

// ── Tick / Cross ──────────────────────────────────────────────────────────────
const Tick = () => (
  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-500">
    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
  </span>
);
const Cross = () => (
  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground/25">
    <X className="w-3 h-3 stroke-2" />
  </span>
);

// ── OTP demo chip ─────────────────────────────────────────────────────────────
const OtpChip = ({ blurred }: { blurred: boolean }) => (
  <span className={cn(
    "inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md border select-none",
    blurred
      ? "bg-amber-500/10 border-amber-400/20 text-amber-500"
      : "bg-emerald-500/10 border-emerald-400/20 text-emerald-600 dark:text-emerald-400"
  )}>
    {blurred
      ? <><span className="blur-[4px] tracking-widest">847291</span><Crown className="w-3 h-3 shrink-0" /></>
      : <><span className="tracking-widest">847291</span><Check className="w-3 h-3" /></>
    }
  </span>
);

// ── Verify link chip ──────────────────────────────────────────────────────────
const VerifyChip = ({ blurred }: { blurred: boolean }) => (
  <span className={cn(
    "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-medium select-none",
    blurred
      ? "bg-muted border-border text-muted-foreground"
      : "bg-blue-500/10 border-blue-400/20 text-blue-500"
  )}>
    {blurred
      ? <><span className="blur-[4px]">Verify →</span><Crown className="w-3 h-3 text-amber-500 shrink-0" /></>
      : <><span>Verify</span><ExternalLink className="w-2.5 h-2.5" /></>
    }
  </span>
);

// ── Section divider row ───────────────────────────────────────────────────────
const SectionRow = ({ label }: { label: string }) => (
  <tr>
    <td colSpan={4} className="py-2 pl-4 sm:pl-5 bg-muted/40 border-y border-border/40">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
    </td>
  </tr>
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
    return <div className="flex justify-center items-center">{v}</div>;
  };
  return (
    <tr className="border-b border-border/30 hover:bg-muted/15 transition-colors">
      <td className="py-3 pl-4 sm:pl-5 pr-3">
        <div className="flex items-start gap-2.5">
          <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium leading-snug">{label}</span>
              {isNew && (
                <Badge className="h-4 text-[9px] px-1.5 py-0 bg-violet-500/15 text-violet-500 border-violet-400/25 border hover:bg-violet-500/15">
                  NEW
                </Badge>
              )}
            </div>
            {hint && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{hint}</p>}
          </div>
        </div>
      </td>
      <td className="py-3 text-center">{cell(guest)}</td>
      <td className="py-3 text-center">{cell(free)}</td>
      <td className="py-3 pr-4 sm:pr-5 text-center">{cell(pro)}</td>
    </tr>
  );
};

// ── Value text helper ─────────────────────────────────────────────────────────
const V = ({ v, accent }: { v: string; accent?: boolean }) => (
  <span className={cn("text-xs font-semibold", accent ? "text-primary" : "text-muted-foreground")}>{v}</span>
);

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [busy, setBusy] = useState(false);
  const t = useTranslations("Pricing");

  const isPro = session?.user?.plan === "pro";
  const isFree = session?.user?.plan === "free";

  const upgrade = async (plan: "free" | "pro") => {
    if (plan === "free") {
      router.push(session ? "/dashboard" : "/auth?callbackUrl=/dashboard");
      return;
    }
    if (!session) { toast.error(t("toasts.login_req")); router.push("/auth?callbackUrl=/pricing"); return; }
    if (isPro) { toast.success("You're already Pro!"); router.push("/dashboard"); return; }
    setBusy(true);
    const tid = toast.loading(t("toasts.init_payment"));
    try {
      const res = await fetch("/api/paypal/create-subscription", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle }),
      });
      const d = await res.json();
      if (d.error) { toast.error(d.error || t("toasts.payment_fail"), { id: tid }); setBusy(false); return; }
      if (d.url) { toast.success(t("toasts.redirect"), { id: tid }); window.location.href = d.url; }
      else { toast.error(t("toasts.no_url"), { id: tid }); setBusy(false); }
    } catch { toast.error(t("toasts.conn_err"), { id: tid }); setBusy(false); }
  };

  const prices: Record<BillingCycle, { price: string; sub: string; save?: string }> = {
    weekly:  { price: "$1.99", sub: "/ week" },
    monthly: { price: "$3.99", sub: "/ month" },
    yearly:  { price: "$19.99", sub: "/ year", save: "Save 58%" },
  };
  const { price, sub, save } = prices[cycle];

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />

        <div className="py-16 px-4 flex flex-col items-center">

          {/* Header */}
          <div className="text-center max-w-lg mb-10 space-y-3">
            <Badge variant="secondary" className="text-xs">Simple Pricing</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-2">Plans & Pricing</h1>
            <p className="text-muted-foreground">Start free. Upgrade for smart features.</p>
          </div>

          {/* Billing cycle */}
          <div className="flex flex-col items-center gap-2 mb-10">
            <Tabs defaultValue="monthly" onValueChange={(v) => setCycle(v as BillingCycle)}>
              <TabsList className="h-9">
                <TabsTrigger value="weekly" className="text-xs px-4">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-4">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="text-xs px-4 gap-1.5">
                  Yearly
                  <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    -58%
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground">
              Need to change billing cycle?{" "}
              <Link href="/contact" className="text-primary underline underline-offset-2 hover:no-underline">
                Contact us
              </Link>{" "}
              — we'll apply your remaining credit.
            </p>
          </div>

          {/* ── Comparison table ── */}
          <div className="w-full max-w-3xl rounded-2xl border border-border shadow-sm overflow-hidden">
            <table className="w-full">
              {/* Plan header */}
              <thead>
                <tr className="border-b border-border">
                  {/* Feature col header */}
                  <th className="w-[46%] sm:w-[50%] bg-muted/30 py-4 pl-4 sm:pl-5 text-left align-bottom pb-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Feature
                    </span>
                  </th>

                  {/* Guest */}
                  <th className="bg-muted/20 border-l border-border/40 py-4 px-2 text-center align-top">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Guest</p>
                    <p className="text-xl font-bold">$0</p>
                    <p className="text-[10px] text-muted-foreground mb-2">No account</p>
                    <Button variant="ghost" size="sm" className="h-6 w-full text-[10px]" onClick={() => router.push("/")}>
                      Try free
                    </Button>
                  </th>

                  {/* Free */}
                  <th className="bg-muted/10 border-l border-border/40 py-4 px-2 text-center align-top">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Free</p>
                    <p className="text-xl font-bold">$0</p>
                    <p className="text-[10px] text-muted-foreground mb-2">With account</p>
                    <Button variant="outline" size="sm" className="h-6 w-full text-[10px]" onClick={() => upgrade("free")}>
                      {isFree ? "Current" : "Sign up"}
                    </Button>
                  </th>

                  {/* Pro */}
                  <th className="bg-primary/5 border-l border-primary/20 py-4 px-2 text-center align-top relative">
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-primary rounded-t-sm" />
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <Crown className="w-3 h-3 fill-current" />
                      <span className="text-[10px] uppercase tracking-wide font-bold">Pro</span>
                    </div>
                    <p className="text-xl font-bold">{price}</p>
                    <p className="text-[10px] text-muted-foreground">{sub}</p>
                    {save && (
                      <span className="inline-block bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 mb-1">
                        {save}
                      </span>
                    )}
                    <div className={save ? "mt-1" : "mt-2"}>
                      <Button
                        size="sm"
                        className="h-6 w-full text-[10px] bg-primary text-primary-foreground hover:opacity-90"
                        onClick={() => upgrade("pro")}
                        disabled={busy || isPro}
                      >
                        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : isPro ? "Current ✓" : "Upgrade →"}
                      </Button>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* ── Retention ── */}
                <SectionRow label="Storage & Retention" />
                <FRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Email retention"
                  hint="How long emails stay on our server"
                  guest={<V v="12 hours" />}
                  free={<V v="24 hours" />}
                  pro={<span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Infinity className="w-3.5 h-3.5" /> Forever</span>}
                />
                <FRow
                  icon={<Mail className="w-4 h-4" />}
                  label="Inbox capacity"
                  hint="Max emails stored per address"
                  guest={<V v="20 msgs" />}
                  free={<V v="50 msgs" />}
                  pro={<V v="Unlimited" accent />}
                />
                <FRow
                  icon={<Star className="w-4 h-4" />}
                  label="Saved inboxes"
                  hint="Addresses remembered across sessions"
                  guest={<V v="5" />}
                  free={<V v="7" />}
                  pro={<V v="Unlimited" accent />}
                />

                {/* ── Identity ── */}
                <SectionRow label="Identity & Domains" />
                <FRow
                  icon={<MailOpen className="w-4 h-4" />}
                  label="Custom email prefix"
                  hint="e.g. yourname@ditmail.info"
                  guest={false}
                  free={true}
                  pro={true}
                />
                <FRow
                  icon={<Globe className="w-4 h-4" />}
                  label="Custom domain"
                  hint="Receive mail at your own domain"
                  guest={false}
                  free={false}
                  pro={true}
                />

                {/* ── Smart Features ── */}
                <SectionRow label="Smart Features" />
                <FRow
                  icon={<MessageSquareCode className="w-4 h-4" />}
                  label="Auto OTP extraction"
                  hint="Login codes shown instantly in inbox list"
                  isNew
                  guest={false}
                  free={
                    <div className="flex flex-col items-center gap-1">
                      <OtpChip blurred />
                      <span className="text-[9px] text-muted-foreground">Pro only</span>
                    </div>
                  }
                  pro={<OtpChip blurred={false} />}
                />
                <FRow
                  icon={<Link2 className="w-4 h-4" />}
                  label="Verification link detection"
                  hint="One-click verify button extracted from email"
                  isNew
                  guest={false}
                  free={
                    <div className="flex flex-col items-center gap-1">
                      <VerifyChip blurred />
                      <span className="text-[9px] text-muted-foreground">Pro only</span>
                    </div>
                  }
                  pro={<VerifyChip blurred={false} />}
                />
                <FRow
                  icon={<Zap className="w-4 h-4" />}
                  label="Real-time delivery"
                  hint="WebSocket push — emails arrive without reloading"
                  guest={true}
                  free={true}
                  pro={true}
                />
                <FRow
                  icon={<Shield className="w-4 h-4" />}
                  label="Inbox layouts"
                  hint="Classic, split, compact, zen, mobile & more"
                  guest={<V v="2 layouts" />}
                  free={<V v="4 layouts" />}
                  pro={<V v="All 8" accent />}
                />

                {/* ── Attachments ── */}
                <SectionRow label="Attachments & Privacy" />
                <FRow
                  icon={<Paperclip className="w-4 h-4" />}
                  label="Attachment downloads"
                  guest={false}
                  free={<V v="Up to 1 MB" />}
                  pro={<V v="Up to 25 MB" accent />}
                />
                <FRow
                  icon={<Sparkles className="w-4 h-4" />}
                  label="5 GB email storage"
                  hint="Persistent email + attachment archive"
                  guest={false}
                  free={false}
                  pro={true}
                />
                <FRow
                  icon={<EyeOff className="w-4 h-4" />}
                  label="Ad-free"
                  guest={false}
                  free={false}
                  pro={true}
                />
              </tbody>
            </table>
          </div>

          {/* Billing change note */}
          <p className="mt-5 text-xs text-center text-muted-foreground max-w-md">
            Want to switch from <span className="text-foreground font-medium">weekly → monthly</span> or{" "}
            <span className="text-foreground font-medium">monthly → yearly</span>?{" "}
            <Link href="/contact" className="text-primary underline underline-offset-2 hover:no-underline inline-flex items-center gap-0.5">
              Contact us <ArrowRight className="w-3 h-3" />
            </Link>{" "}
            and we'll apply your remaining credit to the new plan.
          </p>

          {/* Pro CTA */}
          {!isPro && (
            <div className="mt-12 w-full max-w-sm">
              <div className="relative rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 pointer-events-none" />
                <Crown className="w-7 h-7 text-primary fill-current mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-0.5">Go Pro today</h3>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-3xl font-extrabold">{price}</span>
                  <span className="text-sm text-muted-foreground">{sub}</span>
                </div>
                {save && <Badge className="mb-3 bg-emerald-500 text-white border-0 text-[10px]">{save} vs monthly</Badge>}
                <p className="text-xs text-muted-foreground mb-4">
                  Auto OTP, verify links, custom domains, unlimited storage, no ads.
                </p>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 text-white border-0 shadow-md"
                  onClick={() => upgrade("pro")}
                  disabled={busy}
                >
                  {busy
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing…</>
                    : <><Crown className="w-4 h-4 mr-2 fill-current" />Upgrade to Pro</>
                  }
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2.5">
                  Cancel anytime.{" "}
                  <Link href="/contact" className="underline underline-offset-2 hover:text-foreground">
                    Need a different billing cycle?
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="w-full max-w-2xl mt-14">
            <h2 className="text-xl font-bold text-center mb-5">FAQ</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {[
                {
                  id: "otp", q: "How does auto OTP extraction work?",
                  a: "Our SMTP plugin scans the subject and body the moment an email arrives. It uses layered regex patterns to detect 4–8 digit codes near keywords like 'OTP', 'code', 'verification', and 'pin' — in any order. The code is stored alongside the message and appears instantly in your inbox list. Pro only."
                },
                {
                  id: "verify", q: "What is verification link detection?",
                  a: "When an email contains a Verify, Confirm, Activate, or Magic Link button, our server extracts the URL from the HTML. You'll see a blue Verify chip in your inbox list — click it to open the link without opening the email. Pro only."
                },
                {
                  id: "domain", q: t("faq_domain_title"), a: t("faq_domain_desc")
                },
                {
                  id: "storage", q: t("faq_storage_title"), a: t("faq_storage_desc")
                },
                {
                  id: "billing", q: "Can I change my billing cycle?",
                  a: "Yes. We support switching between weekly, monthly, and yearly plans. Contact us with your account email and we'll calculate remaining credit from your current cycle and apply it to the new one. No double charging."
                },
              ].map(({ id, q, a }) => (
                <AccordionItem key={id} value={id} className="border rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium py-3 text-left">{q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3 leading-relaxed">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

        </div>
      </div>
    </ThemeProvider>
  );
}