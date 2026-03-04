"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeProvider } from "@/components/theme-provider";
import { CheckCircle2 } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AccountDeletedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.deletion_status === "permanent") {
      signOut({ redirect: false });
    }
  }, [status, session?.user?.deletion_status]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5" />
              <CardTitle>Account deleted</CardTitle>
            </div>
            <CardDescription>
              Your account has been permanently deleted. All personal data has been removed from our systems.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
}
