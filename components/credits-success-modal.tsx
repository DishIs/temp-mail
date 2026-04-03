"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Check, ArrowRight, X, Code, Shield, Bot, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CreditsSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditsAmount?: number;
}

const USE_CASES = [
  { icon: Code, label: "OTP Verification", href: "/api/use-cases/otp" },
  { icon: Shield, label: "Security Testing", href: "/api/use-cases/security-testing" },
  { icon: Bot, label: "AI & Automation", href: "/api/use-cases/ai-agents" },
  { icon: Globe, label: "Web Scraping", href: "/api/use-cases/web-scraping" },
];

export function CreditsSuccessModal({
  isOpen,
  onClose,
  creditsAmount = 20000,
}: CreditsSuccessModalProps) {
  const router = useRouter();

  const handleGoToApiDashboard = () => {
    onClose();
    router.push("/api/dashboard");
  };

  const handleGoToHome = () => {
    onClose();
    router.push("/");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0 bg-background border border-border rounded-lg">
        {/* Close button - custom positioned */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-md p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header with icon */}
        <div className="border-b border-border px-7 py-6 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
            <Zap className="h-7 w-7 text-emerald-500" />
          </div>
          
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-0.5 h-3 bg-border" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Payment Successful
            </span>
            <div className="w-0.5 h-3 bg-border" aria-hidden />
          </div>
          
          <DialogHeader className="p-0 space-y-2 text-center">
            <DialogTitle className="text-xl font-bold text-foreground leading-snug">
              You&apos;re now a Pro member!
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Welcome to the family. Your Pro features are ready.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Credits highlight */}
        <div className="px-7 py-5 bg-emerald-500/5 border-b border-emerald-500/20">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-emerald-500" />
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {creditsAmount.toLocaleString()} API Credits
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Free bonus worth $1 · Credits never expire
          </p>
        </div>

        {/* Features list */}
        <div className="divide-y divide-border">
          {[
            "Permanent inbox storage",
            "Auto OTP extraction",
            "Custom domains",
            "Fresh unblocked domains",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3 px-7 py-3"
            >
              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>

        {/* Use Cases */}
        <div className="px-7 py-5 border-b border-border bg-muted/10">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 text-center">
            Popular Use Cases
          </p>
          <div className="grid grid-cols-2 gap-2">
            {USE_CASES.map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-2 p-3 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors group"
              >
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="border-t border-border px-7 py-5 space-y-3">
          <Button 
            size="lg" 
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            onClick={handleGoToApiDashboard}
          >
            <Zap className="h-4 w-4" />
            Create API Key & Start Using
            <ArrowRight className="ml-auto h-4 w-4 opacity-40" />
          </Button>
          
          <button
            onClick={handleGoToHome}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Go to Inbox instead
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
