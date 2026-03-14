"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function CliAuthContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callback") ?? "";

  const [phase, setPhase] = useState<"loading" | "redirecting" | "creating" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setPhase("redirecting");
      // Redirect to the MAIN auth page, passing this page as the callbackUrl
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

  async function createKeyAndRedirect() {
    setPhase("creating");
    try {
      const res = await fetch("/api/internal/cli-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "CLI key" }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create API key");
      }
      
      const { key } = await res.json();

      // Redirect back to CLI local server
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
        {phase === "creating" && <p className="font-mono text-xs text-muted-foreground">Creating your CLI access key…</p>}
        
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
