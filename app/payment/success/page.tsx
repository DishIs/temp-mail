"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update } = useSession();
  const { toast } = useToast();
  
  // PayPal Subscription returns 'subscription_id'
  const subscriptionId = searchParams.get('subscription_id'); 
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const hasRun = useRef(false);

  useEffect(() => {
    if (!subscriptionId || hasRun.current) return;
    hasRun.current = true;

    const verifySubscription = async () => {
      try {
        const res = await fetch('/api/paypal/verify-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId }),
        });

        const data = await res.json();

        if (data.success) {
          // Trigger session update to get 'pro' status immediately
          await update();
          setStatus('success');
          
          toast({ title: "Welcome to Pro!", description: "Your subscription is active." });
          
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 3000);
        } else {
          console.error("Verification failed:", data);
          setStatus('error');
          toast({ variant: "destructive", title: "Activation Failed", description: data.error });
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus('error');
      }
    };

    verifySubscription();
  }, [subscriptionId, router, update, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Toaster />
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle>Activating Subscription</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          
          {status === 'verifying' && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-muted-foreground">Confirming subscription status with PayPal...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">You are now Pro!</h3>
                <p className="text-muted-foreground">Your persistent storage is ready.</p>
                <p className="text-xs text-muted-foreground/50">Redirecting to dashboard...</p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertTriangle className="h-16 w-16 text-destructive" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Verification Failed</h3>
                <p className="text-muted-foreground">We couldn't verify the subscription. Please contact support.</p>
                <Button onClick={() => router.push('/pricing')} variant="outline" className="mt-4">
                  Return to Pricing
                </Button>
              </div>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}