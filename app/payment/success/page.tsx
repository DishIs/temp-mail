"use client";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from "react-hot-toast";
import { useSession } from 'next-auth/react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update } = useSession();

  const subscriptionId = searchParams.get('subscription_id');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const hasRun = useRef(false);

  useEffect(() => {
    if (!subscriptionId || hasRun.current) return;
    hasRun.current = true;

    const verifySubscription = async () => {
      const toastId = toast.loading("Verifying subscription...");
      try {
        const res = await fetch('/api/paypal/verify-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId }),
        });

        const data = await res.json();

        if (data.success) {
          await update();
          setStatus('success');
          toast.success("Welcome to Pro! Subscription active.", { id: toastId });
          setTimeout(() => { window.location.href = '/dashboard'; }, 3000);
        } else {
          setStatus('error');
          toast.error("Activation Failed: " + (data.error || "Unknown error"), { id: toastId });
        }
      } catch (error) {
        setStatus('error');
        toast.error("Network error during verification", { id: toastId });
      }
    };

    verifySubscription();
  }, [subscriptionId, router, update]);

  return (
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
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle>Activating Subscription</CardTitle>
        </CardHeader>
        <Suspense fallback={
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        }>
          <PaymentSuccessContent />
        </Suspense>
      </Card>
    </div>
  );
}