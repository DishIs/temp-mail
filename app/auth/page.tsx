// app/auth/page.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Github, Chrome, Loader2 } from "lucide-react"; // Removed Mail, ArrowRight
import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";

export default function AuthPage() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const { data: session } = useSession();

    const handleLogin = async (provider: string, options: any = {}) => {
        setIsLoading(provider);
        await signIn(provider, { callbackUrl, ...options });
    };

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="min-h-screen max-w-[100vw] bg-background">
                <AppHeader initialSession={session} />

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
                                className="w-full bg-white hover:bg-gray-100"
                                onClick={() => handleLogin('wyi')}
                                disabled={!!isLoading}
                            >
                                {isLoading === 'wyi' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <img src="/wyi.png" alt="WYI" className="mr-2 h-5 w-5" />
                                )}
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

                        </CardContent>
                    </Card>
                </div>
            </div>
        </ThemeProvider>
    );
}