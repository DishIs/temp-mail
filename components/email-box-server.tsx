// components/email-box-server.tsx
// Async Server Component — runs fetchServerProfile in a Suspense boundary so
// it never blocks the page shell. The parent renders <EmailBoxSkeleton /> as
// the fallback while this resolves, then swaps in the real EmailBox.

import { EmailBox } from "./email-box";
import { callInternalAPI } from "@/lib/api";
import type { ServerProfile } from "@/app/[locale]/page";

// ── Internal fetch with a hard timeout ────────────────────────────────────────
// If the DB takes longer than PROFILE_TIMEOUT_MS we give up and return null.
// EmailBox will then fall back to its own client-side profile fetch, which is
// already built-in. The user sees the skeleton for at most PROFILE_TIMEOUT_MS.
const PROFILE_TIMEOUT_MS = 2500;

async function fetchServerProfile(
  userId: string,
  plan: string,
): Promise<ServerProfile | null> {
  try {
    const data = await Promise.race([
      callInternalAPI(
        `/user/profile/${userId}`,
        { method: "GET" },
        { id: userId },
      ),
      // Timeout sentinel — resolves to null, never rejects
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), PROFILE_TIMEOUT_MS),
      ),
    ]);

    if (!data?.user) return null;

    const user = data.user;
    return {
      inboxes: Array.isArray(user.inboxes) ? user.inboxes : [],
      customDomains: Array.isArray(user.customDomains)
        ? user.customDomains.filter(
            (d: { verified?: boolean }) => d.verified === true,
          )
        : [],
      plan: (plan as "free" | "pro" | "none") || "free",
      settings: user.settings ?? null,
      inboxNotes: user.inboxNotes ?? null,
    };
  } catch {
    // Non-fatal — EmailBox client-side fallback takes over
    return null;
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface EmailBoxServerProps {
  userId: string;
  plan: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
// This is intentionally async — Next.js streams it inside its Suspense boundary.
// The parent wraps it with <Suspense fallback={<EmailBoxSkeleton />}> so the
// rest of the page is never blocked.
export async function EmailBoxServer({ userId, plan }: EmailBoxServerProps) {
  const serverProfile = await fetchServerProfile(userId, plan);
  return <EmailBox serverProfile={serverProfile} />;
}