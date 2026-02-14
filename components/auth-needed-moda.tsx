// components/upsell-modal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface AuthNeedProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string; // Optional: Customize the text based on what they clicked (e.g. "Custom Domains")
}

export function AuthNeed({ isOpen, onClose, featureName = "This Feature" }: AuthNeedProps) {
    const router = useRouter();
    const { data: session } = useSession();

    const handleCta = () => {
        onClose();
        if (!session) {
            // Not logged in: Go to Auth, then redirect to Pricing
            router.push(`/auth?callbackUrl=${encodeURIComponent('/pricing')}`);
        } else {
            // Logged in but not Pro: Go directly to Pricing
            router.push('/pricing');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] text-center">
                <div className="flex justify-center mb-4 mt-2">
                    <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-amber-800/30 rounded-full flex items-center justify-center">
                        <Lock className="h-8 w-8 text-gray-600 dark:text-gray-500" />
                    </div>
                </div>
                
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                        Unlock {featureName}
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        {featureName} is available exclusively to <strong>Logged In</strong> users. Login now using Google, Github, or your email.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/50 rounded-lg p-4 my-4 text-left space-y-2">
                    <div className="font-semibold text-sm mb-2 text-muted-foreground">Pro Benefits include:</div>
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
                        className="w-full bg-gradient-to-r from-gray-500 to-gray-500 hover:from-gray-600 hover:to-gray-600 text-white"
                        onClick={handleCta}
                    >
                        <Crown className="mr-2 h-4 w-4" />
                        {session ? "View Upgrade Options" : "Login"}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={onClose}>
                        Maybe Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}