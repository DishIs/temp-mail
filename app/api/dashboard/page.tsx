// app/api/dashboard/page.tsx
"use client";

import { Component, Suspense, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import {
  AlertCircle, Check, Copy, Loader2, Trash2, ShieldCheck,
  ChevronLeft, ChevronRight, Search, Mail, Inbox, RefreshCw, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ApiCustomDomainManager } from "@/components/dashboard/ApiCustomDomainManager";
import { CUSTOM_DOMAIN_PLANS, WEBHOOK_PLANS } from "@/lib/api-plans-client";

const PAYMENT_LOGS_LIMIT = 20;

// ─── Constant arrays outside the component — never recreated on render ────────
const TABS = ["overview", "keys", "inboxes", "domains", "webhooks", "usage", "billing"] as const;

const ASCII_FRAGS = [
  { x: "1%",  y: "8%",  t: "EHLO api2.freecustom.email" },
  { x: "70%", y: "5%",  t: "250-STARTTLS" },
  { x: "2%",  y: "45%", t: "X-OTP: 847291" },
  { x: "72%", y: "42%", t: "RCPT TO:<inbox@ditmail.info>" },
  { x: "1%",  y: "80%", t: "AUTH PLAIN" },
  { x: "70%", y: "78%", t: "MAIL FROM:<service@example.com>" },
] as const;

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.09) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlanInfo {
  name?: string; label?: string; price?: string; status_badge?: string;
}
interface UsageInfo {
  requests_this_month?: number; requests_limit?: number; requests_remaining?: number;
  percent_used?: string; credits_remaining?: number; resets_approx?: string;
}
interface SubscriptionInfo {
  subscription_id?: string; status?: string;
  cancel_at_period_end?: boolean; period_end?: string | null;
  canceled_at?: string | null; next_billed_at?: string | null; payer_email?: string | null;
}
interface InboxGroup { list?: string[]; count?: number; }
interface ApiStatusData {
  plan?: PlanInfo; subscription?: SubscriptionInfo | null; usage?: UsageInfo;
  rate_limits?: { requests_per_second?: number; requests_per_month?: number };
  features?: Record<string, boolean | number | string>;
  app_inboxes?: InboxGroup; api_inboxes?: InboxGroup; inboxes?: InboxGroup;
  upsell?: {
    nudges?: string[];
    next_plan?: { name?: string; label?: string; price?: string; unlocks?: string[] };
    credit_packages?: Array<{ price?: string; requests?: string; label?: string }>;
  };
  all_plans?: Array<Record<string, unknown>>;
}
interface ApiStatusResponse {
  success?: boolean; data?: ApiStatusData; plan?: string;
  usage?: { used?: number; limit?: number; resetsAt?: string; credits?: number; rateLimitPerSec?: number };
  apiInboxes?: string[];
}
interface ApiKeyItem {
  id: string; prefix: string; name?: string; active?: boolean;
  createdAt?: string; lastUsedAt?: string; revokedAt?: string | null;
}
interface PaymentLogItem {
  id: string; type?: string; product_type?: "app" | "api" | "credits";
  label?: string; product_name?: string | null; amount?: string | null;
  currency?: string | null; status?: string | null; status_color?: string | null;
  credits_added?: number | null; occurred_at?: string | null;
}

function normalizeApiKeysList(raw: unknown): ApiKeyItem[] {
  const r = raw as { data?: unknown[]; keys?: unknown[] };
  const arr = Array.isArray(r?.data) ? r.data : Array.isArray(r?.keys) ? r.keys : [];
  return arr.map((item: unknown) => {
    const o = item as Record<string, unknown>;
    return {
      id: String(o._id ?? o.id ?? ""),
      prefix: String(o.keyPrefix ?? o.prefix ?? ""),
      name: o.name as string | undefined,
      active: o.active as boolean | undefined,
      createdAt: o.createdAt as string | undefined,
      lastUsedAt: o.lastUsedAt as string | undefined,
      revokedAt: o.revokedAt as string | null | undefined,
    };
  });
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
// Without this, a throw inside ApiCustomDomainManager (or any tab subcomponent)
// propagates up to React's reconciler, which tries to re-render the parent to
// find a boundary — and without one it recurses until the call stack overflows,
// producing the repeating ui/uk stack trace you're seeing.
interface EBState { hasError: boolean; message: string }
class ErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, message: error?.message ?? "Unknown error" };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
          <AlertCircle className="h-5 w-5 mx-auto mb-2" />
          <p>Something went wrong loading this section.</p>
          <p className="text-xs mt-1 text-destructive/70 font-mono">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: "" })}
            className="mt-3 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Atoms ───────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
      {children}
    </p>
  );
}

function StatTile({ label, value, sub, children }: {
  label: string; value?: string | number; sub?: string; children?: React.ReactNode;
}) {
  return (
    <div className="border-t border-border pt-5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      {value !== undefined && (
        <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
      )}
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {children}
    </div>
  );
}

function StatusBadge({ badge }: { badge: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    active:         { label: "active",               cls: "text-foreground bg-muted/30" },
    trialing:       { label: "trialing",              cls: "text-foreground bg-muted/30" },
    cancelling:     { label: "cancels at period end", cls: "text-amber-700 bg-amber-50 border-amber-300 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-700" },
    cancelled:      { label: "cancelled",             cls: "text-destructive bg-destructive/5 border-destructive/30" },
    payment_failed: { label: "payment failed",        cls: "text-destructive bg-destructive/5 border-destructive/30" },
    free:           { label: "free",                  cls: "text-muted-foreground bg-muted/20" },
  };
  const { label, cls } = cfg[badge] ?? { label: badge, cls: "text-muted-foreground bg-muted/20" };
  return (
    <span className={`text-xs font-mono px-2 py-1 rounded-md border border-border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Subscription notice ──────────────────────────────────────────────────────
function SubscriptionNotice({ badge, periodEnd, planLabel }: {
  badge: string; periodEnd?: string | null; planLabel?: string | null;
}) {
  const fmtDate = (d?: string | null) => d
    ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  if (badge === "cancelling" && periodEnd) {
    return (
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">{planLabel ?? "Plan"} subscription cancelled</p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              Your subscription has been cancelled. You will retain{" "}
              <strong className="text-foreground">full {planLabel ?? "plan"} access</strong> until{" "}
              <strong className="text-foreground">{fmtDate(periodEnd)}</strong>.
              After that date, your account will revert to the Free tier.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-7">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Your payment method <strong className="text-foreground">will not be charged again</strong>. No further billing will occur.
          </p>
        </div>
        <div className="pl-7">
          <Button asChild size="sm"><Link href="/api/pricing">Resubscribe to keep access →</Link></Button>
        </div>
      </div>
    );
  }
  if (badge === "cancelled") {
    return (
      <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Subscription ended</p>
            <p className="text-sm text-destructive/80 leading-relaxed mt-1">
              Your plan has ended and your account is now on the Free tier. Upgrade to restore full API access.
            </p>
          </div>
        </div>
        <div className="pl-7">
          <Button asChild size="sm"><Link href="/api/pricing">Upgrade to restore access →</Link></Button>
        </div>
      </div>
    );
  }
  if (badge === "payment_failed") {
    return (
      <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Payment failed — access suspended</p>
            <p className="text-sm text-destructive/80 mt-0.5">Please update your payment method to restore access.</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// ─── Inboxes tab ──────────────────────────────────────────────────────────────
function InboxesTab({ apiInboxes, appInboxes }: { apiInboxes: string[]; appInboxes: string[] }) {
  const [apiSearch, setApiSearch] = useState("");
  const [appSearch, setAppSearch] = useState("");
  const filteredApi = apiInboxes.filter(a => a.toLowerCase().includes(apiSearch.toLowerCase()));
  const filteredApp = appInboxes.filter(a => a.toLowerCase().includes(appSearch.toLowerCase()));

  return (
    <div className="space-y-10">
      <div>
        <SectionLabel>API-registered inboxes</SectionLabel>
        <p className="text-sm text-muted-foreground mt-0.5 mb-4">
          Inboxes created via the API. Available for polling and WebSocket delivery.
        </p>
        <div className="border-t border-border" />
        {apiInboxes.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-center">
            <Inbox className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No API-registered inboxes yet.</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Use the{" "}
              <Link href="/api/docs/inboxes" className="underline underline-offset-2 text-foreground hover:text-muted-foreground">
                API docs → Inboxes
              </Link>{" "}
              endpoint to register inboxes.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 mb-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input placeholder="Filter inboxes…" value={apiSearch} onChange={e => setApiSearch(e.target.value)} className="h-8 text-xs pl-8" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">{filteredApi.length} of {apiInboxes.length} inboxes</p>
            <div className="rounded-lg border border-border overflow-hidden">
              {filteredApi.map((addr, i) => (
                <div key={addr} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i !== 0 ? "border-t border-border" : ""}`}>
                  <span className="font-mono text-foreground text-xs">{addr}</span>
                  <button onClick={() => navigator.clipboard.writeText(addr)} className="text-muted-foreground hover:text-foreground transition-colors ml-3 shrink-0">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {filteredApi.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No inboxes match &ldquo;{apiSearch}&rdquo;</div>
              )}
            </div>
          </>
        )}
      </div>

      <div>
        <SectionLabel>App inboxes ({appInboxes.length})</SectionLabel>
        <p className="text-sm text-muted-foreground mt-0.5 mb-4">
          Inboxes created through the web app. These can also be queried via the API.
        </p>
        <div className="border-t border-border" />
        {appInboxes.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-center">
            <Mail className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No app inboxes found.</p>
          </div>
        ) : (
          <>
            <div className="mt-4 mb-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input placeholder="Filter inboxes…" value={appSearch} onChange={e => setAppSearch(e.target.value)} className="h-8 text-xs pl-8" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">{filteredApp.length} of {appInboxes.length} inboxes</p>
            <div className="rounded-lg border border-border overflow-hidden">
              {filteredApp.map((addr, i) => (
                <div key={addr} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i !== 0 ? "border-t border-border" : ""}`}>
                  <span className="font-mono text-foreground text-xs">{addr}</span>
                  <button onClick={() => navigator.clipboard.writeText(addr)} className="text-muted-foreground hover:text-foreground transition-colors ml-3 shrink-0">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {filteredApp.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No inboxes match &ldquo;{appSearch}&rdquo;</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Webhooks tab ─────────────────────────────────────────────────────────────
function WebhooksTab({ canUseWebhooks }: { canUseWebhooks: boolean }) {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookInbox, setNewWebhookInbox] = useState("");
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [createdWebhookSecret, setCreatedWebhookSecret] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [apiInboxes, setApiInboxes] = useState<string[]>([]);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/user/webhooks");
      const data = await res.json();
      if (res.ok) setWebhooks(data.data || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/user/webhooks/logs");
      const data = await res.json();
      if (res.ok) setLogs(data.data || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchApiInboxes = useCallback(async () => {
    try {
      const res = await fetch("/api/user/api-status");
      const data = await res.json();
      if (!res.ok) return;
      // Handles both { data: { api_inboxes: { list } } } and { apiInboxes: [] }
      const list: string[] =
        data?.data?.api_inboxes?.list ??
        data?.apiInboxes ??
        [];
      setApiInboxes(list);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchWebhooks(), fetchLogs(), fetchApiInboxes()])
      .finally(() => setLoading(false));
  }, [fetchWebhooks, fetchLogs, fetchApiInboxes]);

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl || !newWebhookInbox) return;
    const tid = toast.loading("Creating webhook...");
    setCreatingWebhook(true);
    try {
      const res = await fetch("/api/user/webhooks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newWebhookUrl, inbox: newWebhookInbox }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.dismiss(tid); toast.success("Webhook created successfully!");
        setCreatedWebhookSecret(data.secret);
        setShowAddDialog(false); setNewWebhookUrl(""); setNewWebhookInbox("");
        fetchWebhooks();
      } else { toast.dismiss(tid); toast.error(data.message || "Failed to create webhook"); }
    } catch { toast.dismiss(tid); toast.error("Failed to create webhook"); }
    finally { setCreatingWebhook(false); }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    const tid = toast.loading("Deleting webhook...");
    setDeletingId(webhookId);
    try {
      const res = await fetch("/api/user/webhooks", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId }),
      });
      const data = await res.json();
      if (res.ok && data.success) { toast.dismiss(tid); toast.success("Webhook deleted."); fetchWebhooks(); }
      else { toast.dismiss(tid); toast.error(data.message || "Failed to delete webhook"); }
    } catch { toast.dismiss(tid); toast.error("Failed to delete webhook"); }
    finally { setDeletingId(null); }
  };

  const handleRegenerateSecret = async (webhookId: string) => {
    const tid = toast.loading("Regenerating secret...");
    setRegeneratingId(webhookId);
    try {
      const res = await fetch("/api/user/webhooks/regenerate-secret", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId }),
      });
      const data = await res.json();
      if (res.ok && data.success) { toast.dismiss(tid); toast.success("Secret regenerated!"); setCreatedWebhookSecret(data.secret); }
      else { toast.dismiss(tid); toast.error(data.message || "Failed to regenerate secret"); }
    } catch { toast.dismiss(tid); toast.error("Failed to regenerate secret"); }
    finally { setRegeneratingId(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div>
            <SectionLabel>Active Webhooks</SectionLabel>
            <p className="text-sm text-muted-foreground mt-0.5">Endpoints notified when emails arrive in your registered inboxes.</p>
          </div>
          {webhooks.length > 0 && canUseWebhooks && (
            <Button size="sm" onClick={() => setShowAddDialog(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Add Webhook</Button>
          )}
          {webhooks.length > 0 && !canUseWebhooks && (
            <Button size="sm" asChild><Link href="/api/pricing">Upgrade to Growth to Add Webhook</Link></Button>
          )}
        </div>
        <div className="border-t border-border" />
        {webhooks.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No active webhooks</p>
            {canUseWebhooks ? (
              <Button size="sm" onClick={() => setShowAddDialog(true)}><Plus className="h-3.5 w-3.5 mr-1.5" />Add your first webhook</Button>
            ) : (
              <Button size="sm" asChild><Link href="/api/pricing">Upgrade to Growth to use Webhooks</Link></Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden mt-4">
            {webhooks.map((hook, i) => (
              <div key={hook._id} className={`flex items-center justify-between px-4 py-3 text-sm ${i !== 0 ? "border-t border-border" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-foreground text-xs truncate max-w-[300px]">{hook.url}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${hook.active ? "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20" : "text-muted-foreground border-border"}`}>
                      {hook.active ? "active" : "inactive"}
                    </span>
                    {hook.failureCount > 0 && (
                      <span className="text-[10px] text-red-500 font-medium">{hook.failureCount} fail{hook.failureCount > 1 ? "ures" : ""}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Inbox: <span className="font-mono">{hook.inbox}</span></p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => handleRegenerateSecret(hook._id)} disabled={regeneratingId === hook._id} title="Regenerate secret" className="h-7 w-7">
                    {regeneratingId === hook._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteWebhook(hook._id)} disabled={deletingId === hook._id} title="Delete webhook" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                    {deletingId === hook._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionLabel>Recent Webhook Logs</SectionLabel>
        <p className="text-sm text-muted-foreground mt-0.5">Delivery status for webhook notifications.</p>
        <div className="border-t border-border" />
        {logs.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground text-center">No webhook logs found.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden mt-4">
            {logs.map((log, i) => (
              <div key={log._id} className={`px-4 py-3 text-sm ${i !== 0 ? "border-t border-border" : ""}`}>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-foreground text-xs truncate max-w-[300px]">{log.targetUrl}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${log.status === "success" ? "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20" : "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20"}`}>
                    {log.status} · {log.responseCode}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString("en-US")}</p>
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded">{log.eventType || "email.received"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>Create a webhook to receive HTTP POST notifications when emails arrive.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWebhook} className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Webhook URL</label>
              <Input placeholder="https://example.com/webhook" value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Inbox</label>
              {apiInboxes.length > 0 ? (
                <select value={newWebhookInbox} onChange={e => setNewWebhookInbox(e.target.value)} required
                  className="mt-1.5 w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Select an inbox</option>
                  {apiInboxes.map(inbox => <option key={inbox} value={inbox}>{inbox}</option>)}
                </select>
              ) : (
                <Input placeholder="inbox@domain.com" value={newWebhookInbox} onChange={e => setNewWebhookInbox(e.target.value)} required className="mt-1.5" />
              )}
              {apiInboxes.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  No API inboxes found.{" "}
                  <Link href="/api/docs/inboxes" className="underline underline-offset-2 hover:text-foreground">Create one via API</Link>
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={creatingWebhook || !newWebhookUrl || !newWebhookInbox}>
                {creatingWebhook && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create Webhook
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createdWebhookSecret} onOpenChange={open => !open && setCreatedWebhookSecret(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Webhook Secret</DialogTitle>
            <DialogDescription>Save this secret now. It won&apos;t be shown again after closing.</DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <p className="font-mono text-xs break-all leading-relaxed">{createdWebhookSecret}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Include the <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-[10px]">X-Webhook-Secret</code> header in webhook requests to verify authenticity.
          </p>
          <DialogFooter>
            <Button onClick={() => { navigator.clipboard.writeText(createdWebhookSecret || ""); toast.success("Copied to clipboard!"); setCreatedWebhookSecret(null); }}>
              <Copy className="h-4 w-4 mr-2" />Copy &amp; Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main dashboard
// ─────────────────────────────────────────────────────────────────────────────
function ApiDashboardContent() {
  const { data: session, status } = useSession();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [apiStatus,         setApiStatus]        = useState<ApiStatusResponse | null>(null);
  const [apiKeys,           setApiKeys]           = useState<ApiKeyItem[]>([]);
  const [paymentLogs,       setPaymentLogs]       = useState<PaymentLogItem[]>([]);
  const [logsOffset,        setLogsOffset]        = useState(0);
  const [hasMoreLogs,       setHasMoreLogs]       = useState(false);
  const [logsLoading,       setLogsLoading]       = useState(false);
  const [loading,           setLoading]           = useState(true);
  const [newKeyModal,       setNewKeyModal]       = useState<{ key: string; name: string; note?: string } | null>(null);
  const [showNameKeyDialog, setShowNameKeyDialog] = useState(false);
  const [newKeyNameInput,   setNewKeyNameInput]   = useState("");
  const [generateLoading,   setGenerateLoading]   = useState(false);
  const [revokeId,          setRevokeId]          = useState<string | null>(null);
  const [error,             setError]             = useState<string | null>(null);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const data        = apiStatus?.data ?? (apiStatus as ApiStatusData | null);
  const planName    = typeof data?.plan === "object" ? data.plan?.name  : (apiStatus?.plan ?? "free");
  const planLabel   = typeof data?.plan === "object" ? data.plan?.label : null;
  const planPrice   = typeof data?.plan === "object" ? data.plan?.price : null;
  const statusBadge = (typeof data?.plan === "object" ? data.plan?.status_badge : null) ?? "free";
  const subInfo     = data?.subscription ?? null;
  const periodEnd   = subInfo?.period_end ?? null;

  type UsageLike = UsageInfo & { used?: number; limit?: number; resetsAt?: string; credits?: number; rateLimitPerSec?: number };
  const usage        = (data?.usage ?? (apiStatus as { usage?: UsageLike } | null)?.usage) as UsageLike | undefined;
  const used         = usage?.requests_this_month ?? usage?.used    ?? 0;
  const limit        = usage?.requests_limit      ?? usage?.limit   ?? 5000;
  const pct          = limit ? Math.min(100, (used / limit) * 100) : 0;
  const credits      = usage?.credits_remaining   ?? usage?.credits ?? 0;
  const resetsAt     = usage?.resets_approx       ?? (usage as UsageLike | undefined)?.resetsAt;
  const rateLimitSec = data?.rate_limits?.requests_per_second ?? (usage as UsageLike | undefined)?.rateLimitPerSec ?? 1;

  const features   = data?.features ?? {};
  const upsell     = data?.upsell;
  const apiInboxes = data?.api_inboxes?.list ?? (apiStatus as { apiInboxes?: string[] } | null)?.apiInboxes ?? [];
  const appInboxes = data?.app_inboxes?.list ?? [];

  const canUseCustomDomains = CUSTOM_DOMAIN_PLANS.includes(planName as string);
  const canUseWebhooks = WEBHOOK_PLANS.includes(planName as string);
  const showUpsell = planName === "free" || planName === "developer" || statusBadge === "cancelled";

  // ─── Data fetching ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true); setError(null);
    try {
      const [statusRes, keysRes] = await Promise.all([
        fetch("/api/user/api-status"),
        fetch("/api/user/api-keys"),
      ]);
      if (statusRes.ok) {
        setApiStatus(await statusRes.json());
      } else {
        const err = await statusRes.json().catch(() => ({}));
        setError(err.message || "Failed to load API status.");
      }
      if (keysRes.ok) setApiKeys(normalizeApiKeysList(await keysRes.json()));
    } catch (e) {
      console.error(e);
      setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const fetchPaymentLogs = useCallback(async () => {
    if (!session?.user?.id) return;
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ type: "api", limit: String(PAYMENT_LOGS_LIMIT + 1), offset: String(logsOffset) });
      const res  = await fetch(`/api/user/payment-logs?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load billing history.");
      const raw  = Array.isArray(data) ? data : (data.logs ?? data.data ?? []);
      const logs: PaymentLogItem[] = Array.isArray(raw) ? raw : [];
      setHasMoreLogs(logs.length > PAYMENT_LOGS_LIMIT);
      setPaymentLogs(logs.slice(0, PAYMENT_LOGS_LIMIT));
    } catch (e) {
      console.error(e);
      setPaymentLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [session?.user?.id, logsOffset]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?callbackUrl=/api/dashboard");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) fetchAll();
  }, [session?.user?.id, fetchAll]);

  useEffect(() => {
    if (session?.user?.id) fetchPaymentLogs();
  }, [session?.user?.id, fetchPaymentLogs]);

  // Extract primitive from searchParams to avoid object-reference churn in deps
  const checkoutParam = searchParams.get("checkout");
  useEffect(() => {
    if (!checkoutParam || !session?.user?.id) return;
    const t = setTimeout(() => fetchAll(), 800);
    return () => clearTimeout(t);
  }, [checkoutParam, session?.user?.id, fetchAll]);

  const handleGenerateKey = async (name: string) => {
    const keyName = (name || "Default").trim() || "Default";
    setGenerateLoading(true); setError(null);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      const dat = await res.json();
      if (!res.ok) throw new Error(dat.message || dat.error || "Failed to create key.");
      const keyPayload = Array.isArray(dat.data) ? dat.data[0] : dat.data ?? dat;
      const keyValue   = keyPayload?.key ?? dat.key;
      if (keyValue) {
        setNewKeyModal({ key: keyValue, name: keyPayload?.name ?? dat.name ?? keyName, note: dat.message ?? dat.note });
        setShowNameKeyDialog(false); setNewKeyNameInput("");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create key."); }
    finally { setGenerateLoading(false); }
  };

  const handleRevoke = async (keyId: string) => {
    setRevokeId(keyId); setError(null);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const dat = await res.json();
      if (!res.ok) throw new Error(dat.message || "Failed to revoke key.");
      fetchAll();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to revoke key."); }
    finally { setRevokeId(null); }
  };

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );

  const dataReady = !loading && apiStatus != null;

  return (
    <>
      <div className="min-h-screen bg-background" style={DOT_BG}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
          {ASCII_FRAGS.map((f, i) => (
            <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap"
              style={{ left: f.x, top: f.y, opacity: 0.035 }}>{f.t}</span>
          ))}
        </div>

        {/* Top bar */}
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
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">API Dashboard</p>
            <div className="flex flex-wrap items-end gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {planLabel ?? planName ?? "Free"}
                {planPrice && planPrice !== "Free" && planPrice !== "free" && (
                  <span className="ml-2 text-lg font-normal text-muted-foreground">{planPrice}</span>
                )}
              </h1>
              <StatusBadge badge={statusBadge} />
            </div>
          </div>

          {dataReady && <SubscriptionNotice badge={statusBadge} periodEnd={periodEnd} planLabel={planLabel} />}

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <Tabs defaultValue="overview" className="w-full">
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
                {/* OVERVIEW */}
                <TabsContent value="overview" className="mt-0">
                  <div className="grid gap-px bg-border sm:grid-cols-3 rounded-lg overflow-hidden mb-8">
                    <div className="bg-background px-6 py-6">
                      <StatTile label="Requests this month" value={Number(used).toLocaleString("en-US")} sub={`of ${Number(limit).toLocaleString("en-US")} monthly`}>
                        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        {resetsAt && <p className="text-xs text-muted-foreground mt-1.5">Resets {new Date(resetsAt).toLocaleDateString()}</p>}
                      </StatTile>
                    </div>
                    <div className="bg-background px-6 py-6">
                      <StatTile label="Credits balance" value={Number(credits).toLocaleString("en-US")} sub="Never expire · used after quota" />
                    </div>
                    <div className="bg-background px-6 py-6">
                      <StatTile label="Rate limit" value={`${rateLimitSec} req/s`} sub="Concurrent request ceiling" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden mb-8">
                    <div className="bg-background px-6 py-5">
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">API inboxes</p>
                      <p className="text-2xl font-semibold text-foreground tabular-nums">{data?.api_inboxes?.count ?? apiInboxes.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Registered via API</p>
                    </div>
                    <div className="bg-background px-6 py-5">
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">App inboxes</p>
                      <p className="text-2xl font-semibold text-foreground tabular-nums">{data?.app_inboxes?.count ?? appInboxes.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Created via web app</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <SectionLabel>Feature flags</SectionLabel>
                    <p className="text-sm text-muted-foreground mb-4 mt-0.5">Based on your current plan</p>
                    <div className="border-t border-border" />
                    {[
                      { label: "OTP Extraction", key: "otp_extraction" },
                      { label: "WebSocket",       key: "websocket" },
                      { label: "Attachments",     key: "attachments" },
                      { label: "Custom Domains",  key: "custom_domains" },
                    ].map(({ label, key }) => {
                      const v = features[key];
                      const enabled = v === true || (typeof v === "number" && v > 0) || (typeof v === "string" && v !== "false");
                      return (
                        <div key={label} className="border-t border-border py-3 flex items-center justify-between text-sm">
                          <span className="text-foreground">{label}</span>
                          {enabled ? <Check className="h-4 w-4 text-foreground" /> : <span className="h-4 w-4 rounded-full border border-border block" />}
                        </div>
                      );
                    })}
                  </div>

                  {showUpsell && upsell?.next_plan && (
                    <div className="rounded-lg border border-border bg-muted/20 p-6">
                      <SectionLabel>Upgrade available</SectionLabel>
                      <p className="text-base font-semibold text-foreground mt-2">{upsell.next_plan.label} — {upsell.next_plan.price}</p>
                      {upsell.next_plan.unlocks?.length ? (
                        <ul className="text-sm text-muted-foreground mt-3 space-y-1.5 mb-5">
                          {upsell.next_plan.unlocks.slice(0, 3).map((u, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />{u}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <Button asChild size="sm"><Link href="/api/pricing">View API pricing</Link></Button>
                    </div>
                  )}
                </TabsContent>

                {/* API KEYS */}
                <TabsContent value="keys" className="mt-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <SectionLabel>API Keys</SectionLabel>
                      <p className="text-sm text-muted-foreground mt-0.5">{apiKeys.length} / 5 keys · Only prefixes are shown; raw keys are never stored.</p>
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
                          {k.createdAt  && <span>Created {new Date(k.createdAt).toLocaleDateString()}</span>}
                          {k.lastUsedAt && <span>Last used {new Date(k.lastUsedAt).toLocaleDateString()}</span>}
                          {k.active === false && <span className="text-foreground/50">Revoked</span>}
                        </div>
                      </div>
                      {k.active !== false && (
                        <button disabled={revokeId === k.id} onClick={() => handleRevoke(k.id)}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors">
                          {revokeId === k.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  ))}
                  {apiKeys.length === 0 && <p className="py-8 text-sm text-muted-foreground text-center">No API keys yet. Generate one above.</p>}
                </TabsContent>

                {/* INBOXES */}
                <TabsContent value="inboxes" className="mt-0">
                  <InboxesTab apiInboxes={apiInboxes} appInboxes={appInboxes} />
                </TabsContent>

                {/* DOMAINS — wrapped in ErrorBoundary to prevent stack overflow */}
                <TabsContent value="domains" className="mt-0">
                  <ErrorBoundary>
                    <ApiCustomDomainManager canUseCustomDomains={canUseCustomDomains} />
                  </ErrorBoundary>
                </TabsContent>

                {/* WEBHOOKS — also wrapped defensively */}
                <TabsContent value="webhooks" className="mt-0">
                  <ErrorBoundary>
                    <WebhooksTab canUseWebhooks={canUseWebhooks} />
                  </ErrorBoundary>
                </TabsContent>

                {/* USAGE */}
                <TabsContent value="usage" className="mt-0">
                  <div className="grid gap-px bg-border sm:grid-cols-2 rounded-lg overflow-hidden mb-8">
                    <div className="bg-background px-6 py-8">
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Requests used</p>
                      <p className="text-4xl font-bold text-foreground tabular-nums">{Number(used).toLocaleString("en-US")}</p>
                      <p className="text-sm text-muted-foreground mt-1">of {Number(limit).toLocaleString("en-US")} monthly</p>
                      <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      {resetsAt && <p className="text-xs text-muted-foreground mt-2">Resets {new Date(resetsAt).toLocaleDateString()}</p>}
                    </div>
                    <div className="bg-background px-6 py-8">
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Credits balance</p>
                      <p className="text-4xl font-bold text-foreground tabular-nums">{Number(credits).toLocaleString("en-US")}</p>
                      <p className="text-sm text-muted-foreground mt-1">Used after quota exhausted · never expire</p>
                    </div>
                  </div>
                  {upsell?.credit_packages && upsell.credit_packages.length > 0 && (
                    <div className="mb-6">
                      <SectionLabel>Add credits</SectionLabel>
                      <p className="text-sm text-muted-foreground mt-0.5 mb-4">Credits are used once your monthly quota is exhausted and never expire.</p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {upsell.credit_packages.map(pkg => (
                          <Link key={pkg.price} href={`/api/pricing?credits=${encodeURIComponent(pkg.price ?? "")}`}
                            className="rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors p-4 text-sm">
                            <p className="font-semibold text-foreground">{pkg.price}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{pkg.requests} requests</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm"><Link href="/api/pricing">Add credits or upgrade plan</Link></Button>
                </TabsContent>

                {/* BILLING */}
                <TabsContent value="billing" className="mt-0">
                  {subInfo && (
                    <div className="mb-8 rounded-lg border border-border bg-muted/10 divide-y divide-border overflow-hidden">
                      <div className="px-5 py-4"><SectionLabel>Subscription</SectionLabel></div>
                      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                          <StatusBadge badge={statusBadge} />
                        </div>
                        {subInfo.period_end && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">{statusBadge === "cancelling" ? "Access until" : "Period ended"}</p>
                            <p className="font-medium text-foreground">{new Date(subInfo.period_end).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
                          </div>
                        )}
                        {subInfo.next_billed_at && statusBadge === "active" && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Next billing</p>
                            <p className="font-medium text-foreground">{new Date(subInfo.next_billed_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
                          </div>
                        )}
                        {subInfo.subscription_id && (
                          <div className="col-span-2 sm:col-span-3">
                            <p className="text-xs text-muted-foreground mb-1.5">Subscription ID</p>
                            <code className="font-mono text-xs bg-muted/60 px-2 py-0.5 rounded select-all">{subInfo.subscription_id}</code>
                          </div>
                        )}
                      </div>
                      {statusBadge === "cancelling" && (
                        <div className="px-5 py-3 flex items-center gap-2 bg-amber-50/40 dark:bg-amber-950/10">
                          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground">Your payment method <strong className="text-foreground">will not be charged again</strong>. No further billing will occur.</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-end justify-between mb-1">
                    <div>
                      <SectionLabel>Billing history</SectionLabel>
                      <p className="text-sm text-muted-foreground mt-0.5">Recent API plan payments and credit purchases</p>
                    </div>
                    <Button asChild variant="ghost" size="sm"><Link href="/dashboard/profile?tab=billing">Full billing →</Link></Button>
                  </div>
                  <div className="border-t border-border mt-3" />

                  {logsLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : paymentLogs.length === 0 ? (
                    <p className="py-8 text-sm text-muted-foreground text-center">No API payments recorded yet.</p>
                  ) : (
                    <>
                      {paymentLogs.map(log => (
                        <div key={log.id} className="border-t border-border py-4 flex justify-between items-start gap-4 text-sm">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{log.label ?? log.type ?? "—"}</p>
                            {log.product_name && <p className="text-xs text-muted-foreground mt-0.5">{log.product_name}</p>}
                            {log.occurred_at && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(log.occurred_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                            {log.amount && <span className="font-medium tabular-nums">{log.amount}</span>}
                            {log.credits_added != null && log.credits_added > 0 && (
                              <span className="text-xs text-muted-foreground">+{log.credits_added.toLocaleString("en-US")} credits</span>
                            )}
                            {log.status && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border border-border ${log.status_color === "green" ? "text-foreground" : "text-muted-foreground"}`}>
                                {log.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <Button variant="ghost" size="sm" disabled={logsOffset === 0} onClick={() => setLogsOffset(o => Math.max(0, o - PAYMENT_LOGS_LIMIT))}>
                          <ChevronLeft className="h-4 w-4 mr-1" />Previous
                        </Button>
                        <span className="text-xs text-muted-foreground">Page {Math.floor(logsOffset / PAYMENT_LOGS_LIMIT) + 1}</span>
                        <Button variant="ghost" size="sm" disabled={!hasMoreLogs} onClick={() => setLogsOffset(o => o + PAYMENT_LOGS_LIMIT)}>
                          Next<ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </>
                  )}
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
            <DialogDescription>Choose a name to identify this key (e.g. &ldquo;Production&rdquo;, &ldquo;Dev&rdquo;).</DialogDescription>
          </DialogHeader>
          <Input placeholder="e.g. Production" value={newKeyNameInput}
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

      {/* New key reveal dialog */}
      <Dialog open={!!newKeyModal} onOpenChange={() => setNewKeyModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API key created</DialogTitle>
            <DialogDescription>{newKeyModal?.note ?? "Copy this key now — it won't be shown again."}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm break-all select-all">
            {newKeyModal?.key}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (newKeyModal?.key) navigator.clipboard.writeText(newKeyModal.key); }}>
              <Copy className="h-4 w-4 mr-2" />Copy
            </Button>
            <Button onClick={() => { setNewKeyModal(null); fetchAll(); }}>I&apos;ve saved this</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ApiDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    }>
      <ApiDashboardContent />
    </Suspense>
  );
}