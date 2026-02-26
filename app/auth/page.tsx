"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useState, Suspense, useRef } from "react"; // Added useRef
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import Link from "next/link";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"; // Import Turnstile

const ERROR_MESSAGES: Record<string, string> = {
  expired: "Your sign-in link has expired. Please request a new one.",
  missing: "Invalid sign-in link. Please request a new one.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
  OAuthCallbackError: "Something went wrong with sign-in. Please try again.",
  Default: "Something went wrong. Please try again.",
};

function ErrorBanner({ error }: { error: string }) {
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function AuthForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const urlError = searchParams.get("error");

  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  
  // Turnstile State
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleOAuth = async (provider: string) => {
    setIsLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error("Login failed", error);
      setIsLoading(null);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    
    // Check Captcha
    if (!captchaToken) {
      setEmailError("Please complete the security check.");
      return;
    }

    setEmailError("");
    setIsLoading("email");
    try {
      const res = await fetch('/api/auth/magic/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          token: captchaToken // Send token to backend
        }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        // Reset captcha on failure so user can try again
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        throw new Error(data.error || 'Failed');
      }
      
      setMagicLinkSent(true);
    } catch (err: any) {
      setEmailError(err.message || "Couldn't send the link. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  if (magicLinkSent) {
    return (
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary bg-card">
        <CardContent className="flex flex-col items-center gap-4 py-12 px-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Check your inbox</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a magic link to{" "}
            <span className="font-medium text-foreground">{email}</span>.
            Click it to sign in — the link expires in 10 minutes.
          </p>
          <button
            onClick={() => { setMagicLinkSent(false); setEmail(""); setCaptchaToken(null); }}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary transition-colors mt-2"
          >
            Use a different email
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary bg-card">
      <CardHeader className="space-y-1 text-center pb-6">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to save your inbox history and access Pro features.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5">
        {urlError && <ErrorBanner error={urlError} />}

        <form onSubmit={handleMagicLink} className="grid gap-3">
          <div className="grid gap-1.5">
            <Input
              type="email"
              placeholder="Your real email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              disabled={!!isLoading}
              className={`h-11 bg-background border-input text-foreground placeholder:text-muted-foreground
                focus-visible:ring-primary
                ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {emailError && (
              <p className="text-xs text-destructive pl-0.5">{emailError}</p>
            )}
          </div>

          {/* Turnstile Widget */}
          <div className="flex justify-center py-2">
            <Turnstile 
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setCaptchaToken}
              onError={() => setEmailError("Security check failed. Please refresh.")}
              onExpire={() => setCaptchaToken(null)}
              options={{
                theme: 'auto',
                size: 'flexible',
              }}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full font-semibold"
            disabled={!!isLoading || !captchaToken} // Disable if no token
          >
            {isLoading === "email" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Continue with Email
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleOAuth("google")}
            disabled={!!isLoading}
            className="w-full border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {isLoading === "google" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaGoogle className="mr-2 h-4 w-4 text-blue-500" />
            )}
            Google
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => handleOAuth("github")}
            disabled={!!isLoading}
            className="w-full border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {isLoading === "github" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaGithub className="mr-2 h-4 w-4" />
            )}
            GitHub
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 text-center text-sm border-t bg-muted/20 pt-6 pb-6 rounded-b-xl">
        <p className="text-muted-foreground text-xs px-6">
          By clicking continue, you agree to our{" "}
          <Link href="/policies/terms" className="underline underline-offset-4 hover:text-primary transition-colors">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/policies/privacy" className="underline underline-offset-4 hover:text-primary transition-colors">
            Privacy Policy
          </Link>.
        </p>
      </CardFooter>
    </Card>
  );
}

export default function AuthPage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col bg-background font-sans">
        <AppHeader initialSession={session} />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-muted/10">
          <Suspense fallback={<div className="h-[400px] w-full max-w-md bg-muted/20 animate-pulse rounded-xl border" />}>
            <AuthForm />
          </Suspense>
        </main>
      </div>
    </ThemeProvider>
  );
}