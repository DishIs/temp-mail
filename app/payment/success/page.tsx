"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

function PaymentSuccessContent() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const source = searchParams.get("source") || "direct";
  const provider = searchParams.get("provider");
  const isCrypto = provider === "nowpayments";
  const hasStarted = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || hasStarted.current) return;
    hasStarted.current = true;

    const verifyProStatus = async () => {
      let attempts = 0;
      const maxAttempts = 6;
      let isPro = session?.user?.plan === "pro";

      while (!isPro && attempts < maxAttempts && type !== "api") {
        const newSession = await update({ forceSync: Date.now() });
        
        if (newSession?.user?.plan === "pro") {
          isPro = true;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      }

      // Track the source to backend
      try {
        await fetch("/api/user/track-upsell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source }),
        });
      } catch (e) {
        console.error("Failed to track upsell source:", e);
      }

      // Store flag to show modal on destination page ONLY for non-API webapp upgrades
      if (type !== "api") {
        sessionStorage.setItem("just_upgraded", "true");
      }
      
      // Redirect to where they came from based on source
      const redirectUrl = type === "api" ? "/api/dashboard" : getRedirectUrl(source);
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    };

    verifyProStatus();
  }, [status, update, session, source, type]);

  const getRedirectUrl = (src: string): string => {
    switch (src) {
      case "email_box":
        return "/"; 
      case "dashboard":
        return "/dashboard"; 
      case "custom_domain":
        return "/dashboard"; 
      case "api_pricing":
        return "/api/dashboard";
      default:
        return "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Payment Successful!
        </h1>
        
        <p className="text-sm text-muted-foreground">
          Setting up your account...
        </p>
        
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mt-4">
          Please wait while we redirect you
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="h-20 w-20 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Processing Payment...</h1>
          <p className="text-sm text-muted-foreground">Please wait while we verify your payment.</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
