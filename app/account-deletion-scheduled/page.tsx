// app/account-deletion-scheduled/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

export default function AccountDeletionScheduledPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [restoring, setRestoring] = useState(false);

  const scheduledAt = session?.user?.deletion_scheduled_at
    ? new Date(session.user.deletion_scheduled_at)
    : null;
  const canRestoreUntil = session?.user?.can_restore_until
    ? new Date(session.user.can_restore_until)
    : null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth?callbackUrl=/account-deletion-scheduled");
      return;
    }
    if (status === "authenticated" && session?.user?.deletion_status !== "scheduled") {
      router.replace("/dashboard/profile");
      return;
    }
  }, [status, session?.user?.deletion_status, router]);

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await fetch("/api/user/restore-account", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Failed to cancel deletion.");
        return;
      }
      toast.success("Account deletion cancelled. Your account is active.");
      await update();
      router.replace("/dashboard/profile");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setRestoring(false);
    }
  };

  if (
    status === "loading" ||
    (status === "authenticated" && session?.user?.deletion_status !== "scheduled")
  ) {
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

          {/* Top rule */}
          <div className="border-t border-border mb-8" />

          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
            Account · Deletion Scheduled
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
            Account scheduled for deletion
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            Your account is set to be permanently deleted
            {scheduledAt
              ? ` on ${scheduledAt.toLocaleDateString(undefined, { dateStyle: "long" })}`
              : " in 7 days"}.
          </p>

          {canRestoreUntil && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              You can cancel deletion until{" "}
              {canRestoreUntil.toLocaleDateString(undefined, { dateStyle: "long" })}.
            </p>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            We sent a confirmation email with a restore link. You can also cancel deletion below.
          </p>

          <div className="border-t border-border mb-8" />

          <Button
            className="w-full mb-4"
            onClick={handleRestore}
            disabled={restoring}
          >
            {restoring ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Do not delete my account
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            <Link
              href="/policies/privacy"
              className="underline underline-offset-4 decoration-border hover:decoration-foreground hover:text-foreground transition-colors"
            >
              Privacy policy
            </Link>
          </p>

        </div>
      </div>
    </ThemeProvider>
  );
}