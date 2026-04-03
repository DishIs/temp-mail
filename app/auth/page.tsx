// app/auth/page.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, Suspense, useRef, useEffect } from "react";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import Link from "next/link";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const ASCII_FRAGS = [
  { x: "2%",  y: "8%",  t: "EHLO api2.freecustom.email"     },
  { x: "68%", y: "5%",  t: "250 2.1.0 Ok"                   },
  { x: "1%",  y: "40%", t: "RCPT TO:<inbox@ditapi.info>"    },
  { x: "70%", y: "36%", t: "Message-ID: <abc123@fce.email>"  },
  { x: "2%",  y: "65%", t: "X-OTP: 847291"                  },
  { x: "69%", y: "62%", t: "SMTP 220 mail.freecustom.email"  },
  { x: "1%",  y: "90%", t: "AUTH PLAIN"                      },
  { x: "68%", y: "88%", t: "MAIL FROM:<service@example.com>" },
];

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.1) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

const ERROR_MESSAGES: Record<string, string> = {
  expired:               "Your sign-in link has expired. Please request a new one.",
  missing:               "Invalid sign-in link. Please request a new one.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
  OAuthCallbackError:    "Something went wrong with sign-in. Please try again.",
  Default:               "Something went wrong. Please try again.",
};

function AuthForm() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError    = searchParams.get("error");

  useEffect(() => {
    if (status === "authenticated" && session?.user) window.location.href = callbackUrl;
  }, [status, session?.user, callbackUrl]);

  const [isLoading,     setIsLoading]     = useState<string | null>(null);
  const [email,         setEmail]         = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [emailError,    setEmailError]    = useState("");
  const [captchaToken,  setCaptchaToken]  = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  if (status === "authenticated" && session?.user) {
    return (
      <div className="flex items-center gap-3 py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="font-mono text-sm text-muted-foreground">Redirecting…</span>
      </div>
    );
  }

  const handleOAuth = async (provider: string) => {
    setIsLoading(provider);
    try { await signIn(provider, { callbackUrl }); }
    catch (e) { console.error("Login failed", e); setIsLoading(null); }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim())                              { setEmailError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Please enter a valid email address."); return; }
    if (!captchaToken)                              { setEmailError("Please complete the security check."); return; }
    setEmailError("");
    setIsLoading("email");
    try {
      const res  = await fetch("/api/auth/magic/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) { turnstileRef.current?.reset(); setCaptchaToken(null); throw new Error(data.error || "Failed"); }
      setMagicLinkSent(true);
    } catch (err: any) {
      setEmailError(err.message || "Couldn't send the link. Please try again.");
    } finally { setIsLoading(null); }
  };

  if (magicLinkSent) {
    return (
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-0.5 h-4 bg-border" aria-hidden />
          <span className="font-mono text-xs font-semibold">[ 01 / 01 ]</span>
          <span className="text-muted-foreground/50 text-xs">·</span>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Check your inbox</span>
        </div>
        <div className="flex items-center gap-2.5 mb-4">
          <CheckCircle2 className="h-5 w-5 text-foreground" />
          <h1 className="text-2xl font-bold">Link sent!</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          We sent a magic link to <span className="font-medium text-foreground">{email}</span>.{" "}
          Click it to sign in — expires in 10 minutes.
        </p>
        <div className="border-t border-border pt-6">
          <button
            onClick={() => { setMagicLinkSent(false); setEmail(""); setCaptchaToken(null); }}
            className="text-xs text-muted-foreground underline underline-offset-4 decoration-border hover:decoration-foreground hover:text-foreground transition-colors font-mono"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-0.5 h-4 bg-border" aria-hidden />
        <span className="font-mono text-xs font-semibold">[ 01 / 01 ]</span>
        <span className="text-muted-foreground/50 text-xs">·</span>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Sign in</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        Sign in to save your inbox history and access Pro features.
      </p>

      {urlError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive mb-6">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{ERROR_MESSAGES[urlError] ?? ERROR_MESSAGES.Default}</span>
        </div>
      )}

      <form onSubmit={handleMagicLink} className="space-y-4 mb-6">
        <div>
          <Input
            type="email" placeholder="your@email.com" value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
            disabled={!!isLoading}
            className={`h-10 bg-background font-mono text-sm ${emailError ? "border-destructive" : ""}`}
          />
          {emailError && <p className="text-xs text-destructive mt-1.5 pl-0.5">{emailError}</p>}
        </div>

        <div className="flex justify-center rounded-lg border border-border bg-muted/20 p-3">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={setCaptchaToken}
            onError={() => setEmailError("Security check failed. Please refresh.")}
            onExpire={() => setCaptchaToken(null)}
            options={{ theme: "auto", size: "flexible" }}
          />
        </div>

        <Button type="submit" className="w-full" disabled={!!isLoading || !captchaToken}>
          {isLoading === "email" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          Continue with Email
        </Button>
      </form>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">or</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <Button variant="outline" onClick={() => handleOAuth("google")} disabled={!!isLoading} className="font-mono text-sm gap-2">
          {isLoading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FaGoogle className="h-3.5 w-3.5" />}
          Google
        </Button>
        <Button variant="outline" onClick={() => handleOAuth("github")} disabled={!!isLoading} className="font-mono text-sm gap-2">
          {isLoading === "github" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FaGithub className="h-3.5 w-3.5" />}
          GitHub
        </Button>
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          By continuing you agree to our{" "}
          <Link href="/policies/terms" className="underline underline-offset-4 decoration-border hover:decoration-foreground hover:text-foreground transition-colors">Terms</Link>
          {" "}and{" "}
          <Link href="/policies/privacy" className="underline underline-offset-4 decoration-border hover:decoration-foreground hover:text-foreground transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { data: session } = useSession();
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col bg-background" style={DOT_BG}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
          {ASCII_FRAGS.map((f, i) => (
            <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap"
              style={{ left: f.x, top: f.y, opacity: 0.04 }}>{f.t}</span>
          ))}
        </div>
        <div className="fixed inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />
        <div className="fixed inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" aria-hidden />
        <div className="relative z-10 flex flex-col min-h-screen">
          <AppHeader initialSession={session} />
          <main className="flex-1 flex items-center justify-center px-6 py-16">
            <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}>
              <AuthForm />
            </Suspense>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}