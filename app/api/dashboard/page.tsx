"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CreditCard,
  Key,
  Inbox,
  Check,
  X,
  Loader2,
  Copy,
  Trash2,
  Zap,
  BarChart3,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Response shapes from GET /user/api-status (internal)
interface PlanInfo {
  name?: string;
  label?: string;
  price?: string;
  status_badge?: string;
}
interface UsageInfo {
  requests_this_month?: number;
  requests_limit?: number;
  requests_remaining?: number;
  percent_used?: string;
  credits_remaining?: number;
  resets_approx?: string;
}
interface ApiStatusData {
  plan?: PlanInfo & { name?: string };
  usage?: UsageInfo;
  rate_limits?: { requests_per_second?: number; requests_per_month?: number };
  features?: Record<string, boolean | number | string>;
  inboxes?: { list?: string[]; count?: number };
  upsell?: {
    nudges?: string[];
    next_plan?: { name?: string; label?: string; price?: string; unlocks?: string[] };
    credit_packages?: Array<{ price?: string; requests?: string; label?: string }>;
  };
  all_plans?: Array<Record<string, unknown>>;
}
interface ApiStatusResponse {
  success?: boolean;
  data?: ApiStatusData;
  plan?: string;
  usage?: { used?: number; limit?: number; resetsAt?: string; credits?: number; rateLimitPerSec?: number };
  apiInboxes?: string[];
}

interface ApiKeyItem {
  id: string;
  prefix: string;
  name?: string;
  active?: boolean;
  createdAt?: string;
  lastUsedAt?: string;
  revokedAt?: string | null;
}
interface ApiKeysResponse {
  success?: boolean;
  keys?: ApiKeyItem[];
  count?: number;
  limit?: number;
}

interface PaymentLogItem {
  id: string;
  type?: string;
  product_type?: "app" | "api" | "credits";
  label?: string;
  product_name?: string | null;
  amount?: string | null;
  currency?: string | null;
  status?: string | null;
  status_color?: string | null;
  credits_added?: number | null;
  occurred_at?: string | null;
  created_at?: string | null;
}
interface PaymentLogsResponse {
  success?: boolean;
  data?: PaymentLogItem[];
  logs?: PaymentLogItem[];
  summary?: { total_events?: number; total_credits_bought?: number; last_payment_at?: string | null };
  pagination?: { total?: number; limit?: number; offset?: number; has_more?: boolean };
}

const STATUS_BADGE_MAP: Record<string, { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
  free: { label: "Free", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  trialing: { label: "Trial", variant: "outline" },
  cancelling: { label: "Cancelling", variant: "secondary" },
  payment_failed: { label: "Payment failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

export default function ApiDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiStatus, setApiStatus] = useState<ApiStatusResponse | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLogItem[]>([]);
  const [inboxes, setInboxes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyModal, setNewKeyModal] = useState<{ key: string; name: string; note?: string } | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [revokePrefix, setRevokePrefix] = useState<string | null>(null);
  const [registerInbox, setRegisterInbox] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = apiStatus?.data ?? (apiStatus as ApiStatusData);
  const planName = typeof data?.plan === "object" ? (data.plan as PlanInfo).name : (apiStatus?.plan ?? data?.plan ?? "free");
  const planLabel = typeof data?.plan === "object" ? (data.plan as PlanInfo).label : null;
  const planPrice = typeof data?.plan === "object" ? (data.plan as PlanInfo).price : null;
  const statusBadge = (typeof data?.plan === "object" ? (data.plan as PlanInfo).status_badge : null) ?? "free";
  type UsageLike = UsageInfo & { used?: number; limit?: number; resetsAt?: string; credits?: number; rateLimitPerSec?: number };
  const usage = (data?.usage ?? apiStatus?.usage) as UsageLike | undefined;
  const used = usage?.requests_this_month ?? usage?.used ?? 0;
  const limit = usage?.requests_limit ?? usage?.limit ?? 5000;
  const remaining = usage?.requests_remaining ?? (limit - used);
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  const credits = usage?.credits_remaining ?? usage?.credits ?? 0;
  const features = data?.features ?? {};
  const upsell = data?.upsell;
  const resetsAt = usage?.resets_approx ?? usage?.resetsAt;
  const rateLimitSec = data?.rate_limits?.requests_per_second ?? usage?.rateLimitPerSec ?? 1;

  const fetchAll = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [statusRes, keysRes, logsRes] = await Promise.all([
        fetch("/api/user/api-status"),
        fetch("/api/user/api-keys"),
        fetch("/api/user/payment-logs?type=api&limit=20"),
      ]);
      if (statusRes.ok) {
        const d: ApiStatusResponse = await statusRes.json();
        setApiStatus(d);
        const inboxList = d?.data?.inboxes?.list ?? (d as { apiInboxes?: string[] }).apiInboxes ?? [];
        setInboxes(Array.isArray(inboxList) ? inboxList : []);
      } else {
        const err = await statusRes.json().catch(() => ({}));
        setError(err.message || "Failed to load API status.");
      }
      if (keysRes.ok) {
        const d: ApiKeysResponse = await keysRes.json();
        setApiKeys(Array.isArray(d?.keys) ? d.keys : []);
      }
      if (logsRes.ok) {
        const d: PaymentLogsResponse = await logsRes.json();
        const list = d?.data ?? d?.logs ?? [];
        setPaymentLogs(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?callbackUrl=/api/dashboard");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) fetchAll();
  }, [session?.user?.id, fetchAll]);

  const handleGenerateKey = async () => {
    setGenerateLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Default" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create key.");
      const keyPayload = data.data ?? data;
      const keyValue = keyPayload.key ?? data.key;
      if (keyValue) setNewKeyModal({ key: keyValue, name: keyPayload.name ?? data.name ?? "Default", note: data.message ?? data.note });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key.");
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleRevoke = async (prefix: string) => {
    setRevokePrefix(prefix);
    setError(null);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to revoke key.");
      fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke key.");
    } finally {
      setRevokePrefix(null);
    }
  };

  const handleRegisterInbox = async () => {
    if (!registerInbox.trim()) return;
    setRegisterLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inboxName: registerInbox.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to register inbox.");
      setRegisterInbox("");
      fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to register inbox.");
    } finally {
      setRegisterLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const badgeInfo = STATUS_BADGE_MAP[statusBadge] ?? { label: String(statusBadge), variant: "secondary" as const };
  const showUpsell = planName === "free" || planName === "developer";

  return (
    <>
      <div className="min-h-screen bg-muted/10">
        {/* Top nav: same style as profile — header + tabs */}
        <div className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6">
              <div className="flex items-center gap-3">
                <Link href="/api" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Image src="/logo.webp" alt="" width={28} height={28} className="rounded" />
                  <span className="text-sm font-medium">API</span>
                </Link>
                <span className="text-muted-foreground/50">/</span>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/api/playground">Playground</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/api">Overview</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/api/pricing">Upgrade</Link>
                </Button>
              </div>
            </div>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="h-11 w-full sm:w-auto justify-start sm:justify-normal bg-transparent border-0 border-b rounded-none gap-6 px-0">
                <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="keys" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
                  API Keys
                </TabsTrigger>
                <TabsTrigger value="usage" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
                  Usage
                </TabsTrigger>
                <TabsTrigger value="billing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
                  Billing
                </TabsTrigger>
              </TabsList>

              <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <TabsContent value="overview" className="mt-0 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <CreditCard className="h-5 w-5" /> Plan & Status
                        </CardTitle>
                        <CardDescription>Current API plan and billing</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant={badgeInfo.variant} className="capitalize">
                            {planLabel ?? planName}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{planPrice ?? (planName === "free" && "$0/mo") ?? ""}</span>
                        </div>
                        <Button asChild variant="outline" size="sm" className="mt-3">
                          <Link href="/api/pricing">View plans</Link>
                        </Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <BarChart3 className="h-5 w-5" /> Usage at a glance
                        </CardTitle>
                        <CardDescription>Requests this month</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Requests</span>
                            <span className="font-medium">{Number(used).toLocaleString()} / {Number(limit).toLocaleString()}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          {credits > 0 && (
                            <p className="text-xs text-muted-foreground">Credits remaining: {Number(credits).toLocaleString()}</p>
                          )}
                          {resetsAt && (
                            <p className="text-xs text-muted-foreground">Resets: {new Date(resetsAt).toLocaleDateString()}</p>
                          )}
                          <Button asChild variant="link" size="sm" className="px-0 h-auto">
                            <Link href="/api/pricing">Buy credits</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Inbox className="h-5 w-5" /> Registered Inboxes
                      </CardTitle>
                      <CardDescription>Addresses you can use with the API</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Input
                          placeholder="user@ditmail.info"
                          value={registerInbox}
                          onChange={(e) => setRegisterInbox(e.target.value)}
                          className="max-w-xs"
                        />
                        <Button size="sm" onClick={handleRegisterInbox} disabled={registerLoading}>
                          {registerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}
                        </Button>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {inboxes.length === 0 && <li>No inboxes registered yet.</li>}
                        {inboxes.map((addr) => (
                          <li key={addr} className="font-mono">{addr}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Feature flags</CardTitle>
                      <CardDescription>Based on your plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid gap-2 text-sm">
                        {["OTP Extraction", "WebSocket", "Attachments", "Custom Domains"].map((f) => {
                          const key = f.toLowerCase().replace(" ", "_");
                          const v = features[key] ?? features[key.replace("_", "")];
                          const enabled = v === true || (typeof v === "number" && v > 0) || (typeof v === "string" && v !== "false");
                          return (
                            <li key={f} className="flex items-center gap-2">
                              {enabled ? <Check className="h-4 w-4 text-foreground" /> : <X className="h-4 w-4 text-muted-foreground" />}
                              {f}
                            </li>
                          );
                        })}
                        <li className="flex items-center gap-2 text-muted-foreground">
                          Rate limit: {rateLimitSec} req/s
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  {showUpsell && upsell && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Zap className="h-5 w-5" /> Upgrade
                        </CardTitle>
                        <CardDescription>
                          {upsell.next_plan?.label} — {upsell.next_plan?.price}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {upsell.nudges?.length ? (
                          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mb-3">
                            {upsell.nudges.slice(0, 2).map((n, i) => (
                              <li key={i}>{n}</li>
                            ))}
                          </ul>
                        ) : null}
                        <Button asChild>
                          <Link href="/api/pricing">View API pricing</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="keys" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Key className="h-5 w-5" /> API Keys
                      </CardTitle>
                      <CardDescription>{apiKeys.length} / 5 keys · Only prefixes are shown; raw keys are never stored.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {apiKeys.map((k) => (
                          <div key={k.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{k.name ?? "Unnamed"}</span>
                              <span className="font-mono text-muted-foreground text-xs">{k.prefix}...</span>
                              {k.lastUsedAt && (
                                <span className="text-xs text-muted-foreground">Last used: {new Date(k.lastUsedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {k.active === false && <Badge variant="secondary">Revoked</Badge>}
                              {k.active !== false && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={revokePrefix === k.prefix}
                                  onClick={() => handleRevoke(k.prefix)}
                                >
                                  {revokePrefix === k.prefix ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        {apiKeys.length < 5 && (
                          <Button size="sm" onClick={handleGenerateKey} disabled={generateLoading}>
                            {generateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate new key"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="usage" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Usage this period</CardTitle>
                      <CardDescription>Requests and credits</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Requests used</p>
                          <p className="text-2xl font-semibold">{Number(used).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">of {Number(limit).toLocaleString()} monthly</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Credits balance</p>
                          <p className="text-2xl font-semibold">{Number(credits).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Used after quota exhausted; never expire</p>
                        </div>
                      </div>
                      <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <Button asChild variant="outline" size="sm" className="mt-4">
                        <Link href="/api/pricing">Add credits or upgrade</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="billing" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Receipt className="h-5 w-5" /> Billing history
                      </CardTitle>
                      <CardDescription>Recent API plan and credit payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {paymentLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No payments yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {paymentLogs.slice(0, 15).map((log) => (
                            <div key={log.id} className="flex justify-between items-center text-sm py-2.5 border-b border-border last:border-0">
                              <div>
                                <span className="font-medium">{log.label ?? log.type ?? "—"}</span>
                                {log.product_name && <p className="text-xs text-muted-foreground">{log.product_name}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                {log.amount != null && <span>{log.amount}</span>}
                                {log.credits_added != null && log.credits_added > 0 && (
                                  <Badge variant="secondary">+{log.credits_added.toLocaleString()} credits</Badge>
                                )}
                                <Badge variant={log.status_color === "green" ? "default" : log.status_color === "red" ? "destructive" : "secondary"} className="text-xs">
                                  {log.status ?? "—"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button asChild variant="outline" size="sm" className="mt-4">
                        <Link href="/dashboard/profile">Full billing (Profile)</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={!!newKeyModal} onOpenChange={() => setNewKeyModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API key created</DialogTitle>
            <DialogDescription>
              {newKeyModal?.note ?? "Copy this key now. It won't be shown again."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-3 font-mono text-sm break-all select-all">{newKeyModal?.key}</div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (newKeyModal?.key) navigator.clipboard.writeText(newKeyModal.key);
              }}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
            <Button onClick={() => { setNewKeyModal(null); fetchAll(); }}>
              I've saved this
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
