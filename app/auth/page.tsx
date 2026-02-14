// app/auth/page.tsx
"use client";

import { signIn } from "@/lib/auth-client";
import { useSession } from "@/hooks/use-session";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useState, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa"; // Using standard React Icons for providers
import { AppHeader } from "@/components/nLHeader"; // Standardized import
import { ThemeProvider } from "@/components/theme-provider";
import Link from "next/link";

function AuthForm() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleLogin = async (provider: string) => {
        setIsLoading(provider);
        try {
            await signIn(provider, { callbackUrl });
        } catch (error) {
            console.error("Login failed", error);
            setIsLoading(null);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary bg-card">
            <CardHeader className="space-y-1 text-center pb-6">
                <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                <CardDescription>
                    Sign in to save your inbox history and access Pro features.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">

                {/* WhatsYourInfo Provider (Primary) */}
                <Button
                    variant="default"
                    size="lg"
                    className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md transition-all hover:shadow-lg"
                    onClick={() => handleLogin('wyi')}
                    disabled={!!isLoading}
                >
                    {isLoading === 'wyi' ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        // Fallback or Image for WYI logo
                        <div className="mr-3 h-6 w-6 flex items-center justify-center">
                             {/* Replace with <Image> if you have the asset config set up */}
                             <img src="https://whatsyour.info/logo-login.png" alt="WYI" className="h-6 w-6 object-contain" />
                        </div>
                    )}
                    <span className="font-semibold">Continue with WhatsYourInfo</span>
                </Button>

                <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => handleLogin('google')} 
                        disabled={!!isLoading}
                        className="hover:bg-muted/50 transition-colors"
                    >
                        {isLoading === 'google' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FaGoogle className="mr-2 h-4 w-4 text-blue-500" />
                        )}
                        Google
                    </Button>
                    <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => handleLogin('github')} 
                        disabled={!!isLoading}
                        className="hover:bg-muted/50 transition-colors"
                    >
                        {isLoading === 'github' ? (
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
                    <Link href="/policies/terms" className="underline hover:text-primary transition-colors">Terms of Service</Link>{" "}
                    and{" "}
                    <Link href="/policies/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</Link>.
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