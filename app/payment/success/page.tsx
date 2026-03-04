"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

// Redirect to dashboard immediately. Plan is loaded from backend (user/me, api-status)
// on the dashboard — we do not rely on session for plan or make the user wait.
const REDIRECT_DELAY_MS = 400;

export default function PaymentSuccessPage() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const t = setTimeout(() => {
      window.location.href = "/dashboard";
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

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
            <p className="text-xs text-muted-foreground/70">Your plan will update there.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
