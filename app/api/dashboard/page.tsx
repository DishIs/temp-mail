// app/api/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  FIX: properly render cancelled / cancelling subscription states
//    • statusBadge "cancelled"  → red badge + "Your plan has ended" banner
//    • statusBadge "cancelling" → amber badge + "Cancels on <date>" notice
//    • Plan header always shows effective plan (free if period elapsed)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle, Check, Copy, Loader2, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ApiCustomDomainManager } from "@/components/dashboard/ApiCustomDomainManager";
import { CUSTOM_DOMAIN_PLANS } from "@/lib/api-plans-client";

// ─── types ────────────────────────────────────────────────────────────────────
interface PlanInfo { name?: string; label?: string; price?: string; status_badge?: string; }
interface UsageInfo {
  requests_this_month?: number; requests_limit?: number; requests_remaining?: number;
  percent_used?: string; credits_remaining?: number; resets_approx?: string;
}
interface SubscriptionInfo {
  subscription_id?: string;
  status?: string;
  cancel_at_period_end?: boolean;
  period_end?: string | null;
  canceled_at?: string | null;
  next_billed_at?: string | null;
  payer_email?: string | null;
}
interface ApiStatusData {
  plan?: PlanInfo & { name?: string };
  subscription?: SubscriptionInfo | null;
  usage?: UsageInfo;
  rate_limits?: { requests_per_second?: number; requests_per_month?: number };
  features?: Record<string, boolean | number | string>;
  inboxes?: { list?: string[]; count?: number };
  app_inboxes?: { list?: string[]; count?: number };
  api_inboxes?: { list?: string[]; count?: number };
  upsell?: { nudges?: string[]; next_plan?: { name?: string; label?: string; price?: string; unlocks?: string[] }; credit_packages?: Array<{ price?: string; requests?: string; label?: string }> };
  all_plans?: Array<Record<string, unknown>>;
}
interface ApiStatusResponse {
  success?: boolean; data?: ApiStatusData; plan?: string;
  usage?: { used?: number; limit?: number; resetsAt?: string; credits?: number; rateLimitPerSec?: number };
  apiInboxes?: string[];
}
interface ApiKeyItem { id: string; prefix: string; name?: string; active?: boolean; createdAt?: string; lastUsedAt?: string; revokedAt?: string | null; }
function normalizeApiKeysList(raw: unknown): ApiKeyItem[] {
  const r = raw as { data?: unknown[]; keys?: unknown[] };
  const arr = Array.isArray(r?.data) ? r.data : Array.isArray(r?.keys) ? r.keys : [];
  return arr.map((item: unknown) => {
    const o = item as Record<string, unknown>;
    return { id: String(o._id ?? o.id ?? ""), prefix: String(o.keyPrefix ?? o.prefix ?? ""), name: o.name as string | undefined, active: o.active as boolean | undefined, createdAt: o.createdAt as string | undefined, lastUsedAt: o.lastUsedAt as string | undefined, revokedAt: o.revokedAt as string | null | undefined };
  });
}
interface ApiKeysResponse { success?: boolean; data?: Record<string, unknown>[]; keys?: ApiKeyItem[]; count?: number; limit?: number; }
interface PaymentLogItem { id: string; type?: string; product_type?: "app" | "api" | "credits"; label?: string; product_name?: string | null; amount?: string | null; currency?: string | null; status?: string | null; status_color?: string | null; credits_added?: number | null; occurred_at?: string | null; created_at?: string | null; }
interface PaymentLogsResponse { success?: boolean; data?: PaymentLogItem[]; logs?: PaymentLogItem[]; }

// ─── ASCII bg ─────────────────────────────────────────────────────────────────
const ASCII_FRAGS = [
  { x: "1%",  y: "8%",  t: "EHLO api2.freecustom.email" },
  { x: "70%", y: "5%",  t: "250-STARTTLS" },
  { x: "2%",  y: "45%", t: "X-OTP: 847291" },
  { x: "72%", y: "42%", t: "RCPT TO:<inbox@ditapi.info>" },
  { x: "1%",  y: "80%", t: "AUTH PLAIN" },
  { x: "70%", y: "78%", t: "MAIL FROM:<service@example.com>" },
];
const DOT_BG = { backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.09) 1px, transparent 0)", backgroundSize: "28px 28px" } as const;

function StatTile({ label, value, sub, children }: { label: string; value?: string | number; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      {value !== undefined && <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>}
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {children}
    </div>
  );
}

// ── Status badge renderer ─────────────────────────────────────────────────────
function StatusBadge({ badge }: { badge: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    active:        { label: "active",      cls: "text-foreground bg-muted/30" },
    trialing:      { label: "trialing",    cls: "text-foreground bg-muted/30" },
    cancelling:    { label: "cancelling",  cls: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800" },
    cancelled:     { label: "cancelled",   cls: "text-destructive bg-destructive/5 border-destructive/30" },
    payment_failed:{ label: "payment failed", cls: "text-destructive bg-destructive/5 border-destructive/30" },
    free:          { label: "free",        cls: "text-muted-foreground bg-muted/20" },
  };
  const { label, cls } = cfg[badge] ?? { label: badge, cls: "text-muted-foreground bg-muted/20" };
  return (
    <span className={`text-xs font-mono px-2 py-1 rounded-md border border-border ${cls}`}>
      {label}
    </span>
  );
}

// ── Subscription notice banner ────────────────────────────────────────────────
function SubscriptionNotice({ badge, periodEnd }: { badge: string; periodEnd?: string | null }) {
  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : null;

  if (badge === "cancelled") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Your plan has ended</p>
          <p className="text-destructive/80 mt-0.5">
            You're now on the Free plan.{" "}
            <Link href="/api/pricing" className="underline underline-offset-2">Upgrade to restore access.</Link>
          </p>
        </div>
      </div>
    );
  }

  if (badge === "cancelling" && periodEnd) {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Subscription cancels {fmtDate(periodEnd)}</p>
          <p className="opacity-80 mt-0.5">
            You have full access until then.{" "}
            <Link href="/api/pricing" className="underline underline-offset-2">Resubscribe to keep your plan.</Link>
          </p>
        </div>
      </div>
    );
  }

  if (badge === "payment_failed") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Payment failed — access suspended</p>
          <p className="text-destructive/80 mt-0.5">Please update your payment method to restore access.</p>
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Dashboard Content
// ─────────────────────────────────────────────────────────────────────────────

function ApiDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiStatus, setApiStatus] = useState<ApiStatusResponse | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLogItem[]>([]);
  const [inboxes, setInboxes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyModal, setNewKeyModal] = useState<{ key: string; name: string; note?: string } | null>(null);
  const [showNameKeyDialog, setShowNameKeyDialog] = useState(false);
  const [newKeyNameInput, setNewKeyNameInput] = useState("");
  const [generateLoading, setGenerateLoading] = useState(false);
  const [revokePrefix, setRevokePrefix] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const data = apiStatus?.data ?? (apiStatus as ApiStatusData);
  const planName = typeof data?.plan === "object" ? (data.plan as PlanInfo).name : (apiStatus?.plan ?? data?.plan ?? "free");
  const planLabel = typeof data?.plan === "object" ? (data.plan as PlanInfo).label : null;
  const planPrice = typeof data?.plan === "object" ? (data.plan as PlanInfo).price : null;
  const statusBadge = (typeof data?.plan === "object" ? (data.plan as PlanInfo).status_badge : null) ?? "free";

  // Subscription detail (for cancelling date, etc.)
  const subInfo: SubscriptionInfo | null = data?.subscription ?? null;
  const periodEnd = subInfo?.period_end ?? null;

  type UsageLike = UsageInfo & { used?: number; limit?: number; resetsAt?: string; credits?: number; rateLimitPerSec?: number };
  const usage = (data?.usage ?? apiStatus?.usage) as UsageLike | undefined;
  const used = usage?.requests_this_month ?? usage?.used ?? 0;
  const limit = usage?.requests_limit ?? usage?.limit ?? 5000;
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  const credits = usage?.credits_remaining ?? usage?.credits ?? 0;
  const features = data?.features ?? {};
  const upsell = data?.upsell;
  const resetsAt = usage?.resets_approx ?? usage?.resetsAt;
  const rateLimitSec = data?.rate_limits?.requests_per_second ?? usage?.rateLimitPerSec ?? 1;

  // Whether the current API plan supports custom domains
  const canUseCustomDomains = CUSTOM_DOMAIN_PLANS.includes(planName as string);

  // Show upsell for free / cancelled / low-tier plans
  const showUpsell = planName === "free" || planName === "developer" || statusBadge === "cancelled";

  const fetchAll = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true); setError(null);
    try {
      const [statusRes, keysRes, logsRes] = await Promise.all([
        fetch("/api/user/api-status"), fetch("/api/user/api-keys"),
        fetch("/api/user/payment-logs?type=api&limit=20"),
      ]);
      if (statusRes.ok) {
        const d: ApiStatusResponse = await statusRes.json();
        setApiStatus(d);
        const dat = d?.data;
        const sources: string[][] = [];
        if (Array.isArray(dat?.api_inboxes?.list)) sources.push(dat.api_inboxes.list);
        if (Array.isArray(dat?.inboxes?.list)) sources.push(dat.inboxes!.list);
        const legacy = (d as { apiInboxes?: string[] }).apiInboxes;
        if (Array.isArray(legacy)) sources.push(legacy);
        setInboxes(Array.from(new Set(sources.flat())));
      } else { const err = await statusRes.json().catch(() => ({})); setError(err.message || "Failed to load API status."); }
      if (keysRes.ok) { const d: ApiKeysResponse = await keysRes.json(); setApiKeys(normalizeApiKeysList(d)); }
      if (logsRes.ok) { const d: PaymentLogsResponse = await logsRes.json(); const list = d?.data ?? d?.logs ?? []; setPaymentLogs(Array.isArray(list) ? list : []); }
    } catch (e) { console.error(e); setError("Failed to load dashboard."); }
    finally { setLoading(false); }
  }, [session?.user?.id]);

  useEffect(() => { if (status === "unauthenticated") router.push("/auth?callbackUrl=/api/dashboard"); }, [status, router]);
  useEffect(() => { if (session?.user?.id) fetchAll(); }, [session?.user?.id, fetchAll]);
  useEffect(() => { if (!searchParams.get("checkout") || !session?.user?.id) return; const t = setTimeout(() => fetchAll(), 800); return () => clearTimeout(t); }, [searchParams, session?.user?.id, fetchAll]);

  const handleGenerateKey = async (name: string) => {
    const keyName = (name || "Default").trim() || "Default";
    setGenerateLoading(true); setError(null);
    try {
      const res = await fetch("/api/user/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: keyName }) });
      const dat = await res.json();
      if (!res.ok) throw new Error(dat.message || dat.error || "Failed to create key.");
      const keyPayload = Array.isArray(dat.data) ? dat.data[0] : dat.data ?? dat;
      const keyValue = keyPayload?.key ?? dat.key;
      if (keyValue) { setNewKeyModal({ key: keyValue, name: keyPayload?.name ?? dat.name ?? keyName, note: dat.message ?? dat.note }); setShowNameKeyDialog(false); setNewKeyNameInput(""); }
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create key."); }
    finally { setGenerateLoading(false); }
  };

  const handleRevoke = async (keyId: string) => {
    setRevokePrefix(keyId); setError(null);
    try {
      const res = await fetch("/api/user/api-keys", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyId }) });
      const dat = await res.json();
      if (!res.ok) throw new Error(dat.message || "Failed to revoke key.");
      fetchAll();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to revoke key."); }
    finally { setRevokePrefix(null); }
  };

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );

  const dataReady = !loading && apiStatus != null;
  const TABS = ["overview", "keys", "domains", "usage", "billing"] as const;

  return (
    <>
      <div className="min-h-screen bg-background" style={DOT_BG}>
        {/* ASCII bg layer */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
          {ASCII_FRAGS.map((f, i) => (
            <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap" style={{ left: f.x, top: f.y, opacity: 0.035 }}>{f.t}</span>
          ))}
        </div>

        {/* Sticky top bar */}
        <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <Link href="/api" className="hover:text-foreground transition-colors">API</Link>
                <span className="text-border">/</span>
                <span className="text-foreground font-semibold">Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm"><Link href="/api/playground">Playground</Link></Button>
                <Button asChild variant="ghost" size="sm"><Link href="/api">Overview</Link></Button>
                <Button asChild size="sm"><Link href="/api/pricing">Upgrade</Link></Button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
          {/* Page header */}
          <div className="mb-10">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">API Dashboard</p>
            <div className="flex flex-wrap items-end gap-4">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {planLabel ?? planName ?? "Free"}
                {planPrice && planPrice !== "Free" && planPrice !== "free" && (
                  <span className="ml-2 text-lg font-normal text-muted-foreground">{planPrice}</span>
                )}
              </h1>
              <StatusBadge badge={statusBadge} />
            </div>
          </div>

          {/* Subscription state notice */}
          {dataReady && (
            <SubscriptionNotice badge={statusBadge} periodEnd={periodEnd} />
          )}

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <Tabs defaultValue="overview" className="w-full">
            {/* Tab strip */}
            <TabsList className="h-auto w-full justify-start bg-transparent border-0 border-b border-border rounded-none gap-0 p-0 mb-8 overflow-x-auto">
              {TABS.map(tab => (
                <TabsTrigger key={tab} value={tab}
                  className="rounded-none px-4 pb-3 pt-0 text-sm border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-none capitalize whitespace-nowrap">
                  {tab === "keys" ? "API Keys" : tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {!dataReady ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* ── OVERVIEW ─────────────────────────────────────────── */}
                <TabsContent value="overview" className="mt-0">
                  <div className="grid gap-px bg-border sm:grid-cols-3 rounded-lg overflow-hidden mb-8">
                    <div className="bg-background px-6 py-6">
                      <StatTile label="Requests this month" value={Number(used).toLocaleString()} sub={`of ${Number(limit).toLocaleString()} monthly`}>
                        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        {resetsAt && <p className="text-xs text-muted-foreground mt-1.5">Resets {new Date(resetsAt).toLocaleDateString()}</p>}
                      </StatTile>
                    </div>
                    <div className="bg-background px-6 py-6">
                      <StatTile label="Credits balance" value={Number(credits).toLocaleString()} sub="Never expire · used after quota" />
                    </div>
                    <div className="bg-background px-6 py-6">
                      <StatTile label="Rate limit" value={`${rateLimitSec} req/s`} sub="Concurrent request ceiling" />
                    </div>
                  </div>

                  {/* Registered inboxes */}
                  <div className="mb-8">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Registered Inboxes</p>
                    <p className="text-sm text-muted-foreground mb-5">Addresses you can use with the API</p>
                    <div className="border-t border-border" />
                    <p className="text-sm text-muted-foreground mt-5 mb-4">
                      To register inboxes, use the API endpoint. See{" "}
                      <Link href="/api/docs/inboxes" className="underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors">
                        API docs → Inboxes
                      </Link>.
                    </p>
                    {inboxes.length === 0
                      ? <p className="text-sm text-muted-foreground py-4 border-t border-border">No inboxes registered yet.</p>
                      : inboxes.map(addr => (
                        <div key={addr} className="border-t border-border py-3 font-mono text-sm text-foreground">{addr}</div>
                      ))
                    }
                  </div>

                  {/* Feature flags */}
                  <div className="mb-8">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Feature flags</p>
                    <p className="text-sm text-muted-foreground mb-5">Based on your current plan</p>
                    <div className="border-t border-border" />
                    {["OTP Extraction", "WebSocket", "Attachments", "Custom Domains"].map(f => {
                      const key = f.toLowerCase().replace(" ", "_");
                      const v = features[key] ?? features[key.replace("_", "")];
                      const enabled = v === true || (typeof v === "number" && v > 0) || (typeof v === "string" && v !== "false");
                      return (
                        <div key={f} className="border-t border-border py-3 flex items-center justify-between text-sm">
                          <span className="text-foreground">{f}</span>
                          {enabled ? <Check className="h-4 w-4 text-foreground" /> : <span className="h-4 w-4 rounded-full border border-border block" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Upsell */}
                  {showUpsell && upsell && (
                    <div className="rounded-lg border border-border bg-muted/20 p-6">
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Upgrade available</p>
                      <p className="text-base font-semibold text-foreground mb-1">{upsell.next_plan?.label} — {upsell.next_plan?.price}</p>
                      {upsell.nudges?.length ? (
                        <ul className="text-sm text-muted-foreground mt-3 space-y-1.5 mb-5">
                          {upsell.nudges.slice(0, 2).map((n, i) => (
                            <li key={i} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />{n}</li>
                          ))}
                        </ul>
                      ) : null}
                      <Button asChild size="sm"><Link href="/api/pricing">View API pricing</Link></Button>
                    </div>
                  )}
                </TabsContent>

                {/* ── API KEYS ──────────────────────────────────────────── */}
                <TabsContent value="keys" className="mt-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">API Keys</p>
                      <p className="text-sm text-muted-foreground mt-1">{apiKeys.length} / 5 keys · Only prefixes are shown; raw keys are never stored.</p>
                    </div>
                    {apiKeys.length < 5 && (
                      <Button size="sm" onClick={() => setShowNameKeyDialog(true)} disabled={generateLoading}>
                        {generateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "New key"}
                      </Button>
                    )}
                  </div>
                  <div className="border-t border-border mt-5" />
                  {apiKeys.map(k => (
                    <div key={k.id} className="border-t border-border py-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{k.name ?? "Unnamed"}</p>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">{k.prefix}…</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                          {k.createdAt && <span>Created {new Date(k.createdAt).toLocaleDateString()}</span>}
                          {k.lastUsedAt && <span>Last used {new Date(k.lastUsedAt).toLocaleDateString()}</span>}
                          {k.active === false && <span className="text-foreground/50">Revoked</span>}
                        </div>
                      </div>
                      {k.active !== false && (
                        <button disabled={revokePrefix === k.id} onClick={() => handleRevoke(k.id)} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors">
                          {revokePrefix === k.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  ))}
                  {apiKeys.length === 0 && <p className="py-8 text-sm text-muted-foreground text-center">No API keys yet. Generate one above.</p>}
                </TabsContent>

                {/* ── DOMAINS ──────────────────────────────────────────── */}
                <TabsContent value="domains" className="mt-0">
                  <ApiCustomDomainManager canUseCustomDomains={canUseCustomDomains} />
                </TabsContent>

                {/* ── USAGE ────────────────────────────────────────────── */}
                <TabsContent value="usage" className="mt-0">
                  <div className="grid gap-px bg-border sm:grid-cols-2 rounded-lg overflow-hidden mb-8">
                    <div className="bg-background px-6 py-8">
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Requests used</p>
                      <p className="text-4xl font-bold text-foreground tabular-nums">{Number(used).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground mt-1">of {Number(limit).toLocaleString()} monthly</p>
                      <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="bg-background px-6 py-8">
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Credits balance</p>
                      <p className="text-4xl font-bold text-foreground tabular-nums">{Number(credits).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground mt-1">Used after quota exhausted · never expire</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm"><Link href="/api/pricing">Add credits or upgrade</Link></Button>
                </TabsContent>

                {/* ── BILLING ──────────────────────────────────────────── */}
                <TabsContent value="billing" className="mt-0">
                  {/* Show subscription detail row if sub exists */}
                  {subInfo && (
                    <div className="mb-6 rounded-lg border border-border bg-muted/10 px-5 py-4 text-sm">
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Subscription</p>
                      <div className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <StatusBadge badge={statusBadge} />
                        </div>
                        {subInfo.period_end && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {statusBadge === "cancelling" ? "Access until" : "Period ended"}
                            </p>
                            <p className="font-medium">{new Date(subInfo.period_end).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
                          </div>
                        )}
                        {subInfo.next_billed_at && statusBadge === "active" && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Next billing</p>
                            <p className="font-medium">{new Date(subInfo.next_billed_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Billing history</p>
                      <p className="text-sm text-muted-foreground mt-1">Recent API plan and credit payments</p>
                    </div>
                    <Button asChild variant="ghost" size="sm"><Link href="/dashboard/profile">Full billing →</Link></Button>
                  </div>
                  <div className="border-t border-border mt-5" />
                  {paymentLogs.length === 0
                    ? <p className="py-8 text-sm text-muted-foreground text-center">No payments yet.</p>
                    : paymentLogs.slice(0, 15).map(log => (
                      <div key={log.id} className="border-t border-border py-4 flex justify-between items-start gap-4 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{log.label ?? log.type ?? "—"}</p>
                          {log.product_name && <p className="text-xs text-muted-foreground mt-0.5">{log.product_name}</p>}
                          {log.occurred_at && <p className="text-xs text-muted-foreground mt-0.5">{new Date(log.occurred_at).toLocaleDateString()}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {log.amount && <span className="font-medium">{log.amount}</span>}
                          {log.credits_added != null && log.credits_added > 0 && (
                            <span className="text-xs text-muted-foreground">+{log.credits_added.toLocaleString()} credits</span>
                          )}
                          {log.status && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border border-border ${log.status_color === "green" ? "text-foreground" : "text-muted-foreground"}`}>
                              {log.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>

      {/* Name key dialog */}
      <Dialog open={showNameKeyDialog} onOpenChange={open => { setShowNameKeyDialog(open); if (!open) setNewKeyNameInput(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Name your API key</DialogTitle>
            <DialogDescription>Choose a name to identify this key (e.g. "Production", "Dev").</DialogDescription>
          </DialogHeader>
          <Input id="api-key-name" placeholder="e.g. Production" value={newKeyNameInput}
            onChange={e => setNewKeyNameInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleGenerateKey(newKeyNameInput)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNameKeyDialog(false); setNewKeyNameInput(""); }}>Cancel</Button>
            <Button onClick={() => handleGenerateKey(newKeyNameInput)} disabled={generateLoading}>
              {generateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show key dialog */}
      <Dialog open={!!newKeyModal} onOpenChange={() => setNewKeyModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API key created</DialogTitle>
            <DialogDescription>{newKeyModal?.note ?? "Copy this key now. It won't be shown again."}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm break-all select-all">{newKeyModal?.key}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (newKeyModal?.key) navigator.clipboard.writeText(newKeyModal.key); }}>
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
            <Button onClick={() => { setNewKeyModal(null); fetchAll(); }}>I've saved this</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ApiDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}>
      <ApiDashboardContent />
    </Suspense>
  );
}