// app/account-deleted/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { signOut } from "next-auth/react";

export default function AccountDeletedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.deletion_status === "permanent") {
      signOut({ redirect: false });
    }
  }, [status, session?.user?.deletion_status]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">

          {/* Top rule */}
          <div className="border-t border-border mb-8" />

          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
            Account · Permanently Deleted
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
            Account deleted
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Your account has been permanently deleted. All personal data has been removed from our systems.
          </p>

          <div className="border-t border-border mb-8" />

          <Button asChild className="w-full">
            <Link href="/">Back to home</Link>
          </Button>

        </div>
      </div>
    </ThemeProvider>
  );
}