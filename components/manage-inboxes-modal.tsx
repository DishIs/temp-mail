"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Inbox, X, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManageInboxesModalProps {
  isOpen: boolean;
  onClose: () => void;
  inboxes: string[];
  onSelectInbox: (inbox: string) => void;
  onDeleteInbox?: (inbox: string) => void;
}

export function ManageInboxesModal({
  isOpen, onClose, inboxes, onSelectInbox, onDeleteInbox,
}: ManageInboxesModalProps) {
  const [confirmingInbox, setConfirmingInbox] = useState<string | null>(null);

  const handleDeleteClick = (inbox: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmingInbox === inbox) {
      onDeleteInbox?.(inbox);
      setConfirmingInbox(null);
    } else {
      setConfirmingInbox(inbox);
    }
  };

  const cancelConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingInbox(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) { setConfirmingInbox(null); onClose(); }
      }}
    >
      <DialogContent
        className={[
          "sm:max-w-[420px] p-0 gap-0 overflow-hidden",
          "bg-background border border-border rounded-lg",
          "[&>button:first-of-type]:hidden",
        ].join(" ")}
      >
        {/* ── Title bar ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
            <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
            <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex-1">
            Manage inboxes
          </span>
          <button
            onClick={() => { setConfirmingInbox(null); onClose(); }}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Sub-label ──────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-xs text-muted-foreground">
            Select an inbox to make it active, or remove ones you no longer need.
          </p>
        </div>

        {/* ── List ───────────────────────────────────────────────────── */}
        <div className="overflow-y-auto max-h-72 mx-5 mb-5 border border-border rounded-lg divide-y divide-border">
          {inboxes.length > 0 ? (
            inboxes.map((inbox) => {
              const isConfirming = confirmingInbox === inbox;
              return (
                <div
                  key={inbox}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 transition-colors",
                    isConfirming ? "bg-red-500/5" : "hover:bg-muted/10",
                  )}
                >
                  {/* ── Inbox address ───────────────────────────────── */}
                  <span className="font-mono text-xs text-foreground truncate flex-1 min-w-0">
                    {inbox}
                  </span>

                  {/* ── Actions ─────────────────────────────────────── */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isConfirming ? (
                      /* Confirm row */
                      <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-150">
                        <span className="font-mono text-[10px] text-red-500 flex items-center gap-1 whitespace-nowrap">
                          <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                          Really delete?
                        </span>
                        {/* Confirm delete */}
                        <button
                          onClick={(e) => handleDeleteClick(inbox, e)}
                          className="h-6 px-2 rounded border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 font-mono text-[10px] hover:bg-red-500/20 transition-colors whitespace-nowrap"
                        >
                          Yes
                        </button>
                        {/* Cancel */}
                        <button
                          onClick={cancelConfirm}
                          className="h-6 px-2 rounded border border-border bg-background text-muted-foreground font-mono text-[10px] hover:bg-muted/40 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Delete — only shown if onDeleteInbox provided */}
                        {onDeleteInbox && (
                          <button
                            onClick={(e) => handleDeleteClick(inbox, e)}
                            className={cn(
                              "h-7 w-7 flex items-center justify-center rounded border border-transparent",
                              "text-muted-foreground/40 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/8",
                              "transition-all duration-150",
                            )}
                            title="Remove inbox"
                            aria-label="Remove inbox"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                        {/* Use */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 font-mono text-[10px] uppercase tracking-widest h-7 px-3"
                          onClick={() => { onSelectInbox(inbox); setConfirmingInbox(null); onClose(); }}
                        >
                          Use
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
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