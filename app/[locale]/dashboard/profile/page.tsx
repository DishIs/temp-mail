// app/dashboard/profile/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Mail, Calendar, CreditCard, Loader2, Zap, ExternalLink,
  CheckCircle2, History, AlertCircle, RefreshCw, Clock, Ban,
  PauseCircle, TriangleAlert, RotateCcw
} from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UpsellModal } from "@/components/upsell-modal";
import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { Session } from "next-auth";

const DOMAIN_AFFILIATE_URL = "https://namecheap.pxf.io/c/7002059/408750/5618";

interface ScheduledChange { action: string; effective_at: string; resume_at?: string; }
interface SubscriptionData {
  provider: "paypal" | "paddle" | "manual"; subscriptionId: string; planId?: string;
  status: "TRIALING" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED" | "APPROVAL_PENDING";
  startTime: string; payerEmail?: string; payerName?: string; lastUpdated?: string;
  cancelAtPeriodEnd?: boolean; periodEnd?: string; canceledAt?: string; nextBilledAt?: string;
  scheduledChange?: ScheduledChange; pausedAt?: string;
}
interface UserProfile { wyiUserId: string; name: string; email: string; image?: string; plan: "free" | "pro"; subscription?: SubscriptionData; createdAt?: string; }
interface StorageStats { success: boolean; storageUsed: number; storageLimit: number; percentUsed: string; emailCount: number; storageUsedFormatted: string; storageLimitFormatted: string; storageRemaining: number; storageRemainingFormatted: string; message: string; }
interface PaymentLog {
  id: string; subscriptionId: string | null; paddleEventId: string | null; type: string;
  product_type: "app" | "api" | "credits"; label: string; product_name: string | null;
  billing_cycle: string | null; amount: string | null; currency: string | null; status: string | null;
  status_color: string | null; is_trial: boolean; trial_ends_at: string | null;
  credits_added: number | null; occurred_at: string; paddle_event_type: string | null;
}

function safeFormat(dateStr?: string | null, fmt = "MMM d, yyyy"): string {
  if (!dateStr) return "N/A";
  try { return format(parseISO(dateStr), fmt); } catch { return "N/A"; }
}
function safeDistanceToNow(dateStr?: string | null): string {
  if (!dateStr) return "";
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }); } catch { return ""; }
}
function statusBadgeLabel(status: SubscriptionData["status"], cancelAtPeriodEnd?: boolean): string {
  if (cancelAtPeriodEnd && status === "ACTIVE") return "Cancels soon";
  switch (status) {
    case "ACTIVE": return "Active"; case "TRIALING": return "Trial";
    case "SUSPENDED": return "Suspended"; case "CANCELLED": return "Cancelled";
    case "EXPIRED": return "Expired"; default: return status;
  }
}

// ─── ASCII layer ─────────────────────────────────────────────────────────────
const ASCII_FRAGS = [
  { x: "1%",  y: "6%",  t: "EHLO api2.freecustom.email" },
  { x: "70%", y: "4%",  t: "250 2.1.0 Ok" },
  { x: "2%",  y: "48%", t: "X-OTP: 847291" },
  { x: "71%", y: "50%", t: "RCPT TO:<inbox@ditmail.info>" },
  { x: "1%",  y: "85%", t: "AUTH PLAIN" },
  { x: "70%", y: "88%", t: "MAIL FROM:<service@example.com>" },
];
const DOT_BG = { backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.09) 1px, transparent 0)", backgroundSize: "28px 28px" } as const;

// ─── reusable row ─────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="border-t border-border py-3.5 flex items-center justify-between gap-4 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground shrink-0">{icon}{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

// ─── Cancel banner ────────────────────────────────────────────────────────────
function CancelPeriodEndBanner({ periodEnd, onManage, loading }: { periodEnd?: string; onManage: () => void; loading: boolean }) {
  const endDate  = safeFormat(periodEnd, "MMMM d, yyyy");
  const timeLeft = safeDistanceToNow(periodEnd);
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <TriangleAlert className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Your subscription is cancelled</p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            Full Pro access until <strong className="text-foreground">{endDate}</strong>{timeLeft ? ` (${timeLeft})` : ""}. After that date your account will downgrade to free.
          </p>
        </div>
      </div>
      <div className="pl-7 space-y-1.5 text-xs text-muted-foreground">
        {["Emails reduced to 20 most recent", "Emails expire after 24 hours instead of forever", "Custom domain email routing will stop", "OTP and verification link detection hidden"].map(item => (
          <div key={item} className="flex items-start gap-1.5"><span className="mt-0.5">·</span><span>{item}</span></div>
        ))}
      </div>
      <div className="pl-7 flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link href="/pricing">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reactivate subscription
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={onManage} disabled={loading}>
          {loading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Opening…</> : <><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Manage on Paddle</>}
        </Button>
      </div>
    </div>
  );
}

// ─── Post-downgrade banner ────────────────────────────────────────────────────
function PostDowngradeBanner({ sub, onManage, loading }: { sub: SubscriptionData; onManage: () => void; loading: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <History className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Previous Pro subscription</p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            Your subscription ended on <strong className="text-foreground">{safeFormat(sub.canceledAt ?? sub.periodEnd, "MMMM d, yyyy")}</strong>. View billing history and invoices on the Paddle portal.
          </p>
        </div>
      </div>
      <div className="pl-7 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onManage} disabled={loading}>
          {loading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Opening…</> : <><History className="mr-1.5 h-3.5 w-3.5" />View billing history</>}
        </Button>
        <Button size="sm" onClick={() => window.location.href = "/pricing"}>
          <Zap className="mr-1.5 h-3.5 w-3.5" />Upgrade again
        </Button>
      </div>
    </div>
  );
}

// ─── Paddle detail ─────────────────────────────────────────────────────────────
function PaddleSubscriptionDetails({ sub }: { sub: SubscriptionData }) {
  const rows: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
    { icon: <CreditCard className="h-4 w-4" />, label: "Subscription ID", value: <code className="font-mono text-xs bg-muted/60 px-2 py-0.5 rounded select-all">{sub.subscriptionId}</code> },
    { icon: <Calendar className="h-4 w-4" />, label: "Started", value: safeFormat(sub.startTime, "MMMM d, yyyy") },
    ...(!sub.cancelAtPeriodEnd && sub.nextBilledAt ? [{ icon: <RefreshCw className="h-4 w-4" />, label: "Next Billing", value: safeFormat(sub.nextBilledAt, "MMMM d, yyyy") }] : []),
    ...(sub.cancelAtPeriodEnd && sub.periodEnd ? [{ icon: <Ban className="h-4 w-4" />, label: "Pro access until", value: <strong>{safeFormat(sub.periodEnd, "MMMM d, yyyy")}</strong> }] : []),
    ...(sub.payerEmail ? [{ icon: <Mail className="h-4 w-4" />, label: "Billing Email", value: sub.payerEmail }] : []),
    ...(sub.planId ? [{ icon: <Zap className="h-4 w-4" />, label: "Price ID", value: <code className="font-mono text-xs bg-muted/60 px-2 py-0.5 rounded select-all">{sub.planId}</code> }] : []),
    ...(sub.lastUpdated ? [{ icon: <Clock className="h-4 w-4" />, label: "Last Updated", value: safeFormat(sub.lastUpdated, "MMM d, yyyy · h:mm a") }] : []),
  ];
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-mono px-2 py-0.5 rounded-md border border-border text-foreground">{statusBadgeLabel(sub.status, sub.cancelAtPeriodEnd)}</span>
        <span className="text-xs font-mono px-2 py-0.5 rounded-md border border-border text-muted-foreground">Paddle</span>
        {sub.status === "TRIALING" && <span className="text-xs text-muted-foreground">Trial ends {sub.nextBilledAt ? `on ${safeFormat(sub.nextBilledAt)}` : "soon"} — no charge until then</span>}
      </div>
      {rows.map(({ icon, label, value }) => <InfoRow key={label} icon={icon} label={label} value={value} />)}
      {sub.scheduledChange && sub.scheduledChange.action !== "cancel" && (
        <div className="flex items-start gap-3 mt-3 p-4 rounded-lg border border-border bg-muted/20">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground capitalize">Scheduled {sub.scheduledChange.action}</p>
            <p className="text-muted-foreground text-xs mt-0.5">Effective {safeFormat(sub.scheduledChange.effective_at, "MMMM d, yyyy")}{sub.scheduledChange.resume_at && <> · Resumes {safeFormat(sub.scheduledChange.resume_at, "MMMM d, yyyy")}</>}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const t        = useTranslations("Profile");

  const [loading, setLoading]             = useState(true);
  const [userData, setUserData]           = useState<UserProfile | null>(null);
  const [storageData, setStorageData]     = useState<StorageStats | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen]   = useState(false);
  const [upsellFeature]                   = useState("Pro Plan");
  const [paymentLogs, setPaymentLogs]     = useState<PaymentLog[]>([]);
  const [paymentLogsLoading, setPaymentLogsLoading] = useState(false);
  const [paymentLogsType, setPaymentLogsType]       = useState<"app" | "api" | "credits" | "">("");
  const [paymentLogsOffset, setPaymentLogsOffset]   = useState(0);
  const PAYMENT_LOGS_LIMIT = 20;
  const [apiPlan, setApiPlan]               = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading]       = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");

  useEffect(() => { if (status === "unauthenticated") router.push("/auth"); }, [status, router]);
  useEffect(() => {
    if (!userData?.wyiUserId) return;
    fetch("/api/user/api-status").then(r => r.ok ? r.json() : null).then(d => d?.plan != null && setApiPlan(d.plan)).catch(() => {});
  }, [userData?.wyiUserId]);
  useEffect(() => { if (status === "authenticated") { fetchUserData(); fetchStorageData(); } }, [status]);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user/delete-account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.message || t("toasts.fetch_error")); return; }
      setDeleteDialogOpen(false);
      setDeleteEmailInput("");
      toast.success("Account deletion scheduled. Check your email to cancel.");
      router.replace("/account-deletion-scheduled");
    } catch { toast.error(t("toasts.fetch_error")); }
    finally { setDeleteLoading(false); }
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user/me"); const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
      if (data.success && data.user) setUserData(data.user);
      else toast.error(t("toasts.fetch_error"));
    } catch (error) { console.error("Failed to load profile data", error); toast.error(t("toasts.load_error")); }
  };

  const fetchStorageData = async () => {
    try {
      const res = await fetch("/api/user/storage"); const data = await res.json();
      if (data.success) setStorageData(data);
    } catch (error) { console.error("Failed to load storage stats", error); }
    finally { setLoading(false); }
  };

  const fetchPaymentLogs = useCallback(async () => {
    if (!userData?.wyiUserId) return;
    setPaymentLogsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAYMENT_LOGS_LIMIT)); params.set("offset", String(paymentLogsOffset));
      if (paymentLogsType) params.set("type", paymentLogsType);
      const res = await fetch(`/api/user/payment-logs?${params.toString()}`); const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load payment logs");
      const logs = Array.isArray(data) ? data : (data.logs ?? data.paymentLogs ?? []);
      setPaymentLogs(Array.isArray(logs) ? logs : []);
    } catch (e) { console.error("Failed to load payment logs", e); toast.error(t("billing.payment_logs_error")); setPaymentLogs([]); }
    finally { setPaymentLogsLoading(false); }
  }, [userData?.wyiUserId, paymentLogsType, paymentLogsOffset, t]);

  useEffect(() => { if (userData?.wyiUserId) fetchPaymentLogs(); }, [userData?.wyiUserId, fetchPaymentLogs]);

  const handleManageSubscription = async () => {
    const sub = userData?.subscription;
    const hasPaddleSub = sub?.provider === "paddle" || (!isPro && sub?.subscriptionId && sub?.status === "CANCELLED");
    if (hasPaddleSub) {
      setPortalLoading(true);
      try {
        const res = await fetch("/api/paddle/portal-session", { method: "POST" }); const data = await res.json();
        if (!res.ok || !data.url) { toast.error("Could not open billing portal."); return; }
        window.open(data.url, "_blank");
      } catch { toast.error("Could not open billing portal."); }
      finally { setPortalLoading(false); }
    } else if (sub?.provider === "paypal") {
      window.open(`https://www.paypal.com/myaccount/autopay/connect/${sub.subscriptionId}`, "_blank");
    } else { router.push("/pricing"); }
  };

  const getProviderDetails = (session: Session) => {
    if (!session.user) return { label: "Unknown", icon: null };
    const image = session.user.image || "";
    if (image.includes("googleusercontent.com")) return { label: "Google", icon: <FaGoogle className="w-4 h-4 text-muted-foreground" /> };
    if (image.includes("githubusercontent.com"))  return { label: "GitHub", icon: <FaGithub className="w-4 h-4 text-muted-foreground" /> };
    return { label: "Email", icon: <Mail className="h-4 w-4 text-muted-foreground" /> };
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPro                   = userData?.plan === "pro";
  const sub                     = userData?.subscription;
  const subStatus               = sub?.status ?? "NONE";
  const isCancellingButStillPro = isPro && sub?.cancelAtPeriodEnd === true;
  const isDowngradedFromPaddle  = !isPro && sub?.provider === "paddle" && sub?.status === "CANCELLED";
  const isActiveOrTrialing      = (subStatus === "ACTIVE" || subStatus === "TRIALING") && !isCancellingButStillPro;
  const paymentProviderName     = sub?.provider === "paypal" ? "PayPal" : sub?.provider === "paddle" ? "Paddle" : "N/A";
  const providerDetails         = session ? getProviderDetails(session) : { label: "Unknown", icon: null };
  const percentUsed             = storageData ? parseFloat(storageData.percentUsed) : 0;
  const usageText               = storageData ? `${storageData.storageUsedFormatted || storageData.message} / ${storageData.storageLimitFormatted || storageData.message}` : "Loading...";

  // Determine active subscriptions for deletion warning
  const hasActiveAppSub = isPro && sub && (sub.status === "ACTIVE" || sub.status === "TRIALING");
  const hasActiveApiSub = apiPlan && apiPlan !== "free";
  const hasAnyActiveSub = hasActiveAppSub || hasActiveApiSub;
  const emailConfirmed  = deleteEmailInput.trim().toLowerCase() === (userData?.email ?? "").trim().toLowerCase();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background" style={DOT_BG}>
        {/* ASCII bg */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
          {ASCII_FRAGS.map((f, i) => <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap" style={{ left: f.x, top: f.y, opacity: 0.035 }}>{f.t}</span>)}
        </div>

        <AppHeader initialSession={session} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Your account</p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
            </div>
            {!isPro && (
              <Button onClick={() => router.push("/pricing")} size="sm">
                <Zap className="mr-2 h-4 w-4" />{t("upgrade_btn")}
              </Button>
            )}
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="h-auto w-full justify-start bg-transparent border-0 border-b border-border rounded-none gap-0 p-0 mb-10">
              {[
                { value: "overview", label: t("tabs.overview") },
                { value: "billing",  label: t("tabs.billing"), dot: isCancellingButStillPro },
                { value: "api",      label: "API" },
                { value: "settings", label: t("tabs.settings") },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}
                  className="relative rounded-none px-4 pb-3 pt-0 text-sm border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none">
                  {tab.label}
                  {tab.dot && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground inline-block align-middle" />}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── OVERVIEW ─────────────────────────────────────────────── */}
            <TabsContent value="overview" className="mt-0">
              <div className="grid gap-10 lg:grid-cols-3">
                {/* Profile card */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-14 w-14 border border-border">
                      <AvatarImage src={session?.user?.image || ""} />
                      <AvatarFallback className="text-base bg-muted">{userData?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-base font-semibold text-foreground">{userData?.name}</p>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md border border-border text-foreground uppercase tracking-wider">
                          {isPro ? t("overview.plan_pro") : t("overview.plan_free")}
                        </span>
                        {isCancellingButStillPro && (
                          <span className="text-xs text-muted-foreground">Cancels {safeFormat(sub?.periodEnd)}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{userData?.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-border" />
                  <InfoRow icon={<CreditCard className="h-4 w-4" />} label={t("overview.user_id")}
                    value={<code className="font-mono text-xs bg-muted/60 px-2 py-0.5 rounded select-all truncate max-w-[12rem] block">{userData?.wyiUserId || "N/A"}</code>} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label={t("overview.member_since")}
                    value={safeFormat(userData?.createdAt, "MMMM d, yyyy")} />
                  <InfoRow icon={providerDetails.icon} label={t("overview.login_method")}
                    value={providerDetails.label} />
                </div>

                {/* Storage */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">{t("overview.usage_title")}</p>
                  <div className="border-t border-border mt-4" />
                  <div className="pt-5 space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">{t("overview.storage_used")}</span>
                        <span className="font-medium text-foreground tabular-nums">{percentUsed.toFixed(2)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-foreground rounded-full transition-all duration-500" style={{ width: `${percentUsed}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{usageText}</p>
                    </div>
                    <InfoRow icon={null} label="Emails stored" value={storageData?.emailCount ?? 0} />
                    <InfoRow icon={null} label={t("overview.daily_emails")} value={t("overview.unlimited")} />
                    {!isPro && <p className="text-xs text-muted-foreground pt-2 border-t border-border"><span className="font-medium text-foreground">{t("overview.note_label")}</span> {t("overview.note_text")}</p>}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── BILLING ──────────────────────────────────────────────── */}
            <TabsContent value="billing" className="mt-0 space-y-10">
              {/* Subscription summary */}
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">{t("billing.sub_title")}</p>
                <div className="border-t border-border mt-4 pt-5">
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <h3 className="text-2xl font-bold text-foreground capitalize">{t("billing.plan_display", { plan: userData?.plan ?? "free" })}</h3>
                    {sub && <span className="text-xs font-mono px-2 py-0.5 rounded-md border border-border text-foreground">{statusBadgeLabel(sub.status, sub.cancelAtPeriodEnd)}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{isPro ? t("billing.feat_unlocked") : t("billing.feat_basic")}</p>

                  {isCancellingButStillPro && <div className="mt-5"><CancelPeriodEndBanner periodEnd={sub?.periodEnd} onManage={handleManageSubscription} loading={portalLoading} /></div>}

                  {isPro && sub?.provider === "paddle" && (
                    <div className="mt-6"><Separator className="mb-6" /><PaddleSubscriptionDetails sub={sub} /></div>
                  )}

                  {isPro && sub?.provider === "paypal" && (
                    <div className="mt-6">
                      <Separator className="mb-4" />
                      <InfoRow icon={<CreditCard className="h-4 w-4" />} label="Subscription ID" value={<code className="font-mono text-xs bg-muted/60 px-2 py-0.5 rounded select-all">{sub.subscriptionId}</code>} />
                      <InfoRow icon={<Calendar className="h-4 w-4" />} label="Started" value={safeFormat(sub.startTime, "MMMM d, yyyy")} />
                      {sub.payerEmail && <InfoRow icon={<Mail className="h-4 w-4" />} label="PayPal Email" value={sub.payerEmail} />}
                    </div>
                  )}

                  {isDowngradedFromPaddle && sub && <div className="mt-5"><PostDowngradeBanner sub={sub} onManage={handleManageSubscription} loading={portalLoading} /></div>}

                  <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-3">
                    {isPro && isActiveOrTrialing && (
                      <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                        {portalLoading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Opening…</> : <><ExternalLink className="mr-1.5 h-3.5 w-3.5" />{t("billing.manage_btn")}</>}
                      </Button>
                    )}
                    {!isPro && !isDowngradedFromPaddle && (
                      <Button size="sm" onClick={() => router.push("/pricing")}>{t("billing.upgrade_btn")}</Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction history */}
              <div>
                <div className="flex flex-wrap items-center gap-4 mb-1">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{t("billing.trans_title")}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t("billing.trans_desc", { provider: paymentProviderName })}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground">{t("billing.payment_logs_filter")}</span>
                    <select
                      value={paymentLogsType}
                      onChange={e => { setPaymentLogsType((e.target.value || "") as "" | "app" | "api" | "credits"); setPaymentLogsOffset(0); }}
                      className="h-8 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                    >
                      <option value="">{t("billing.filter_all")}</option>
                      <option value="app">{t("billing.filter_app")}</option>
                      <option value="api">{t("billing.filter_api")}</option>
                      <option value="credits">{t("billing.filter_credits")}</option>
                    </select>
                  </div>
                </div>
                <div className="border-t border-border mt-4" />

                {paymentLogsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : paymentLogs.length === 0 ? (
                  <div className="py-12 text-center">
                    {isPro || isDowngradedFromPaddle ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          {isDowngradedFromPaddle ? "Your invoices are available on the Paddle customer portal." : t("billing.active_desc", { provider: paymentProviderName })}
                        </p>
                        <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                          {portalLoading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Opening…</> : isDowngradedFromPaddle ? <><History className="mr-1.5 h-3.5 w-3.5" />View billing history</> : <><ExternalLink className="mr-1.5 h-3.5 w-3.5" />{sub?.provider === "paddle" ? "Manage on Paddle →" : t("billing.view_invoice", { provider: "PayPal" })}</>}
                        </Button>
                      </>
                    ) : <p className="text-sm text-muted-foreground">{t("billing.no_trans_desc")}</p>}
                  </div>
                ) : (
                  <>
                    {paymentLogs.map(log => (
                      <div key={log.id} className="border-t border-border py-4 flex justify-between items-start gap-4 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{log.label}</p>
                          {log.product_name && <p className="text-xs text-muted-foreground mt-0.5">{log.product_name}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">{safeFormat(log.occurred_at, "MMM d, yyyy · HH:mm")}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {log.amount && <span className="font-medium">{log.amount}</span>}
                          {log.credits_added != null && log.credits_added > 0 && <span className="text-xs text-muted-foreground">+{log.credits_added.toLocaleString()} credits</span>}
                          {log.status && <span className={`text-xs px-2 py-0.5 rounded-full border border-border ${log.status_color === "green" ? "text-foreground" : "text-muted-foreground"}`}>{log.status}</span>}
                        </div>
                      </div>
                    ))}
                    {paymentLogs.length >= PAYMENT_LOGS_LIMIT && (
                      <div className="flex justify-center gap-2 pt-4 border-t border-border">
                        <Button variant="outline" size="sm" disabled={paymentLogsOffset === 0} onClick={() => setPaymentLogsOffset(o => Math.max(0, o - PAYMENT_LOGS_LIMIT))}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setPaymentLogsOffset(o => o + PAYMENT_LOGS_LIMIT)}>Next</Button>
                      </div>
                    )}
                    <div className="pt-4 border-t border-border">
                      <Button variant="ghost" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                        {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                        <span className="ml-1.5">{sub?.provider === "paddle" ? "Manage on Paddle" : t("billing.view_invoice", { provider: "PayPal" })}</span>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* ── API ──────────────────────────────────────────────────── */}
            <TabsContent value="api" className="mt-0">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">API Access</p>
              <div className="border-t border-border mt-4" />
              {apiPlan && apiPlan !== "free" ? (
                <div className="pt-5">
                  <p className="text-sm text-muted-foreground mb-1">Your API plan</p>
                  <p className="text-lg font-semibold text-foreground capitalize mb-5">{apiPlan}</p>
                  <Button asChild size="sm"><Link href="/api/dashboard"><ExternalLink className="mr-2 h-4 w-4" />Go to API Dashboard</Link></Button>
                </div>
              ) : (
                <div className="pt-5 max-w-lg">
                  <p className="text-base font-semibold text-foreground mb-2">Build with our API</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">Disposable inboxes, OTP extraction, and WebSocket delivery for CI and test automation.</p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="sm"><Link href="/api">Get API key</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link href="/api/pricing">API pricing</Link></Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── SETTINGS ─────────────────────────────────────────────── */}
            <TabsContent value="settings" className="mt-0">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">{t("settings.sec_title")}</p>
              <p className="text-sm text-muted-foreground">{t("settings.sec_desc")}</p>
              <div className="border-t border-border mt-4" />

              <div className="py-5 border-t border-border flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.2fa_title")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("settings.2fa_desc")}</p>
                </div>
                <Button variant="outline" size="sm" disabled>{t("settings.coming_soon")}</Button>
              </div>

              <div className="py-5 border-t border-border flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.del_title")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("settings.del_desc")}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => { setDeleteEmailInput(""); setDeleteDialogOpen(true); }}>{t("settings.del_btn")}</Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Affiliate */}
          {!isPro && (
            <div className="mt-16 pt-6 border-t border-border text-center">
              <a rel="sponsored" href={DOMAIN_AFFILIATE_URL} target="_blank"
                className="text-xs text-muted-foreground underline underline-offset-4 decoration-border hover:text-foreground hover:decoration-foreground transition-colors inline-flex items-center gap-1">
                Get your .COM domain (from $0.99) via Namecheap →
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <UpsellModal isOpen={isUpsellOpen} onClose={() => setIsUpsellOpen(false)} featureName={upsellFeature} />

        <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteEmailInput(""); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("settings.del_title")}</DialogTitle>
              <DialogDescription>
                Your account will be scheduled for deletion. You have 7 days to cancel from your email or by logging in. After 7 days, all data will be permanently removed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
              {/* Active subscription warning */}
              {hasAnyActiveSub && (
                <div className="rounded-md border border-border bg-muted/20 p-3 space-y-1.5">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                    You have an active subscription
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Deleting your account will <strong className="text-foreground">not</strong> automatically cancel your{" "}
                    {[hasActiveAppSub && "Pro", hasActiveApiSub && "API"].filter(Boolean).join(" and ")} subscription
                    {hasActiveAppSub && hasActiveApiSub ? "s" : ""}. You will continue to be billed.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Please cancel first:{" "}
                    {hasActiveAppSub && (
                      <>go to <strong className="text-foreground">Profile → Billing → Manage Subscription</strong> and cancel from Paddle&apos;s customer portal</>
                    )}
                    {hasActiveAppSub && hasActiveApiSub && ", and "}
                    {hasActiveApiSub && (
                      <>cancel your API subscription from the <strong className="text-foreground">same Paddle portal</strong></>
                    )}
                    {". "}
                    Or <Link href="/contact" className="underline underline-offset-2 text-foreground hover:opacity-80" onClick={() => setDeleteDialogOpen(false)}>contact us</Link> for help.
                  </p>
                </div>
              )}

              {/* Email confirmation */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Type <strong className="text-foreground select-all">{userData?.email}</strong> to confirm
                </p>
                <Input
                  type="email"
                  placeholder={userData?.email ?? "your@email.com"}
                  value={deleteEmailInput}
                  onChange={e => setDeleteEmailInput(e.target.value)}
                  className="h-9 text-sm"
                  autoComplete="off"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteEmailInput(""); }} disabled={deleteLoading}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading || !emailConfirmed}>
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("settings.del_btn")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ThemeProvider>
  );
}