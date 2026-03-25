// app/account-banned/page.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { Loader2, Mail } from "lucide-react";

export default function AccountBannedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user as any;
  const banStatus = user?.banStatus;
  const banReason = user?.banReason || "Policy violation.";
  const contactEmail = user?.contactEmail || "support@freecustom.email";
  const contactNote = user?.contactNote || "To appeal this decision, email us with your account details. Bans are reviewed within 5 business days.";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth?callbackUrl=/account-banned");
      return;
    }
    if (status === "authenticated" && banStatus !== "banned") {
      router.replace("/");
      return;
    }
  }, [status, banStatus, router]);

  if (status === "loading" || (status === "authenticated" && banStatus !== "banned")) {
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

          <div className="border-t border-destructive mb-8" />

          <p className="text-xs font-medium uppercase tracking-widest text-destructive mb-4">
            Account · Permanently Banned
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
            Your account has been banned
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {banReason}
          </p>

          <div className="rounded-lg border border-border bg-muted/20 p-4 mb-8">
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              &ldquo;{contactNote}&rdquo;
            </p>
          </div>

          <div className="border-t border-border mb-8" />

          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={() => window.location.href = `mailto:${contactEmail}`}
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Support
          </Button>

          <Button
            variant="ghost"
            className="w-full mb-8 text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
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
