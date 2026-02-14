// app/privacy-policy/page.tsx
"use client";

import { Shield, Lock, Eye, FileText, Server, AlertTriangle, CheckCircle2, Globe, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AppHeader } from "@/components/nLHeader"; // Adjust path if needed
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "@/hooks/use-session";

export default function PrivacyPolicyPage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />
        
        <div className="container max-w-4xl mx-auto py-12 px-4 sm:px-6">
          
          {/* Header Section */}
          <div className="text-center mb-12 space-y-4">
            <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                    <Shield className="w-10 h-10 text-primary" />
                </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transparency is our core value. Please read this document carefully to understand how your data is handled.
            </p>
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
               <AlertTriangle className="w-4 h-4 mr-2" />
               Important: You should have no expectation of privacy when using public inboxes.
            </div>
          </div>

          <div className="space-y-8">
            
            {/* GOOGLE USER DATA SECTION (New Requirement) */}
            <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Globe className="w-5 h-5" /> Google User Data Policy
                    </CardTitle>
                    <CardDescription>
                        Specific details regarding our integration with Google Services (Login/Auth).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">Data Accessed</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            When you choose to sign in using Google, our application accesses the following specific types of Google user data:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            <li><strong>Basic Profile Information:</strong> Your name and profile picture URL.</li>
                            <li><strong>Email Address:</strong> The primary email address associated with your Google account.</li>
                        </ul>
                    </div>
                    
                    <Separator className="bg-blue-200 dark:bg-blue-800" />

                    <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">Data Usage</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We use the Google user data we access solely for the following purposes:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            <li><strong>Authentication:</strong> To verify your identity and allow you to log in to your dashboard securely without creating a separate password.</li>
                            <li><strong>Account Management:</strong> To display your name and avatar in the application header and user profile section.</li>
                            <li><strong>Communication:</strong> To send critical transactional emails (e.g., subscription receipts) to your verified email address. We do not sell your data or use it for advertising.</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* PUBLIC INBOXES */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Eye className="w-6 h-6 text-primary" /> Public Inboxes
                </h2>
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium">All inboxes are public</h3>
                                <p className="text-sm text-muted-foreground">Any message sent to FreeCustom.Email addresses (on public domains) can be read by any user who guesses the inbox name.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-medium">No sign-in required for public access</h3>
                                <p className="text-sm text-muted-foreground">There are no security measures to access public inboxes or view messages contained within them.</p>
                            </div>
                        </div>
                        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm font-medium text-center">
                            Do not send sensitive information (home address, passwords, phone numbers) to these addresses.
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* SECURITY NOTICE */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Lock className="w-6 h-6 text-primary" /> Security Notice
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Inbox Aliases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Inbox aliases provide basic obfuscation but are <strong>not secure</strong>. The generation algorithm is public and reversible. Do not rely on aliases for confidentiality.
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Anonymity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                FreeCustom.Email is <strong>not designed for anonymity</strong> and is not a replacement for anonymous re-mailers or VPN services.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* LOGGING & TRACKING */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Server className="w-6 h-6 text-primary" /> Logging & Data Collection
                </h2>
                <Card>
                    <CardContent className="pt-6 grid gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 font-medium">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span>Connection Logging</span>
                            </div>
                            <p className="text-sm text-muted-foreground pl-6">
                                All email and web connections to our servers are recorded to help prevent abuse and improve service reliability. We cannot provide users with information about specific emails or their delivery status.
                            </p>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 font-medium">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>No User Tracking</span>
                            </div>
                            <p className="text-sm text-muted-foreground pl-6">
                                We do <strong>not track users</strong> across the web or use cookies to store personal profiling information.
                            </p>
                            <ul className="list-disc pl-10 text-sm text-muted-foreground space-y-1">
                                <li>The only local storage used is for the most recent inbox you visited (for convenience).</li>
                                <li>We use an analytics pixel to collect <strong>aggregate, non-identifiable data only</strong>.</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* CONTACT */}
            <div className="mt-12 text-center p-8 border rounded-xl bg-muted/20">
                <h3 className="text-lg font-semibold mb-2">Questions regarding this policy?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    If you have concerns about how your data is handled, please contact us.
                </p>
                <div className="inline-flex items-center gap-2 text-primary hover:underline cursor-pointer">
                    <Mail className="w-4 h-4" />
                    <a href="mailto:privacy@freecustom.email">privacy@freecustom.email</a>
                </div>
            </div>

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}