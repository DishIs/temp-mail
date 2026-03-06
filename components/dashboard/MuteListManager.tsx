// components/dashboard/MuteListManager.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { UpsellModal } from "@/components/upsell-modal";
import { useTranslations } from "next-intl";

interface MuteListManagerProps {
  initialSenders: string[];
  isPro: boolean;
}

export function MuteListManager({ initialSenders, isPro }: MuteListManagerProps) {
  const t = useTranslations("Dashboard");
  const { data: session } = useSession();
  const user = session?.user;
  const [mutedSenders, setMutedSenders] = useState<string[]>(initialSenders || []);
  const [newSender, setNewSender] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);

  const handleMuteSender = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPro) {
      setIsUpsellOpen(true);
      return;
    }

    if (!newSender || !user) return;
    setIsLoading(true);
    const toastId = toast.loading(`${t("mute_btn")} ${newSender}...`);

    try {
      const response = await fetch("/api/user/mute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderToMute: newSender, wyiUserId: user.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to mute sender.");

      setMutedSenders([...mutedSenders, newSender]);
      setNewSender("");
      toast.success(t("mute_success"), { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnmuteSender = async (senderToUnmute: string) => {
    if (!isPro) {
      setIsUpsellOpen(true);
      return;
    }

    if (!user) return;
    setIsLoading(true);
    const toastId = toast.loading(`Un-muting ${senderToUnmute}...`);

    try {
      const response = await fetch("/api/user/mute", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderToUnmute, wyiUserId: user.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to un-mute sender.");

      setMutedSenders(mutedSenders.filter((s) => s !== senderToUnmute));
      toast.success(t("unmute_success"), { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t("mute_title")}
          </p>
          {!isPro && (
            <button
              onClick={() => setIsUpsellOpen(true)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Lock className="h-3 w-3" />
              Pro
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-5">{t("mute_desc")}</p>

        <div className="border-t border-border" />

        {/* Add sender form */}
        <form onSubmit={handleMuteSender} className="flex gap-2 mt-5 mb-6">
          <Input
            placeholder={t("mute_placeholder")}
            value={newSender}
            onChange={(e) => setNewSender(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={isLoading || !newSender}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("mute_btn")}
          </Button>
        </form>

        {/* Muted senders list */}
        <div className="space-y-0 min-h-[8rem]">
          {mutedSenders.length > 0 ? (
            mutedSenders.map((sender) => (
              <div
                key={sender}
                className="border-t border-border py-3 flex items-center justify-between gap-3"
              >
                <span className="text-sm font-mono text-foreground truncate">{sender}</span>
                <button
                  onClick={() => handleUnmuteSender(sender)}
                  disabled={isLoading}
                  className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="border-t border-border pt-8 text-center">
              <p className="text-sm text-muted-foreground">{t("mute_empty")}</p>
              {!isPro && (
                <p className="text-xs text-muted-foreground mt-1">{t("mute_empty_upsell")}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <UpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        featureName="Mute Senders"
      />
    </>
  );
}