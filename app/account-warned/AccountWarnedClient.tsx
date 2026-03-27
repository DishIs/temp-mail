// app/account-warned/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { Loader2, AlertTriangle, ArrowRight } from "lucide-react";

export default function AccountWarnedClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user as any;
  const banStatus = user?.banStatus;
  const banReason = user?.banReason || "Suspicious activity detected.";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth?callbackUrl=/account-warned");
      return;
    }
    if (status === "authenticated" && banStatus !== "warned") {
      router.replace("/");
      return;
    }
  }, [status, banStatus, router]);

  const handleContinue = () => {
    // Set a session flag to allow bypassing the redirect for this session
    sessionStorage.setItem("warning_acknowledged", "true");
    router.push("/");
  };

  if (status === "loading" || (status === "authenticated" && banStatus !== "warned")) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">

          <div className="border-t border-amber-500 mb-8" />

          <p className="text-xs font-medium uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Account · Warning
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
            Security warning
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {banReason}
          </p>

          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Further violations of our policies may result in a permanent ban and cancellation of all active subscriptions.
          </p>

          <div className="border-t border-border mb-8" />

          <Button
            className="w-full mb-8 bg-foreground text-background hover:opacity-90"
            onClick={handleContinue}
          >
            I understand, continue to site
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            <Link
              href="/policies/terms"
              className="underline underline-offset-4 decoration-border hover:decoration-foreground hover:text-foreground transition-colors"
            >
              Terms of service
            </Link>
          </p>

        </div>
      </div>
    </ThemeProvider>
  );
}
