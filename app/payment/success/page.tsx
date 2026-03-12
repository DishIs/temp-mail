"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

// Redirect delay for UX purposes (so the checkmark is visible briefly)
const REDIRECT_DELAY_MS = 400;

export default function PaymentSuccessPage() {
  const done = useRef(false);
  
  // 1. Pull in the update method from NextAuth
  const { update } = useSession();

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const processPaymentSuccess = async () => {
      // 2. Await the session update.
      // This forces the NextAuth JWT callback to run with trigger === 'update',
      // ignoring the 5-minute cache and securely fetching the new plan.
      await update();

      // 3. Redirect ONLY after the cookie has been successfully rewritten.
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, REDIRECT_DELAY_MS);
    };

    processPaymentSuccess();
  }, [update]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle>Payment received</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" />
          <div className="space-y-2">
            <p className="text-muted-foreground">Taking you to your dashboard…</p>
            <p className="text-xs text-muted-foreground/70">Your plan is being updated securely.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}