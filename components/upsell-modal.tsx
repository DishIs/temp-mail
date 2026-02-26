// components/upsell-modal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface UpsellModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

export function UpsellModal({ isOpen, onClose, featureName = "This Feature" }: UpsellModalProps) {
    const router = useRouter();
    const { data: session } = useSession();

    const handleCta = () => {
        onClose();
        if (!session) {
            router.push(`/auth?callbackUrl=${encodeURIComponent('/pricing')}`);
        } else {
            router.push('/pricing');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] text-center">
                <div className="flex justify-center mb-4 mt-2">
                    <div className="h-16 w-16 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-full flex items-center justify-center">
                        <Lock className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                    </div>
                </div>

                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                        Unlock {featureName}
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        {featureName} is available exclusively to <strong>Pro</strong> members.{" "}
                        Try it free for 3 days — no charge until day 4.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/50 rounded-lg p-4 my-4 text-left space-y-2">
                    <div className="font-semibold text-sm mb-2 text-muted-foreground">Pro includes:</div>
                    <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Custom Domains & Prefixes
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Permanent Cloud Storage
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> 25MB Attachments
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:gap-0 items-center">
                    <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        onClick={handleCta}
                    >
                        <Crown className="mr-2 h-4 w-4" />
                        {session ? "Start 3-day free trial" : "Sign up & start free trial"}
                    </Button>
                    <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
                        Maybe Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}