"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const { data: session, status, update } = useSession();
  const hasStarted = useRef(false);
  const [loadingText, setLoadingText] = useState("Verifying payment status...");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Wait until session is loaded before we start doing anything
    if (status !== "authenticated" || hasStarted.current) return;
    hasStarted.current = true;

    const verifyProStatus = async () => {
      let attempts = 0;
      const maxAttempts = 5; // Up to ~10 seconds of waiting for the webhook
      let isPro = session?.user?.plan === "pro";

      // Keep asking the server for an updated session until we see "pro"
      while (!isPro && attempts < maxAttempts) {
        setLoadingText(
          attempts === 0 
            ? "Verifying payment status..." 
            : "Waiting for payment provider confirmation..."
        );

        // Forces the NextAuth JWT callback to run (trigger === 'update')
        const newSession = await update();
        
        if (newSession?.user?.plan === "pro") {
          isPro = true;
          break;
        }

        // If still not Pro, wait 2 seconds and try again (giving the webhook time)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      }

      // Success achieved or timeout reached.
      setIsSuccess(true);
      setLoadingText("Success! Taking you to your dashboard...");

      // Final redirect
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    };

    verifyProStatus();
  }, [status, update, session]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle>Payment received</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-5 py-8">
          {isSuccess ? (
            <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" />
          ) : (
            <Loader2 className="h-16 w-16 text-amber-500 animate-spin" />
          )}
          
          <div className="space-y-2">
            <p className="text-muted-foreground transition-all duration-300">
              {loadingText}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
              Please do not close this page
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}