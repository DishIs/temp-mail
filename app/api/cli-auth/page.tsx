"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle2, AlertCircle, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function CliAuthContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callback") ?? "";

  const [phase, setPhase] = useState<"loading" | "redirecting" | "creating" | "done" | "error" | "limit-reached">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setPhase("redirecting");
      const currentUrl = new URL(window.location.href);
      const authUrl = new URL("/auth", window.location.origin);
      authUrl.searchParams.set("callbackUrl", currentUrl.pathname + currentUrl.search);
      window.location.href = authUrl.toString();
      return;
    }

    if (status === "authenticated") {
      createKeyAndRedirect();
    }
  }, [status]);

  async function createKeyAndRedirect(forceCleanup = false) {
    if (forceCleanup) setIsCleaningUp(true);
    setPhase("creating");
    
    try {
      const res = await fetch("/api/internal/cli-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "CLI key", forceCleanup }),
      });
      
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error === "max_keys") {
          setPhase("limit-reached");
          return;
        }
        throw new Error(data.message || "Failed to create API key");
      }
      
      const { key } = data;

      if (callbackURL) {
        try {
          const target = new URL(callbackURL);
          target.searchParams.set("api_key", key);
          setPhase("done");
          setTimeout(() => {
            window.location.href = target.toString();
          }, 1000);
        } catch (e) {
          console.error("Invalid callback URL", e);
          setPhase("done");
        }
      } else {
        setPhase("done");
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Something went wrong");
      setPhase("error");
    } finally {
      setIsCleaningUp(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-border rounded-xl p-8 bg-card shadow-sm text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
             <Loader2 className={`h-5 w-5 ${phase === 'done' ? 'text-green-500' : 'animate-spin text-primary'}`} />
          </div>
        </div>

        {phase === "loading" && <p className="font-mono text-xs text-muted-foreground">Checking session…</p>}
        {phase === "redirecting" && <p className="font-mono text-xs text-muted-foreground">Redirecting to login…</p>}
        {phase === "creating" && <p className="font-mono text-xs text-muted-foreground">{isCleaningUp ? "Cleaning up and creating key…" : "Creating your CLI access key…"}</p>}
        
        {phase === "limit-reached" && (
          <div className="space-y-4">
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold">API Key Limit Reached</h3>
            <p className="text-xs text-muted-foreground px-2 leading-relaxed">
              You've reached the limit of 5 API keys. To continue, you can delete your previous CLI keys or manage them in the dashboard.
            </p>
            <div className="grid gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="font-mono text-xs h-9 gap-2"
                onClick={() => createKeyAndRedirect(true)}
                disabled={isCleaningUp}
              >
                {isCleaningUp ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Overwrite Existing "CLI key"s
              </Button>
              <Button 
                asChild
                variant="ghost" 
                size="sm" 
                className="font-mono text-xs h-9 gap-2"
              >
                <Link href="/dashboard/api" target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Manage in Dashboard
                </Link>
              </Button>
            </div>
          </div>
        )}

        {phase === "done" && (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Authenticated</h3>
            <p className="font-mono text-xs text-muted-foreground">
              {callbackURL ? "Returning to terminal…" : "You can close this tab."}
            </p>
          </>
        )}

        {phase === "error" && (
          <>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Error</h3>
            <p className="font-mono text-xs text-muted-foreground mb-4">{errorMsg}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs underline font-mono text-muted-foreground hover:text-foreground"
            >
              Try again
            </button>
          </>
        )}

        <div className="mt-8 pt-4 border-t border-border">
          <p className="font-mono text-[10px] text-muted-foreground/40">
            fce login · freecustom.email
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CliAuthPage() {
  return (
    <Suspense fallback={null}>
      <CliAuthContent />
    </Suspense>
  );
}
