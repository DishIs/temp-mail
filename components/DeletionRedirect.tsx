"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "next-auth/react";

/**
 * When session has deletion_status === 'scheduled', redirect to /account-deletion-scheduled.
 * When deletion_status === 'permanent', sign out and redirect to /account-deleted.
 */
export function DeletionRedirect({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const user = session.user as any;
    const deletionStatus = user.deletion_status;
    const banStatus = user.banStatus;

    // 1. BAN CHECK (Highest priority)
    if (banStatus && banStatus !== "none" && banStatus !== "warned") {
      const allowedForBanned = pathname?.startsWith("/account-banned") || pathname?.startsWith("/contact") || pathname?.startsWith("/policies");
      if (!allowedForBanned) {
        router.replace("/account-banned");
      }
      return;
    }

    if (banStatus === "warned") {
      // Allow bypass if already acknowledged in this session
      const acknowledged = typeof window !== "undefined" && sessionStorage.getItem("warning_acknowledged") === "true";
      if (acknowledged) return;

      const allowedForWarned = pathname?.startsWith("/account-warned") || pathname?.startsWith("/contact") || pathname?.startsWith("/policies");
      if (!allowedForWarned) {
        router.replace("/account-warned");
      }
      return;
    }

    // 2. DELETION CHECK
    if (deletionStatus === "permanent") {
      if (!pathname?.startsWith("/account-deleted")) {
        signOut({ redirect: false }).then(() => router.replace("/account-deleted"));
      }
      return;
    }

    if (deletionStatus === "scheduled") {
      const allowedForScheduled = pathname?.startsWith("/account-deletion-scheduled") || pathname?.startsWith("/contact") || pathname?.startsWith("/policies");
      if (!allowedForScheduled) {
        router.replace("/account-deletion-scheduled");
      }
    }
  }, [status, session?.user, pathname, router]);

  return <>{children}</>;
}
