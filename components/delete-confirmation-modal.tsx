// ─────────────────────────────────────────────────────────────────────────────
// components/delete-confirmation-modal.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dontAskAgain?: boolean) => void;
  itemToDelete: string;
  showDontAskAgain?: boolean;
}

export function DeleteConfirmationModal({
  isOpen, onClose, onConfirm, itemToDelete, showDontAskAgain
}: DeleteConfirmationModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
      else setDontAskAgain(false); // Reset state when opening
    }}>
      <DialogContent
        className={[
          "sm:max-w-[380px] p-0 gap-0 overflow-hidden",
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
            Confirm deletion
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 shrink-0 h-9 w-9 rounded-md border border-border bg-muted/20 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Delete this {itemToDelete}?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This action cannot be undone.
              </p>
            </div>
          </div>
          {showDontAskAgain && (
            <div className="flex items-center space-x-2 mt-2 ml-13 pl-13">
              <Checkbox 
                id="dontAskAgain" 
                checked={dontAskAgain} 
                onCheckedChange={(checked) => setDontAskAgain(checked === true)} 
              />
              <Label htmlFor="dontAskAgain" className="text-sm text-muted-foreground cursor-pointer">
                Don't ask again
              </Label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 flex justify-end gap-2 bg-muted/10">
          <Button variant="ghost" size="sm" onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest">
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onConfirm(dontAskAgain)}
            className="font-mono text-xs uppercase tracking-widest">
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


