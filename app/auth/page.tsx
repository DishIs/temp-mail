// app/auth/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Mail, Github, Chrome, ArrowRight, Loader2 } from "lucide-react";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleLogin = async (provider: string, options: any = {}) => {
    setIsLoading(provider);
    await signIn(provider, { callbackUrl, ...options });
    // Note: Loader stays true until redirect happens
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading('email');
    await signIn('email', { email, callbackUrl });
    setIsLoading(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to save your inbox history and access Pro features.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          
          {/* WhatsYourInfo Provider */}
          <Button 
            variant="default" 
            className="w-full bg-[#2563EB] hover:bg-[#1d4ed8]"
            onClick={() => handleLogin('wyi')}
            disabled={!!isLoading}
          >
            {isLoading === 'wyi' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <img src="/wyi.png" alt="WYI" className="mr-2 h-5 w-5 invert" />}
            Continue with WhatsYourInfo
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => handleLogin('google')} disabled={!!isLoading}>
              {isLoading === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />}
              Google
            </Button>
            <Button variant="outline" onClick={() => handleLogin('github')} disabled={!!isLoading}>
               {isLoading === 'github' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
              GitHub
            </Button>
          </div>

          {/* Magic Link */}
          <form onSubmit={handleEmailLogin} className="space-y-2 mt-2">
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or passwordless email</span>
                </div>
              </div>
            <div className="flex space-x-2">
                <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={!!isLoading}
                />
                <Button type="submit" variant="secondary" disabled={!!isLoading}>
                   {isLoading === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                </Button>
            </div>
             <p className="text-xs text-center text-muted-foreground px-2">
                We will email you a magic link for a password-free sign in.
            </p>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}