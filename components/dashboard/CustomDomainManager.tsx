"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Loader2, Copy, Trash2, CheckCircle, HelpCircle, RefreshCw, Lock, Crown, Check } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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

// Copy button with transient "copied" feedback
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
      className={`
        inline-flex items-center justify-center h-7 w-7 rounded-md border transition-all duration-150
        ${copied
          ? "border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-600 dark:text-emerald-400"
          : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
        }
      `}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// DNS Records Table inside the guide dialog
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
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-xs font-semibold uppercase tracking-wide w-16">Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide w-20">Hostname</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Value</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide w-20 text-center">Priority</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide w-16 text-center">TTL</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((rec, i) => (
            <TableRow key={i} className="group">
              <TableCell>
                <span className={`
                  inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold tracking-wide
                  ${rec.type === "MX"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                  }
                `}>
                  {rec.type}
                </span>
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

// Separate component to handle its own translations and state
function DomainSetupGuide({ domain, mxRecord, txtRecord }: { domain: string; mxRecord: string; txtRecord: string }) {
  const t = useTranslations('Dashboard');
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          {t('guide_btn')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('guide_title', { domain })}</DialogTitle>
          <DialogDescription>{t('guide_desc')}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-5 text-sm">
          {/* Provider info */}
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground text-xs">{t('guide_loading')}</span>
              </>
            ) : error ? (
              <span className="text-red-500 text-xs">{error}</span>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">{t('guide_provider')}</span>
                <span className="text-xs font-semibold">{provider ?? "Not detected"}</span>
                {nameservers && (
                  <span className="text-xs text-muted-foreground ml-1">({nameservers.join(", ")})</span>
                )}
              </>
            )}
          </div>

          {/* Step-by-step */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setup Steps</p>
            <ol className="space-y-2">
              {[
                t('guide_step_1'),
                t.rich('guide_step_2', { provider: provider ?? "your registrar/DNS panel" }),
                "Add the DNS records below to your domain.",
                t('guide_step_4'),
                t('guide_step_5'),
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* DNS Records Table */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">DNS Records</p>
            <DnsRecordsTable domain={domain} mxRecord={mxRecord} txtRecord={txtRecord} />
          </div>

          <p className="text-xs text-muted-foreground border-t pt-3">{t('guide_tip')}</p>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            {t('guide_close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function normalizeDomain(input: Partial<CustomDomain> & { domain?: string }): CustomDomain | null {
  if (!input || !input.domain) return null;
  return {
    domain: input.domain,
    verified: !!input.verified,
    mxRecord: input.mxRecord ?? "mx.freecustom.email",
    txtRecord: input.txtRecord ?? "",
  };
}

export function CustomDomainManager({ initialDomains, isPro }: CustomDomainManagerProps) {
  const t = useTranslations('Dashboard');
  const { data: session } = useSession();
  const user = session?.user;
  const [domains, setDomains] = useState<CustomDomain[]>(
    (initialDomains ?? []).map((d) => normalizeDomain(d)!).filter(Boolean)
  );
  const [newDomain, setNewDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);

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
    if (!isPro) { openUpsell(t('domains_title')); return; }
    if (!newDomain || !user) return;
    setIsLoading(true);
    const toastId = toast.loading(t('domains_add_btn') + "...");
    try {
      const response = await fetch("/api/user/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain, wyiUserId: user.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || t('domains_add_fail'));

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
      toast.success(t('domains_add_success'), { id: toastId });
    } catch (error: any) {
      toast.error(error?.message ?? t('domains_add_fail'), { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDomain = async (domainToDelete: string) => {
    if (!isPro) { openUpsell("Manage Domains"); return; }
    if (!user) return;
    setIsLoading(true);
    const toastId = toast.loading(`Deleting ${domainToDelete}...`);
    try {
      const response = await fetch("/api/user/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainToDelete, wyiUserId: user.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || t('domains_del_fail'));
      setDomains((prev) => prev.filter((d) => d.domain !== domainToDelete));
      toast.success(t('domains_del_success'), { id: toastId });
    } catch (error: any) {
      toast.error(error?.message ?? t('domains_del_fail'), { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async (domainToVerify: string) => {
    if (!isPro) { openUpsell("Domain Verification"); return; }
    if (!user) return;
    setVerifyingDomain(domainToVerify);
    const toastId = toast.loading(`${t('domains_verifying')} ${domainToVerify}...`);
    try {
      const response = await fetch("/api/user/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainToVerify, wyiUserId: user.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || t('domains_verify_fail'));

      if (result?.success && result?.verified) {
        setDomains((prev) =>
          prev.map((d) => (d.domain === domainToVerify ? { ...d, verified: true } : d))
        );
        toast.success(t('domains_verify_success'), { id: toastId });
      } else {
        const returned = normalizeDomain(result?.data ?? {});
        if (returned && returned.domain === domainToVerify && returned.verified) {
          setDomains((prev) => prev.map((d) => (d.domain === domainToVerify ? returned : d)));
          toast.success(t('domains_verify_success'), { id: toastId });
        } else {
          throw new Error(result?.message || t('domains_verify_fail'));
        }
      }
    } catch (error: any) {
      toast.error(error?.message ?? t('domains_verify_fail'), { id: toastId });
    } finally {
      setVerifyingDomain(null);
    }
  };

  return (
    <>
      <Card className={!isPro ? "opacity-90 relative overflow-hidden" : ""}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              {t('domains_title')}
              {!isPro && <Lock className="h-4 w-4 text-muted-foreground" />}
            </CardTitle>
            <CardDescription>{t('domains_desc')}</CardDescription>
          </div>
          {!isPro && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              <Crown className="w-3 h-3 mr-1" /> {t('domains_pro_badge')}
            </Badge>
          )}
        </CardHeader>

        <CardContent>
          {/* ADD DOMAIN FORM */}
          <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row gap-2 mb-6">
            <Input
              placeholder={t('domains_placeholder')}
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              disabled={isLoading}
              className="w-full sm:flex-1"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || !newDomain}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('domains_add_btn')}
              </Button>
              <Button
                type="button"
                variant="ghost"
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
                    toast.success(t('domains_refresh_success'));
                  } catch {
                    toast.error(t('domains_refresh_fail'));
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* DOMAINS LIST */}
          <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
            {domains && domains.length > 0 ? (
              domains.filter((d) => !!d && !!d.domain).map((d) => (
                <Card key={d.domain} className="flex flex-col border shadow-sm">
                  <CardHeader className="flex-row items-center justify-between pb-3 pt-4 px-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Verified status dot */}
                      <span className={`flex-shrink-0 h-2 w-2 rounded-full ${d.verified ? "bg-emerald-500" : "bg-amber-400"}`} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{d.domain}</p>
                        <p className={`text-xs mt-0.5 ${d.verified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {d.verified ? (
                            <span className="inline-flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {t('domains_status_verified')}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><HelpCircle className="h-3 w-3" /> {t('domains_status_pending')}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDomain(d.domain)}
                      disabled={isLoading}
                      className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>

                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                      {!d.verified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyDomain(d.domain)}
                          disabled={verifyingDomain === d.domain}
                          className="w-full sm:w-auto"
                        >
                          {verifyingDomain === d.domain && <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />}
                          {t('domains_verify_btn')}
                        </Button>
                      )}
                      <DomainSetupGuide domain={d.domain} mxRecord={d.mxRecord} txtRecord={d.txtRecord} />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center col-span-full py-12 border rounded-md border-dashed">
                <h3 className="text-lg font-medium">{t('domains_empty_title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {isPro ? t('domains_empty_desc_pro') : t('domains_empty_desc_free')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <UpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        featureName={upsellFeature}
      />
    </>
  );
}

export default CustomDomainManager;