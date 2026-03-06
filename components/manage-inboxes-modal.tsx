// ─────────────────────────────────────────────────────────────────────────────
// components/manage-inboxes-modal.tsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Inbox, X } from "lucide-react";

interface ManageInboxesModalProps {
  isOpen: boolean;
  onClose: () => void;
  inboxes: string[];
  onSelectInbox: (inbox: string) => void;
}

export function ManageInboxesModal({
  isOpen, onClose, inboxes, onSelectInbox,
}: ManageInboxesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={[
          "sm:max-w-[420px] p-0 gap-0 overflow-hidden",
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
            Manage inboxes
          </span>
          <button onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Label */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-xs text-muted-foreground">
            Select an inbox from your history to make it active.
          </p>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-72 mx-5 mb-5 border border-border rounded-lg divide-y divide-border">
          {inboxes.length > 0 ? (
            inboxes.map((inbox) => (
              <div key={inbox}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors">
                <span className="font-mono text-xs text-foreground truncate pr-3">{inbox}</span>
                <Button variant="outline" size="sm"
                  className="shrink-0 font-mono text-[10px] uppercase tracking-widest h-7 px-3"
                  onClick={() => { onSelectInbox(inbox); onClose(); }}>
                  Use
                </Button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Inbox className="h-6 w-6 text-muted-foreground/40" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                No saved inboxes
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
