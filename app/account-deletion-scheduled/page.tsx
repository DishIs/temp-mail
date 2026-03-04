"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeProvider } from "@/components/theme-provider";
import { AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
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

  if (status === "loading" || (status === "authenticated" && session?.user?.deletion_status !== "scheduled")) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Account scheduled for deletion</CardTitle>
            </div>
            <CardDescription>
              Your account is set to be permanently deleted
              {scheduledAt ? ` on ${scheduledAt.toLocaleDateString(undefined, { dateStyle: "long" })}` : " in 7 days"}.
              {canRestoreUntil && (
                <span className="block mt-1">
                  You can cancel deletion until {canRestoreUntil.toLocaleDateString(undefined, { dateStyle: "long" })}.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We sent a confirmation email with a restore link. You can also cancel deletion below.
            </p>
            <Button
              className="w-full"
              onClick={handleRestore}
              disabled={restoring}
            >
              {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Do not delete my account
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              <Link href="/policies/privacy" className="underline hover:no-underline">
                Privacy policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
}
