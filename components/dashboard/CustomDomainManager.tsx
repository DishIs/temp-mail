"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Trash2, CheckCircle, HelpCircle, RefreshCw, Lock, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { UpsellModal } from "@/components/upsell-modal"; // Ensure this path is correct
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

// ... [DomainSetupGuide Component remains exactly the same as provided] ...
function DomainSetupGuide({ domain }: { domain: string }) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          Setup Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Setup Guide for {domain}</DialogTitle>
          <DialogDescription>
            Step-by-step instructions to add required DNS records and verify your domain.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 text-sm">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Detecting DNS provider and nameservers...</span>
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              <p>
                <strong>Detected DNS provider: </strong>
                {provider ?? "Not detected"}{" "}
                {nameservers ? (
                  <span className="text-muted-foreground">({nameservers.join(", ")})</span>
                ) : null}
              </p>

              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Make sure your domain is already added in the dashboard (Add Domain).
                </li>
                <li>
                  Login to your DNS provider ({provider ?? "your registrar/DNS panel"}).
                </li>
                <li>
                  Add or update the following DNS records:
                  <ul className="list-disc ml-5 mt-1">
                    <li>
                      <strong>MX:</strong> <code>mx.freecustom.email</code> (priority default)
                    </li>
                    <li>
                      <strong>TXT:</strong> The verification token shown in your dashboard for this domain (starts with <code>freecustomemail-verification=</code>)
                    </li>
                  </ul>
                </li>
                <li>Wait for DNS propagation (can be a few minutes or up to 24 hours depending on provider).</li>
                <li>Come back to this dashboard and click <strong>Verify</strong>.</li>
              </ol>

              <p className="text-muted-foreground text-xs mt-2">
                Tip: If verification fails, ensure there are no conflicting TXT/MX entries and that you added the TXT for the root/apex (not a subdomain) unless instructed otherwise.
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ... [normalizeDomain function remains exactly the same] ...
function normalizeDomain(input: Partial<CustomDomain> & { domain?: string }): CustomDomain | null {
  if (!input || !input.domain) return null;
  return {
    domain: input.domain,
    verified: !!input.verified,
    mxRecord: input.mxRecord ?? "mx.freecustom.email",
    txtRecord: input.txtRecord ?? "",
  };
}


/**
 * Main component
 */
export function CustomDomainManager({ initialDomains, isPro }: CustomDomainManagerProps) {
  const { data: session } = useSession();
  const user = session?.user;
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

  // Add domain
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro) {
        openUpsell("Custom Domains");
        return;
    }
    if (!newDomain || !user) return;
    setIsLoading(true);
    const toastId = toast.loading("Adding domain...");
    try {
      const response = await fetch("/api/user/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain, wyiUserId: user.id }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || "Failed to add domain.");
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
      toast.success("Domain added successfully!", { id: toastId });
    } catch (error: any) {
      console.error("Add domain error:", error);
      toast.error(error?.message ?? "Failed to add domain", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete domain
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
        throw new Error(result?.message || "Failed to delete domain.");
      }

      setDomains((prev) => prev.filter((d) => d.domain !== domainToDelete));
      toast.success("Domain deleted.", { id: toastId });
    } catch (error: any) {
      console.error("Delete domain error:", error);
      toast.error(error?.message ?? "Failed to delete domain", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify domain
  const handleVerifyDomain = async (domainToVerify: string) => {
    if (!isPro) {
        openUpsell("Domain Verification");
        return;
    }
    if (!user) return;
    setVerifyingDomain(domainToVerify);
    const toastId = toast.loading(`Verifying ${domainToVerify}...`);
    try {
      const response = await fetch("/api/user/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainToVerify, wyiUserId: user.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || "Verification failed.");
      }

      if (result?.success && result?.verified) {
        setDomains((prev) =>
          prev.map((d) => (d.domain === domainToVerify ? { ...d, verified: true } : d))
        );
        toast.success("Domain verified successfully!", { id: toastId });
      } else {
        const returned = normalizeDomain(result?.data ?? {});
        if (returned && returned.domain === domainToVerify && returned.verified) {
          setDomains((prev) => prev.map((d) => (d.domain === domainToVerify ? returned : d)));
          toast.success("Domain verified successfully!", { id: toastId });
        } else {
          throw new Error(
            result?.message ||
              "DNS record not found or not propagated yet. Please try again in a few minutes."
          );
        }
      }
    } catch (error: any) {
      console.error("Verify domain error:", error);
      toast.error(error?.message ?? "Verification failed.", { id: toastId });
    } finally {
      setVerifyingDomain(null);
    }
  };

  const copyToClipboard = (text: string | undefined, label: string) => {
    if (!text) {
      toast.error("Nothing to copy.");
      return;
    }
    try {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      console.error("Copy failed", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <>
        <Card className={!isPro ? "opacity-90 relative overflow-hidden" : ""}>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                    Manage Custom Domains
                    {!isPro && <Lock className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
                <CardDescription>Add and verify your custom domains to receive emails.</CardDescription>
            </div>
            {!isPro && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    <Crown className="w-3 h-3 mr-1" /> Pro Feature
                </Badge>
            )}
        </CardHeader>
        <CardContent>
            {/* ADD DOMAIN FORM */}
            <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row gap-2 mb-6">
            <Input
                placeholder="your-domain.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                disabled={isLoading}
                className="w-full sm:flex-1"
            />
            <div className="flex gap-2">
                <Button type="submit" disabled={isLoading || !newDomain}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Domain
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
                    toast.success("Domains refreshed.");
                    } catch (err) {
                    toast.error("Failed to refresh domains.");
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
                        {d.verified ? "Verified" : "Pending"}
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDomain(d.domain)} disabled={isLoading} className="ml-2 flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </CardHeader>

                    <CardContent className="flex-grow space-y-4">
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p className="font-semibold text-foreground">Required DNS Records</p>
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
                            <span className="font-bold">TXT:</span> {d.txtRecord || <em>(will be generated)</em>}
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
                            Verify
                        </Button>
                        )}
                        <DomainSetupGuide domain={d.domain} />
                    </div>
                    </CardContent>
                </Card>
                ))
            ) : (
                <div className="text-center col-span-full py-12 border rounded-md border-dashed">
                    <h3 className="text-lg font-medium">No custom domains added</h3>
                    <p className="text-sm text-muted-foreground">
                        {isPro ? "Add your first domain to get started." : "Upgrade to Pro to add your own domains."}
                    </p>
                </div>
            )}
            </div>
        </CardContent>
        
        {/* Helper overlay for non-pro if list is empty, optional style choice, currently handled by toast/modal interactions */}
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