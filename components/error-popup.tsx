// ─────────────────────────────────────────────────────────────────────────────
// components/error-popup.tsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ErrorPopupProps {
  message: string;
  onClose: () => void;
}

export function ErrorPopup({ message, onClose }: ErrorPopupProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onClose(); }, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex items-start gap-3 max-w-sm w-full rounded-lg border border-border bg-background px-4 py-3.5 shadow-lg">
      <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <p className="flex-1 text-sm text-foreground leading-snug">{message}</p>
      <button onClick={() => { setVisible(false); onClose(); }}
        className="shrink-0 h-6 w-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
        <X className="h-3 w-3" />
      </button>
      {/* auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-px rounded-b-lg overflow-hidden">
        <div className="h-full bg-border animate-[shrink_5s_linear_forwards]"
          style={{ animationName: "shrink" }} />
      </div>
    </div>
  );
}

