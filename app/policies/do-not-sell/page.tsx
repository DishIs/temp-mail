"use client";

import { Shield, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DoNotSellPage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />
        <div className="container max-w-2xl mx-auto py-12 px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex p-3 bg-primary/10 rounded-full mb-4">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Do Not Sell or Share My Personal Information
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your choices under CCPA/CPRA and other privacy laws
            </p>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>We do not sell your data</CardTitle>
              <CardDescription>
                FreeCustom.Email does not sell your personal information to third parties. We do not share your information with advertisers or data brokers for monetary or other valuable consideration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm text-muted-foreground">
              <p>
                If you are a California resident (or under another law that uses similar definitions), you have the right to opt out of the &quot;sale&quot; or &quot;sharing&quot; of your personal information. Because we do not sell or share personal information for cross-context behavioral advertising, there is no opt-out link required for that use.
              </p>
              <p>
                You can still exercise other privacy rights at any time:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-foreground">Access / know:</strong> Request a copy of the personal data we hold about you (e.g. via your profile and account settings, or by contacting us).</li>
                <li><strong className="text-foreground">Delete:</strong> Request account deletion from your profile (Settings → Delete Account). A 7-day waiting period applies; you can cancel during that time.</li>
                <li><strong className="text-foreground">Correct:</strong> Update your name and preferences in your dashboard.</li>
                <li><strong className="text-foreground">Limit use of sensitive data:</strong> We use sensitive personal information only as needed to provide the service (e.g. authentication); we do not use it for inferring characteristics.</li>
              </ul>
              <p>
                To submit a formal request or ask questions about your data, contact us at{" "}
                <a href="mailto:privacy@freecustom.email" className="text-primary underline">privacy@freecustom.email</a>.
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Link href="/policies/privacy" className="text-primary text-sm underline hover:no-underline">
              ← Back to Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
