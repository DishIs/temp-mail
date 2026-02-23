"use client";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from "react-hot-toast";
import { useSession } from 'next-auth/react';

// ─── Paddle ───────────────────────────────────────────────────────────────────
// Strategy:
//   1. Poll session every 1.5 s (webhook may have already fired).
//   2. If plan is still not 'pro' after MAX_POLL attempts, call our explicit
//      verify endpoint using the _ptxn transaction ID Paddle appends to the URL.
//   3. If that also fails, show the soft error state.
function usePaddleVerification(ptxn: string | null) {
  const { update } = useSession();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const MAX_POLL = 8;    // 8 × 1.5 s = 12 s polling window
    const INTERVAL = 1500;
    let   attempts = 0;
    const tid      = toast.loading("Confirming your subscription…");

    const interval = setInterval(async () => {
      attempts += 1;
      const refreshed = await update();

      if (refreshed?.user?.plan === 'pro') {
        clearInterval(interval);
        toast.success("Welcome to Pro! Subscription active.", { id: tid });
        setStatus('success');
        return;
      }

      if (attempts >= MAX_POLL) {
        clearInterval(interval);

        // ── Fallback: explicit server-side verify using Paddle transaction ID ──
        // if (ptxn) {
        //   toast.loading("Still confirming — checking directly with Paddle…", { id: tid });
        //   try {
        //     const res = await fetch('/api/paddle/verify-transaction', {
        //       method: 'POST',
        //       headers: { 'Content-Type': 'application/json' },
        //       body: JSON.stringify({ transactionId: ptxn }),
        //     });
        //     const data = await res.json();

        //     if (data.success) {
        //       await update();
        //       toast.success("Welcome to Pro! Subscription active.", { id: tid });
        //       setStatus('success');
        //       return;
        //     }
        //   } catch {
        //     // fall through to error state
        //   }
        // }

        toast.error(
          "Activation is taking longer than expected. Try refreshing your dashboard.",
          { id: tid, duration: 6000 }
        );
        setStatus('error');
      }
    }, INTERVAL);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally omit `update` and `ptxn` — both stable after mount

  return status;
}

// ─── UI ───────────────────────────────────────────────────────────────────────
function StatusDisplay({ status }: { status: 'verifying' | 'success' | 'error' }) {
  const router = useRouter();

  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => { window.location.href = '/dashboard'; }, 3000);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
      {status === 'verifying' && (
        <>
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
          <p className="text-muted-foreground">Confirming your subscription with Paddle…</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" />
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-bold">You are now Pro! 🎉</h3>
            <p className="text-muted-foreground">Your persistent storage is ready.</p>
            <p className="text-xs text-muted-foreground/50">Redirecting to dashboard…</p>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertTriangle className="h-16 w-16 text-destructive" />
          <div className="space-y-3 text-center">
            <h3 className="text-xl font-bold">Activation Delayed</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Your payment was received but activation is still processing. Check your dashboard
              in a moment — it usually completes within 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button onClick={() => { window.location.href = '/dashboard'; }}>
                Go to Dashboard
              </Button>
              <Button onClick={() => router.push('/pricing')} variant="outline">
                Return to Pricing
              </Button>
            </div>
          </div>
        </>
      )}
    </CardContent>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const ptxn = searchParams.get('_ptxn'); // Paddle transaction ID
  const status = usePaddleVerification(ptxn);
  return <StatusDisplay status={status} />;
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle>Activating Your Subscription</CardTitle>
        </CardHeader>
        <Suspense fallback={
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading…</p>
          </CardContent>
        }>
          <PaymentSuccessContent />
        </Suspense>
      </Card>
    </div>
  );
}