// components/dashboard/CustomDomainManager.tsx
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
  Loader2, Copy, Trash2, CheckCircle, HelpCircle,
  RefreshCw, Lock, Crown, Check, AlertTriangle, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { UpsellModal } from "@/components/upsell-modal";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface CustomDomain {
  domain: string;
  verified: boolean;
  mxRecord: string;
  txtRecord: string;
}

interface CustomDomainManagerProps {
  initialDomains: CustomDomain[];
  isPro: boolean;
}

interface DnsRecord {
  type: string;
  hostname: string;
  value: string;
  priority?: string;
  ttl?: string;
}

// ---------------------------------------------------------------------------
// ICANN-compliant domain validation
// ---------------------------------------------------------------------------
const DOMAIN_LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

function isValidDomain(value: string): boolean {
  if (!value || value.length > 253) return false;
  const labels = value.split(".");
  if (labels.length < 2) return false;
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,}$/i.test(tld)) return false;
  return labels.every((label) => DOMAIN_LABEL_RE.test(label));
}

function sanitizeDomainInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.\-]/g, "");
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label}`}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// DNS Records Table
// ---------------------------------------------------------------------------
function DnsRecordsTable({ domain, mxRecord, txtRecord }: { domain: string; mxRecord: string; txtRecord: string }) {
  const records: DnsRecord[] = [
    {
      type: "MX",
      hostname: "@",
      value: mxRecord || "mx.freecustom.email",
      priority: "10",
      ttl: "Auto",
    },
    {
      type: "TXT",
      hostname: "@",
      value: txtRecord || "freecustomemail-verification=...",
      ttl: "Auto",
    },
  ];

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead className="text-xs font-medium uppercase tracking-widest text-muted-foreground w-16">Type</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-widest text-muted-foreground w-20">Host</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Value</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-widest text-muted-foreground w-20 text-center">Priority</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-widest text-muted-foreground w-16 text-center">TTL</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((rec, i) => (
            <TableRow key={i} className="border-t border-border">
              <TableCell>
                <span className="font-mono text-xs font-semibold text-foreground">{rec.type}</span>
              </TableCell>
              <TableCell>
                <code className="text-xs font-mono text-muted-foreground">{rec.hostname}</code>
              </TableCell>
              <TableCell>
                <code className="text-xs font-mono break-all leading-relaxed">{rec.value}</code>
              </TableCell>
              <TableCell className="text-center">
                {rec.priority
                  ? <span className="text-xs text-muted-foreground font-mono">{rec.priority}</span>
                  : <span className="text-xs text-muted-foreground/40">—</span>
                }
              </TableCell>
              <TableCell className="text-center">
                <span className="text-xs text-muted-foreground font-mono">{rec.ttl}</span>
              </TableCell>
              <TableCell className="text-center">
                <CopyButton text={rec.value} label={`${rec.type} record`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Domain Setup Guide dialog
// ---------------------------------------------------------------------------
function DomainSetupGuide({ domain, mxRecord, txtRecord }: { domain: string; mxRecord: string; txtRecord: string }) {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [nameservers, setNameservers] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchProvider() {
    if (!domain) return;
    setLoading(true);
    setProvider(null);
    setError(null);
    try {
      const res = await fetch(`/api/dns/provider?domain=${encodeURIComponent(domain)}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Provider lookup failed");
      setProvider(json.provider ?? null);
      setNameservers(Array.isArray(json.nameservers) ? json.nameservers : null);
    } catch (err: any) {
      console.error("DNS provider lookup failed:", err);
      setError(err?.message ?? "Failed to detect DNS provider");
      setProvider(null);
      setNameservers(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) fetchProvider();
  }, [open]);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        {t("guide_btn")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("guide_title", { domain })}</DialogTitle>
            <DialogDescription>{t("guide_desc")}</DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-6 text-sm">

            {/* Provider info */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-2.5 text-xs">
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">{t("guide_loading")}</span>
                </>
              ) : error ? (
                <span className="text-muted-foreground">{error}</span>
              ) : (
                <>
                  <span className="text-muted-foreground">{t("guide_provider")}</span>
                  <span className="font-medium text-foreground">{provider ?? "Not detected"}</span>
                  {nameservers && (
                    <span className="text-muted-foreground">({nameservers.join(", ")})</span>
                  )}
                </>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Setup Steps</p>
              <ol className="space-y-3">
                {[
                  t("guide_step_1"),
                  t.rich("guide_step_2", { provider: provider ?? "your registrar/DNS panel" }),
                  "Add the DNS records below to your domain.",
                  t("guide_step_4"),
                  t("guide_step_5"),
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <span className="flex-shrink-0 text-xs font-mono text-muted-foreground w-4 mt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* DNS Records */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">DNS Records</p>
              <DnsRecordsTable domain={domain} mxRecord={mxRecord} txtRecord={txtRecord} />
            </div>

            <p className="text-xs text-muted-foreground border-t border-border pt-4">{t("guide_tip")}</p>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t("guide_close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normalizeDomain(input: Partial<CustomDomain> & { domain?: string }): CustomDomain | null {
  if (!input || !input.domain) return null;
  return {
    domain: input.domain,
    verified: !!input.verified,
    mxRecord: input.mxRecord ?? "mx.freecustom.email",
    txtRecord: input.txtRecord ?? "",
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function CustomDomainManager({ initialDomains, isPro }: CustomDomainManagerProps) {
  const t = useTranslations("Dashboard");
  const { data: session } = useSession();
  const user = session?.user;
  const [domains, setDomains] = useState<CustomDomain[]>(
    (initialDomains ?? []).map((d) => normalizeDomain(d)!).filter(Boolean)
  );
  const [newDomain, setNewDomain] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);

  const [domainToDelete, setDomainToDelete] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState("Custom Domains");

  const openUpsell = (feature: string) => {
    setUpsellFeature(feature);
    setIsUpsellOpen(true);
  };

  function pushDomainSafe(domainObj: Partial<CustomDomain>) {
    const norm = normalizeDomain(domainObj as Partial<CustomDomain & { domain?: string }>);
    if (!norm) return;
    setDomains((prev) => {
      if (prev.some((p) => p.domain === norm.domain)) return prev;
      return [...prev, norm];
    });
  }

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro) { openUpsell(t("domains_title")); return; }
    if (!newDomain || !user) return;
    if (!isValidDomain(newDomain)) { setDomainError("Enter a valid domain (e.g. example.com)"); return; }

    setIsLoading(true);
    const toastId = toast.loading(t("domains_add_btn") + "...");
    try {
      const response = await fetch("/api/user/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain, wyiUserId: user.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || t("domains_add_fail"));

      if (result?.data) {
        pushDomainSafe(result.data);
      } else {
        const built = normalizeDomain({
          domain: newDomain,
          verified: false,
          mxRecord: result?.mxRecord ?? "mx.freecustom.email",
          txtRecord: result?.txtRecord ?? result?.token ?? "",
        });
        if (built) pushDomainSafe(built);
      }
      setNewDomain("");
      setDomainError(null);
      toast.success(t("domains_add_success"), { id: toastId });
    } catch (error: any) {
      toast.error(error?.message ?? t("domains_add_fail"), { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const initiateDelete = (domain: string) => {
    if (!isPro) { openUpsell("Manage Domains"); return; }
    setDomainToDelete(domain);
    setDeleteConfirmation("");
  };

  const confirmDelete = async () => {
    if (!domainToDelete || !user) return;
    setIsLoading(true);
    const toastId = toast.loading(`Deleting ${domainToDelete}...`);
    try {
      const response = await fetch("/api/user/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainToDelete, wyiUserId: user.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || t("domains_del_fail"));

      setDomains((prev) => prev.filter((d) => d.domain !== domainToDelete));
      toast.success(t("domains_del_success"), { id: toastId });
      setDomainToDelete(null);
    } catch (error: any) {
      toast.error(error?.message ?? t("domains_del_fail"), { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async (domainToVerify: string) => {
    if (!isPro) { openUpsell("Domain Verification"); return; }
    if (!user) return;
    setVerifyingDomain(domainToVerify);
    const toastId = toast.loading(`${t("domains_verifying")} ${domainToVerify}...`);
    try {
      const response = await fetch("/api/user/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainToVerify, wyiUserId: user.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || t("domains_verify_fail"));

      if (result?.success && result?.verified) {
        setDomains((prev) =>
          prev.map((d) => (d.domain === domainToVerify ? { ...d, verified: true } : d))
        );
        toast.success(t("domains_verify_success"), { id: toastId });
      } else {
        const returned = normalizeDomain(result?.data ?? {});
        if (returned && returned.domain === domainToVerify && returned.verified) {
          setDomains((prev) => prev.map((d) => (d.domain === domainToVerify ? returned : d)));
          toast.success(t("domains_verify_success"), { id: toastId });
        } else {
          throw new Error(result?.message || t("domains_verify_fail"));
        }
      }
    } catch (error: any) {
      toast.error(error?.message ?? t("domains_verify_fail"), { id: toastId });
    } finally {
      setVerifyingDomain(null);
    }
  };

  return (
    <>
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t("domains_title")}
          </p>
          {!isPro && (
            <button
              onClick={() => openUpsell("Custom Domains")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Lock className="h-3 w-3" />
              Pro
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-5">{t("domains_desc")}</p>

        <div className="border-t border-border" />

        {/* Add domain form */}
        <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row gap-2 mt-5 mb-6">
          <div className="relative flex-1">
            <Input
              placeholder={t("domains_placeholder")}
              value={newDomain}
              onChange={(e) => {
                const sanitized = sanitizeDomainInput(e.target.value);
                setNewDomain(sanitized);
                if (sanitized && !isValidDomain(sanitized)) {
                  setDomainError("Enter a valid domain (e.g. example.com)");
                } else {
                  setDomainError(null);
                }
              }}
              onBlur={() => {
                if (newDomain && !isValidDomain(newDomain)) {
                  setDomainError("Enter a valid domain (e.g. example.com)");
                }
              }}
              disabled={isLoading}
              className={`w-full ${domainError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              aria-invalid={!!domainError}
              aria-describedby={domainError ? "domain-error" : undefined}
            />
            {domainError && (
              <p id="domain-error" className="absolute top-full left-0 mt-1 text-xs text-destructive">
                {domainError}
              </p>
            )}
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button type="submit" disabled={isLoading || !newDomain || !!domainError} size="sm">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("domains_add_btn")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (!isPro) { openUpsell("Refresh Domains"); return; }
                if (!user) return;
                setIsLoading(true);
                try {
                  const res = await fetch(`/api/user/dashboard-data`, { cache: "no-store" });
                  const json = await res.json();
                  const list = json?.customDomains ?? json?.data?.customDomains ?? [];
                  const normalized = Array.isArray(list)
                    ? list.map((d: any) => normalizeDomain(d)).filter(Boolean)
                    : [];
                  setDomains(normalized as CustomDomain[]);
                  toast.success(t("domains_refresh_success"));
                } catch {
                  toast.error(t("domains_refresh_fail"));
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Domains list */}
        <div className="space-y-0">
          {domains && domains.length > 0 ? (
            domains.filter((d) => !!d && !!d.domain).map((d) => (
              <div key={d.domain} className="border-t border-border py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`flex-shrink-0 h-1.5 w-1.5 rounded-full ${d.verified ? "bg-foreground" : "bg-muted-foreground/40"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.domain}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.verified ? t("domains_status_verified") : t("domains_status_pending")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => initiateDelete(d.domain)}
                    disabled={isLoading}
                    className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {!d.verified && (
                  <div className="flex flex-wrap gap-2 mt-3 pl-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyDomain(d.domain)}
                      disabled={verifyingDomain === d.domain}
                    >
                      {verifyingDomain === d.domain && (
                        <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                      )}
                      {t("domains_verify_btn")}
                    </Button>
                    <DomainSetupGuide domain={d.domain} mxRecord={d.mxRecord} txtRecord={d.txtRecord} />
                  </div>
                )}
                {d.verified && (
                  <div className="mt-3 pl-4">
                    <DomainSetupGuide domain={d.domain} mxRecord={d.mxRecord} txtRecord={d.txtRecord} />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="border-t border-border py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {isPro ? t("domains_empty_desc_pro") : t("domains_empty_desc_free")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!domainToDelete}
        onOpenChange={(open) => { if (!open && !isLoading) setDomainToDelete(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Domain</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-medium text-foreground">{domainToDelete}</span>{" "}
              and remove all associated email addresses and data.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-3">
            <Label htmlFor="domain-confirm" className="text-sm font-medium">
              Type{" "}
              <span className="font-mono bg-muted/20 border border-border px-1 py-0.5 rounded text-xs">
                {domainToDelete}
              </span>{" "}
              to confirm:
            </Label>
            <Input
              id="domain-confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={domainToDelete || ""}
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDomainToDelete(null)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteConfirmation !== domainToDelete || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        featureName={upsellFeature}
      />
    </>
  );
}

export default CustomDomainManager;