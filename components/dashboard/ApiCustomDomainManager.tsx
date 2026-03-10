// components/dashboard/ApiCustomDomainManager.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Custom domain manager for the API dashboard.
//
//  Intentionally mirrors CustomDomainManager.tsx in UI / UX — same layout,
//  same interactions, same dialogs.  The only difference is the data source:
//  instead of calling /api/user/domains (which is tied to the webapp session),
//  it calls /api/user/api-custom-domains — an internal Next.js route proxy
//  that forwards to the Express /v1/custom-domains endpoints using the user's
//  stored API key, so Growth/Enterprise API plan users can manage custom
//  domains even without a webapp Pro subscription.
//
//  Both surfaces read/write the SAME `customDomains` array in MongoDB, so
//  domains are always in sync.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2, Copy, Trash2, Check, RefreshCw, Lock, AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Label } from "@/components/ui/label";

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

interface CustomDomain {
  domain:    string;
  verified:  boolean;
  mxRecord:  string;  // normalised from API's mx_record
  txtRecord: string;  // normalised from API's txt_record
  addedAt?:  string;
}

interface DnsRecord {
  type:      string;
  hostname:  string;
  value:     string;
  priority?: string;
  ttl?:      string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Responsive Dialog (same implementation as CustomDomainManager)
// ─────────────────────────────────────────────────────────────────────────────

function ResponsiveDialogContent({
  children,
  maxWidth = "sm:max-w-lg",
  onClose,
}: {
  children: React.ReactNode;
  maxWidth?: string;
  onClose?: () => void;
}) {
  return (
    <DialogPortal>
      <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        onPointerDownOutside={onClose ? () => onClose() : undefined}
      >
        <div className={`relative flex flex-col w-full ${maxWidth} max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] bg-background border border-border rounded-lg shadow-xl overflow-hidden`}>
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CopyButton
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      title={`Copy ${label}`}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DNS Records Table
// ─────────────────────────────────────────────────────────────────────────────

function DnsRecordsTable({ mxRecord, txtRecord }: { mxRecord: string; txtRecord: string }) {
  const records: DnsRecord[] = [
    { type: "MX",  hostname: "@", value: mxRecord  || "mx.freecustom.email", priority: "10", ttl: "Auto" },
    { type: "TXT", hostname: "@", value: txtRecord || "freecustomemail-verification=...",        ttl: "Auto" },
  ];

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[480px]">
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead className="text-xs font-mono font-medium uppercase tracking-widest text-muted-foreground w-16">Type</TableHead>
              <TableHead className="text-xs font-mono font-medium uppercase tracking-widest text-muted-foreground w-20">Host</TableHead>
              <TableHead className="text-xs font-mono font-medium uppercase tracking-widest text-muted-foreground">Value</TableHead>
              <TableHead className="text-xs font-mono font-medium uppercase tracking-widest text-muted-foreground w-20 text-center">Priority</TableHead>
              <TableHead className="text-xs font-mono font-medium uppercase tracking-widest text-muted-foreground w-16 text-center">TTL</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((rec, i) => (
              <TableRow key={i} className="border-t border-border">
                <TableCell><span className="font-mono text-xs font-semibold text-foreground">{rec.type}</span></TableCell>
                <TableCell><code className="text-xs font-mono text-muted-foreground">{rec.hostname}</code></TableCell>
                <TableCell><code className="text-xs font-mono break-all leading-relaxed">{rec.value}</code></TableCell>
                <TableCell className="text-center">
                  {rec.priority
                    ? <span className="text-xs text-muted-foreground font-mono">{rec.priority}</span>
                    : <span className="text-xs text-muted-foreground/40">—</span>}
                </TableCell>
                <TableCell className="text-center"><span className="text-xs text-muted-foreground font-mono">{rec.ttl}</span></TableCell>
                <TableCell className="text-center"><CopyButton text={rec.value} label={`${rec.type} record`} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DNS Setup Guide Dialog
// ─────────────────────────────────────────────────────────────────────────────

function DomainSetupGuide({ domain, mxRecord, txtRecord }: { domain: string; mxRecord: string; txtRecord: string }) {
  const [open, setOpen]           = useState(false);
  const [provider, setProvider]   = useState<string | null>(null);
  const [nameservers, setNS]      = useState<string[] | null>(null);
  const [loadingNS, setLoadingNS] = useState(false);

  useEffect(() => {
    if (!open || !domain) return;
    setLoadingNS(true);
    fetch(`/api/dns/provider?domain=${encodeURIComponent(domain)}`, { cache: "no-store" })
      .then(r => r.json())
      .then(j => { setProvider(j.provider ?? null); setNS(Array.isArray(j.nameservers) ? j.nameservers : null); })
      .catch(() => setProvider(null))
      .finally(() => setLoadingNS(false));
  }, [open, domain]);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        Setup Guide
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent maxWidth="sm:max-w-2xl" onClose={() => setOpen(false)}>
          {/* Header */}
          <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-border">
            <DialogPrimitive.Close onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
            <DialogTitle className="text-base font-semibold tracking-tight leading-snug pr-6">
              DNS setup for {domain}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Add the records below to your DNS provider to verify ownership and start receiving mail.
            </DialogDescription>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 space-y-6 text-sm">
            {/* Provider pill */}
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-2.5">
              {loadingNS ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">Detecting DNS provider…</span></>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">DNS Provider:</span>
                  <span className="text-xs font-medium text-foreground">{provider ?? "Not detected"}</span>
                  {nameservers && <span className="text-xs text-muted-foreground font-mono break-all">({nameservers.join(", ")})</span>}
                </>
              )}
            </div>

            {/* Steps */}
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Setup Steps</p>
              <ol className="space-y-0">
                {[
                  "Log in to your domain registrar or DNS provider.",
                  `Navigate to the DNS management page for ${domain}.`,
                  "Add the DNS records listed below.",
                  "Save your changes and wait for DNS propagation (up to 48 hours).",
                  "Click \"Verify Domain\" to confirm the records are live.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-4 border-t border-border py-3.5 first:border-t-0">
                    <span className="flex-shrink-0 font-mono text-xs text-muted-foreground w-4 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* DNS Records */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">DNS Records</p>
              <DnsRecordsTable mxRecord={mxRecord} txtRecord={txtRecord} />
            </div>

            <p className="text-xs text-muted-foreground border-t border-border pt-4">
              DNS changes can take up to 48 hours to propagate globally. Most providers update within minutes.
            </p>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-border flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </ResponsiveDialogContent>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const LABEL_RE   = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
function isValidDomain(v: string): boolean {
  if (!v || v.length > 253) return false;
  const labels = v.split(".");
  if (labels.length < 2) return false;
  if (!/^[a-z]{2,}$/i.test(labels[labels.length - 1])) return false;
  return labels.every(l => LABEL_RE.test(l));
}

/** Normalise API response shape → internal CustomDomain type */
function normalizeApiDomain(d: Record<string, any>): CustomDomain {
  return {
    domain:    d.domain,
    verified:  !!d.verified,
    mxRecord:  d.mx_record  ?? d.mxRecord  ?? "mx.freecustom.email",
    txtRecord: d.txt_record ?? d.txtRecord ?? "",
    addedAt:   d.added_at   ?? d.addedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────────────────────

interface ApiCustomDomainManagerProps {
  /** Pass true when the caller already knows the plan supports custom domains.
   *  The component also independently enforces the gate but this drives the
   *  upsell prompt. */
  canUseCustomDomains: boolean;
}

export function ApiCustomDomainManager({ canUseCustomDomains }: ApiCustomDomainManagerProps) {
  const { data: session } = useSession();
  const [domains,          setDomains]          = useState<CustomDomain[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [newDomain,        setNewDomain]        = useState("");
  const [domainError,      setDomainError]      = useState<string | null>(null);
  const [submitting,       setSubmitting]       = useState(false);
  const [verifyingDomain,  setVerifyingDomain]  = useState<string | null>(null);
  const [domainToDelete,   setDomainToDelete]   = useState<string | null>(null);
  const [deleteConfirm,    setDeleteConfirm]    = useState("");
  const [deleting,         setDeleting]         = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/user/api-custom-domains");
      const json = await res.json();
      if (res.ok && json.success) {
        setDomains((json.data ?? []).map(normalizeApiDomain));
      }
    } catch {
      toast.error("Failed to load custom domains.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) fetchDomains();
  }, [session?.user?.id]);

  // ── Add ────────────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    if (!isValidDomain(newDomain)) { setDomainError("Enter a valid domain (e.g. example.com)"); return; }

    setSubmitting(true);
    const tid = toast.loading("Adding domain…");
    try {
      const res  = await fetch("/api/user/api-custom-domains", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ domain: newDomain.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to add domain.");

      const norm = normalizeApiDomain(json.data ?? {});
      setDomains(prev =>
        prev.some(d => d.domain === norm.domain) ? prev : [...prev, norm],
      );
      setNewDomain("");
      setDomainError(null);
      toast.success("Domain added.", { id: tid });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add domain.", { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Verify ─────────────────────────────────────────────────────────────────

  const handleVerify = async (domain: string) => {
    setVerifyingDomain(domain);
    const tid = toast.loading(`Verifying ${domain}…`);
    try {
      const res  = await fetch(`/api/user/api-custom-domains/${encodeURIComponent(domain)}/verify`, {
        method: "POST",
      });
      const json = await res.json();

      if (res.ok && json.verified) {
        setDomains(prev => prev.map(d => d.domain === domain ? { ...d, verified: true } : d));
        toast.success("Domain verified!", { id: tid });
      } else {
        toast.error(json.message ?? "Verification failed. Check your DNS records.", { id: tid });
      }
    } catch {
      toast.error("Verification request failed.", { id: tid });
    } finally {
      setVerifyingDomain(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!domainToDelete) return;
    setDeleting(true);
    const tid = toast.loading(`Deleting ${domainToDelete}…`);
    try {
      const res  = await fetch(`/api/user/api-custom-domains/${encodeURIComponent(domainToDelete)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to delete domain.");

      setDomains(prev => prev.filter(d => d.domain !== domainToDelete));
      toast.success("Domain removed.", { id: tid });
      setDomainToDelete(null);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete domain.", { id: tid });
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!canUseCustomDomains) {
    return (
      <div className="rounded-lg border border-border bg-muted/10 p-6 text-center">
        <Lock className="h-5 w-5 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground mb-1">Growth or Enterprise plan required</p>
        <p className="text-sm text-muted-foreground mb-4">
          Upgrade to use custom domains with the API.
        </p>
        <Button asChild size="sm">
          <a href="/api/pricing">View API pricing</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Custom Domains</p>
        </div>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Add your own domains to receive mail. Changes here also appear in your webapp dashboard.
        </p>

        <div className="border-t border-border" />

        {/* Add form */}
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mt-5 mb-6">
          <div className="relative flex-1">
            <Input
              placeholder="mail.yourdomain.com"
              value={newDomain}
              onChange={e => {
                const v = e.target.value.toLowerCase().replace(/[^a-z0-9.\-]/g, "");
                setNewDomain(v);
                setDomainError(v && !isValidDomain(v) ? "Enter a valid domain (e.g. example.com)" : null);
              }}
              onBlur={() => {
                if (newDomain && !isValidDomain(newDomain)) setDomainError("Enter a valid domain (e.g. example.com)");
              }}
              disabled={submitting}
              className={`w-full font-mono text-sm ${domainError ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {domainError && <p className="absolute top-full left-0 mt-1 text-xs text-destructive">{domainError}</p>}
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button type="submit" disabled={submitting || !newDomain || !!domainError} size="sm">
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Add Domain
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fetchDomains()}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </form>

        {/* Domain list */}
        {loading ? (
          <div className="py-12 flex justify-center border-t border-border">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : domains.length === 0 ? (
          <div className="border-t border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No custom domains yet. Add one above to get started.
            </p>
          </div>
        ) : (
          domains.map(d => (
            <div key={d.domain} className="border-t border-border py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`flex-shrink-0 h-1.5 w-1.5 rounded-full ${d.verified ? "bg-foreground" : "bg-muted-foreground/40"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground font-mono truncate">{d.domain}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.verified
                        ? <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" />Verified</span>
                        : "Pending verification"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setDomainToDelete(d.domain); setDeleteConfirm(""); }}
                  className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-3 pl-4">
                {!d.verified && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerify(d.domain)}
                    disabled={verifyingDomain === d.domain}
                  >
                    {verifyingDomain === d.domain && <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Verify Domain
                  </Button>
                )}
                <DomainSetupGuide domain={d.domain} mxRecord={d.mxRecord} txtRecord={d.txtRecord} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!domainToDelete} onOpenChange={open => { if (!open && !deleting) setDomainToDelete(null); }}>
        <ResponsiveDialogContent maxWidth="sm:max-w-md" onClose={() => { if (!deleting) setDomainToDelete(null); }}>

          <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-border">
            <DialogPrimitive.Close
              onClick={() => { if (!deleting) setDomainToDelete(null); }}
              disabled={deleting}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
            <DialogTitle className="text-base font-semibold tracking-tight pr-6">Delete Domain</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1 leading-relaxed">
              This will permanently delete{" "}
              <code className="font-mono text-xs bg-muted/60 px-1.5 py-0.5 rounded text-foreground">{domainToDelete}</code>{" "}
              and remove all associated API inboxes.
            </DialogDescription>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5">
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium text-muted-foreground">
                Type{" "}
                <code className="font-mono bg-muted/20 border border-border px-1.5 py-0.5 rounded text-xs text-foreground">
                  {domainToDelete}
                </code>{" "}
                to confirm:
              </Label>
              <Input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={domainToDelete || ""}
                autoComplete="off"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex-shrink-0 px-5 py-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setDomainToDelete(null)} disabled={deleting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirm !== domainToDelete || deleting}
              className="w-full sm:w-auto"
            >
              {deleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Delete Domain
            </Button>
          </div>

        </ResponsiveDialogContent>
      </Dialog>
    </>
  );
}

export default ApiCustomDomainManager;