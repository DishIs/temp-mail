// components/upsell-modal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Lock, EyeOff, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

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
}: UpsellModalProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const handleCta = () => {
    onClose();
    router.push(
      session
        ? "/pricing"
        : `/auth?callbackUrl=${encodeURIComponent("/pricing")}`
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/*
        ── Override DialogContent to use our design tokens.
           No gradients, no amber fills — just border / bg / font-mono system.
      */}
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden gap-0 bg-background border border-border rounded-lg">

        {/* ── Top stripe: lock icon + title ── */}
        <div className="border-b border-border px-7 py-6 flex items-start gap-4">
          {/* Icon cell */}
          <div className="mt-0.5 shrink-0 h-9 w-9 rounded-md border border-border bg-muted/30 flex items-center justify-center">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Text */}
          <div className="min-w-0">
            {/* Section marker */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-0.5 h-3 bg-border" aria-hidden />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Pro feature
              </span>
            </div>
            <DialogTitle className="text-base font-semibold text-foreground leading-snug">
              Unlock {featureName}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {featureName} is available exclusively to{" "}
              <span className="font-semibold text-foreground">Pro</span> members.
              Try it free for 3 days — no charge until day 4.
            </DialogDescription>
          </div>
        </div>

        {/* ── Pro bullets: gap-px grid rows ── */}
        <div className="divide-y divide-border">
          {PRO_BULLETS.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3 px-7 py-3 hover:bg-muted/10 transition-colors">
              <span className="shrink-0 text-muted-foreground/60">{icon}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
              <Check className="ml-auto h-3.5 w-3.5 text-foreground shrink-0" />
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className="border-t border-border px-7 py-5 space-y-2.5">
          <Button size="lg" className="w-full" onClick={handleCta}>
            <Crown className="mr-2 h-4 w-4" />
            {session ? "Start 3-day free trial" : "Sign up & start free trial"}
          </Button>
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Maybe later
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}