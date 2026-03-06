// ─────────────────────────────────────────────────────────────────────────────
// components/qr-code-modal.tsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface QRCodeModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ email, isOpen, onClose }: QRCodeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={[
          "sm:max-w-[320px] p-0 gap-0 overflow-hidden",
          "bg-background border border-border rounded-lg",
          "[&>button:first-of-type]:hidden",
        ].join(" ")}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
            <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
            <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
            Scan to send
          </span>
          <button onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center justify-center px-8 py-8 gap-5">
          <div className="p-4 rounded-lg border border-border bg-background dark:bg-white">
            <QRCodeSVG value={`mailto:${email}`} size={168} level="L" />
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Send email to
            </p>
            <p className="font-mono text-xs text-foreground break-all">{email}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}