"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApiStatus {
  plan?: string;
  usage?: { used: number; limit: number; resetsAt?: string; credits?: number; rateLimitPerSec?: number };
  features?: Record<string, boolean | string>;
  upsell?: { nextPlan?: string; nextPrice?: string };
  all_plans?: unknown[];
}

interface ApiKey {
  id: string;
  name?: string;
  prefix: string;
  createdAt?: string;
  lastUsed?: string;
}

export default function ApiDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<unknown[]>([]);
  const [inboxes, setInboxes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyModal, setNewKeyModal] = useState<{ key: string; name: string } | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [registerInbox, setRegisterInbox] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const [statusRes, keysRes, logsRes, meRes] = await Promise.all([
        fetch("/api/user/api-status"),
        fetch("/api/user/api-keys"),
        fetch("/api/user/payment-logs?type=api&limit=10"),
        fetch("/api/user/me"),
      ]);
      if (statusRes.ok) {
        const d = await statusRes.json();
        setApiStatus(d);
        if (Array.isArray(d.apiInboxes)) setInboxes(d.apiInboxes);
      }
      if (keysRes.ok) {
        const d = await keysRes.json();
        setApiKeys(Array.isArray(d.keys) ? d.keys : []);
      }
      if (logsRes.ok) {
        const d = await logsRes.json();
        setPaymentLogs(Array.isArray(d.logs) ? d.logs : Array.isArray(d) ? d : []);
      }
      if (meRes.ok) {
        const d = await meRes.json();
        if (d?.user?.apiInboxes && Array.isArray(d.user.apiInboxes)) setInboxes(d.user.apiInboxes);
      }
    } catch (e) {
      console.error(e);
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
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Default" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      if (data.key) setNewKeyModal({ key: data.key, name: "Default" });
    } catch (e) {
      console.error(e);
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    setRevokeId(keyId);
    try {
      const res = await fetch("/api/user/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      if (res.ok) fetchAll();
    } finally {
      setRevokeId(null);
    }
  };

  const handleRegisterInbox = async () => {
    if (!registerInbox.trim()) return;
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/user/inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inboxName: registerInbox.trim() }),
      });
      if (res.ok) {
        setRegisterInbox("");
        fetchAll();
      }
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

  const plan = apiStatus?.plan ?? "free";
  const usage = apiStatus?.usage;
  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? 5000;
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  const credits = usage?.credits ?? 0;
  const features = apiStatus?.features ?? {};
  const showUpsell = plan === "free" || plan === "developer";

  return (
    <>
      <div className="container max-w-6xl mx-auto py-10 px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your API plan, keys, and usage.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/api">API Overview</Link>
          </Button>
        </div>

        <div className="grid gap-6 max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Plan & Status
              </CardTitle>
              <CardDescription>Current API plan and billing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="capitalize">{plan}</Badge>
                <span className="text-sm text-muted-foreground">
                  {plan === "free" && "$0/mo"}
                  {plan === "developer" && "$7/mo"}
                  {plan === "startup" && "$19/mo"}
                  {plan === "growth" && "$49/mo"}
                  {plan === "enterprise" && "$149/mo"}
                </span>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/api/pricing">View plans</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>Requests this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requests</span>
                  <span className="font-medium">{used.toLocaleString()} / {limit.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                {credits > 0 && (
                  <p className="text-xs text-muted-foreground">Credits remaining: {credits.toLocaleString()}</p>
                )}
                <Button asChild variant="link" size="sm" className="px-0 h-auto">
                  <Link href="/api/pricing">Buy credits</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" /> API Keys
              </CardTitle>
              <CardDescription>{apiKeys.length} / 5 keys</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{k.name ?? "Unnamed"}</span>
                      <span className="font-mono text-muted-foreground ml-2">{k.prefix}...</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={revokeId === k.id}
                      onClick={() => handleRevoke(k.id)}
                    >
                      {revokeId === k.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" /> Registered Inboxes
              </CardTitle>
              <CardDescription>Addresses you can use with the API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
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
              <CardTitle>Feature flags</CardTitle>
              <CardDescription>Based on your plan</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm">
                {["OTP Extraction", "WebSocket", "Attachments", "Custom Domains"].map((f) => {
                  const v = features[f.toLowerCase().replace(" ", "_")] ?? features[f];
                  const enabled = v === true || (typeof v === "string" && v !== "false");
                  return (
                    <li key={f} className="flex items-center gap-2">
                      {enabled ? <Check className="h-4 w-4 text-foreground" /> : <X className="h-4 w-4 text-muted-foreground" />}
                      {f}
                    </li>
                  );
                })}
                <li className="flex items-center gap-2 text-muted-foreground">
                  Rate limit: {usage?.rateLimitPerSec ?? 1} req/s
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing history</CardTitle>
              <CardDescription>Recent API plan and credit payments</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments yet.</p>
              ) : (
                <div className="space-y-2">
                  {paymentLogs.slice(0, 10).map((log: { id?: string; label?: string; amount?: string; status?: string; occurred_at?: string }) => (
                    <div key={log.id ?? log.occurred_at} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                      <span>{log.label ?? "—"}</span>
                      <span>{log.amount ?? "—"}</span>
                      <Badge variant="secondary" className="text-xs">{log.status ?? "—"}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/dashboard/profile">Full billing</Link>
              </Button>
            </CardContent>
          </Card>

          {showUpsell && (
            <Card className="border-border bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" /> Upgrade
                </CardTitle>
                <CardDescription>Get more requests and features</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/api/pricing">View API pricing</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={!!newKeyModal} onOpenChange={() => setNewKeyModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API key created</DialogTitle>
            <DialogDescription>Copy this key now. It won&apos;t be shown again.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-3 font-mono text-sm break-all">{newKeyModal?.key}</div>
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
              I&apos;ve saved this
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
