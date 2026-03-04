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

    const deletionStatus = (session.user as { deletion_status?: string }).deletion_status;

    if (deletionStatus === "permanent") {
      if (!pathname?.startsWith("/account-deleted")) {
        signOut({ redirect: false }).then(() => router.replace("/account-deleted"));
      }
      return;
    }

    if (deletionStatus === "scheduled") {
      if (!pathname?.includes("account-deletion-scheduled")) {
        router.replace("/account-deletion-scheduled");
      }
    }
  }, [status, session?.user, pathname, router]);

  return <>{children}</>;
}
