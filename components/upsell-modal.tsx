// components/modals.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Two modals, one visual shell:
//   <UpsellModal />   — prompts upgrade to Pro
//   <AuthNeed />      — prompts sign-in (then redirects to pricing)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Lock, EyeOff, Shield, Zap, ArrowRight, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// ─── Shared modal shell ───────────────────────────────────────────────────────
interface ModalShellProps {
  isOpen:       boolean;
  onClose:      () => void;
  icon:         React.ReactNode;
  sectionLabel: string;
  title:        string;
  description:  string;
  bullets:      { icon: React.ReactNode; label: string }[];
  ctaLabel:     string;
  onCta:        () => void;
}

function ModalShell({
  isOpen, onClose,
  icon, sectionLabel, title, description,
  bullets, ctaLabel, onCta,
}: ModalShellProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden gap-0 bg-background border border-border rounded-lg">

        {/* ── Header ── */}
        <div className="border-b border-border px-7 py-6 flex items-start gap-4">
          <div className="mt-0.5 shrink-0 h-9 w-9 rounded-md border border-border bg-muted/30 flex items-center justify-center">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-0.5 h-3 bg-border" aria-hidden />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {sectionLabel}
              </span>
            </div>
            <DialogHeader className="p-0 space-y-1 text-left">
              <DialogTitle className="text-base font-semibold text-foreground leading-snug">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* ── Bullets ── */}
        <div className="divide-y divide-border">
          {bullets.map(({ icon: bIcon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-7 py-3 hover:bg-muted/10 transition-colors"
            >
              <span className="shrink-0 text-muted-foreground/60">{bIcon}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
              <Check className="ml-auto h-3.5 w-3.5 text-foreground/50 shrink-0" />
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className="border-t border-border px-7 py-5 space-y-2.5">
          <Button size="lg" className="w-full gap-2" onClick={onCta}>
            {icon}
            {ctaLabel}
            <ArrowRight className="ml-auto h-4 w-4 opacity-40" />
          </Button>
          <button
            onClick={onClose}
            className="w-full text-center text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Maybe later
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

// ─── UpsellModal — Pro upgrade ────────────────────────────────────────────────
const PRO_BULLETS = [
  { icon: <Shield  className="h-3.5 w-3.5" />, label: "Emails kept forever + 5 GB storage" },
  { icon: <Zap     className="h-3.5 w-3.5" />, label: "Auto OTP extraction & verify links" },
  { icon: <Crown   className="h-3.5 w-3.5" />, label: "Custom domains & private inboxes"   },
  { icon: <EyeOff  className="h-3.5 w-3.5" />, label: "Completely ad-free"                 },
];

export function UpsellModal({
  isOpen,
  onClose,
  featureName = "This Feature",
}: {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      icon={<Crown className="h-4 w-4 text-muted-foreground" />}
      sectionLabel="Pro feature"
      title={`Unlock ${featureName}`}
      description={`${featureName} is available exclusively to Pro members. Try it free for 3 days — no charge until day 4.`}
      bullets={PRO_BULLETS}
      ctaLabel={session ? "Start 3-day free trial" : "Sign up & start free trial"}
      onCta={() => {
        onClose();
        const source = "email_box";
        router.push(session ? `/pricing?source=${source}` : `/auth?callbackUrl=${encodeURIComponent(`/pricing?source=${source}`)}`);
      }}
    />
  );
}

// ─── AuthNeed — sign-in gate ──────────────────────────────────────────────────
const AUTH_BULLETS = [
  { icon: <Shield   className="h-3.5 w-3.5" />, label: "Save inbox history across devices"  },
  { icon: <Crown    className="h-3.5 w-3.5" />, label: "Custom domains & prefixes"          },
  { icon: <Zap      className="h-3.5 w-3.5" />, label: "Permanent cloud storage"            },
  { icon: <EyeOff   className="h-3.5 w-3.5" />, label: "25 MB attachments & ad-free"       },
];

export function AuthNeed({
  isOpen,
  onClose,
  featureName = "This Feature",
}: {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      icon={<UserRound className="h-4 w-4 text-muted-foreground" />}
      sectionLabel="Sign in required"
      title={`Sign in to use ${featureName}`}
      description={
        session
          ? "Upgrade to Pro to access this feature and everything else we offer."
          : "Create a free account or sign in — it only takes a few seconds."
      }
      bullets={AUTH_BULLETS}
      ctaLabel={session ? "View upgrade options" : "Sign in / Create account"}
      onCta={() => {
        onClose();
        router.push(session ? "/pricing" : `/auth?callbackUrl=${encodeURIComponent("/pricing")}`);
      }}
    />
  );
}

export function RateLimitModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      icon={<Zap className="h-4 w-4 text-amber-500" />}
      sectionLabel="Free Tier Limit"
      title="You've reached your limit"
      description="You're hitting Free tier limits. Upgrade to Developer plan for instant, high-speed API access."
      bullets={PRO_BULLETS}
      ctaLabel={session ? "Upgrade to Developer Plan" : "Sign up to Upgrade"}
      onCta={() => {
        onClose();
        router.push(session ? "/pricing" : `/auth?callbackUrl=${encodeURIComponent("/pricing")}`);
      }}
    />
  );
}