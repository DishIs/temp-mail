"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Trash2, CheckCircle, HelpCircle, RefreshCw, Lock, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/use-session";
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

// Separate component to handle its own translations and state
function DomainSetupGuide({ domain }: { domain: string }) {
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
      if (!res.ok) {
        throw new Error(json?.message || "Provider lookup failed");
      }
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
    if (open) {
      fetchProvider();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          {t('guide_btn')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('guide_title', { domain })}</DialogTitle>
          <DialogDescription>
            {t('guide_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 text-sm">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('guide_loading')}</span>
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              <p>
                <strong>{t('guide_provider')} </strong>
                {provider ?? "Not detected"}{" "}
                {nameservers ? (
                  <span className="text-muted-foreground">({nameservers.join(", ")})</span>
                ) : null}
              </p>

              <ol className="list-decimal list-inside space-y-2">
                <li>
                  {t('guide_step_1')}
                </li>
                <li>
                  {t.rich('guide_step_2', {
                    provider: provider ?? "your registrar/DNS panel"
                  })}
                </li>
                <li>
                  {t('guide_step_3')}
                  <ul className="list-disc ml-5 mt-1">
                    <li>
                      <strong>MX:</strong> <code>mx.freecustom.email</code> (priority default/10)
                    </li>
                    <li>
                      <strong>TXT:</strong> (Token starting with <code>freecustomemail-verification=</code>)
                    </li>
                  </ul>
                </li>
                <li>{t('guide_step_4')}</li>
                <li>{t('guide_step_5')}</li>
              </ol>

              <p className="text-muted-foreground text-xs mt-2">
                {t('guide_tip')}
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
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
  const user = session;
  const [domains, setDomains] = useState<CustomDomain[]>(
    (initialDomains ?? []).map((d) => normalizeDomain(d)!).filter(Boolean)
  );
  const [newDomain, setNewDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);
  
  // Upsell State
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
    if (!isPro) {
        openUpsell(t('domains_title'));
        return;
    }
    if (!newDomain || !user) return;
    setIsLoading(true);
    // Note: We use raw strings for loading toasts often, or translate them
    const toastId = toast.loading(t('domains_add_btn') + "...");
    try {
      const response = await fetch("/api/user/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain, wyiUserId: user.id }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || t('domains_add_fail'));
      }

      const returned = result?.data ?? result?.domain ?? null;
      if (result?.data) {
        pushDomainSafe(result.data);
      } else {
        const built = normalizeDomain({
          domain: newDomain,
          verified: false,
          mxRecord: result?.mxRecord ?? "mx.freecustom.email",
          txtRecord: result?.txtRecord ?? result?.token ?? "",
        });
        if (built) {
          pushDomainSafe(built);
        }
      }

      setNewDomain("");
      toast.success(t('domains_add_success'), { id: toastId });
    } catch (error: any) {
      console.error("Add domain error:", error);
      toast.error(error?.message ?? t('domains_add_fail'), { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDomain = async (domainToDelete: string) => {
    if (!isPro) {
        openUpsell("Manage Domains");
        return;
    }
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
      if (!response.ok) {
        throw new Error(result?.message || t('domains_del_fail'));
      }

      setDomains((prev) => prev.filter((d) => d.domain !== domainToDelete));
      toast.success(t('domains_del_success'), { id: toastId });
    } catch (error: any) {
      toast.error(error?.message ?? t('domains_del_fail'), { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDomain = async (domainToVerify: string) => {
    if (!isPro) {
        openUpsell("Domain Verification");
        return;
    }
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
      if (!response.ok) {
        throw new Error(result?.message || t('domains_verify_fail'));
      }

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
          throw new Error(
            result?.message || t('domains_verify_fail')
          );
        }
      }
    } catch (error: any) {
      toast.error(error?.message ?? t('domains_verify_fail'), { id: toastId });
    } finally {
      setVerifyingDomain(null);
    }
  };

  const copyToClipboard = (text: string | undefined, label: string) => {
    if (!text) {
      toast.error(t('domains_copy_fail'));
      return;
    }
    try {
      navigator.clipboard.writeText(text);
      toast.success(`${label} ${t('domains_copy_success')}`);
    } catch (err) {
      console.error("Copy failed", err);
      toast.error(t('domains_copy_fail'));
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
                    if (!isPro) {
                        openUpsell("Refresh Domains");
                        return;
                    }
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
                    } catch (err) {
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

            {/* DOMAINS LIST (CARDS) */}
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {domains && domains.length > 0 ? (
                domains.filter(d => !!d && !!d.domain).map((d) => (
                <Card key={d.domain} className="flex flex-col">
                    <CardHeader className="flex-row items-start justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg break-all">{d.domain}</CardTitle>
                        <CardDescription
                        className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            d.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                        >
                        {d.verified ? <CheckCircle className="mr-1 h-3 w-3" /> : <HelpCircle className="mr-1 h-3 w-3" />}
                        {d.verified ? t('domains_status_verified') : t('domains_status_pending')}
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDomain(d.domain)} disabled={isLoading} className="ml-2 flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </CardHeader>

                    <CardContent className="flex-grow space-y-4">
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p className="font-semibold text-foreground">{t('domains_records_title')}</p>
                        {/* MX Record */}
                        <div className="flex items-center justify-between gap-2">
                        <code className="text-xs p-1 bg-slate-100 rounded-sm break-all">
                            <span className="font-bold">MX:</span> {d.mxRecord}
                        </code>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(d.mxRecord, "MX Record")}>
                            <Copy className="h-3 w-3" />
                        </Button>
                        </div>
                        {/* TXT Record */}
                        <div className="flex items-center justify-between gap-2">
                        <code className="text-xs p-1 bg-slate-100 rounded-sm break-all">
                            <span className="font-bold">TXT:</span> {d.txtRecord || <em>...</em>}
                        </code>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(d.txtRecord, "TXT Record")}>
                            <Copy className="h-3 w-3" />
                        </Button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        {!d.verified && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyDomain(d.domain)}
                            disabled={verifyingDomain === d.domain}
                            className="w-full sm:w-auto"
                        >
                            {verifyingDomain === d.domain ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {t('domains_verify_btn')}
                        </Button>
                        )}
                        <DomainSetupGuide domain={d.domain} />
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