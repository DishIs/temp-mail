// app/terms-of-service/page.tsx
"use client";

import { Scale, ShieldAlert, AlertTriangle, Gavel, FileWarning, Check, XCircle, Ban, ServerOff, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppHeader } from "@/components/nLHeader"; 
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "@/hooks/use-session";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />
        
        <div className="container max-w-5xl mx-auto py-12 px-4 sm:px-6">
          
          {/* Header Section */}
          <div className="text-center mb-12 space-y-4">
            <Badge variant="outline" className="mb-4">
              Community Guidelines
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              To ensure FreeCustom.Email remains a safe and reliable resource, all users must adhere to these guidelines.
            </p>
          </div>

          <div className="space-y-8">
            
            {/* CORE PRINCIPLES */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Scale className="w-6 h-6 text-primary" /> Core Principles
                    </CardTitle>
                    <CardDescription>
                        Use FreeCustom.Email wisely and legally.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" /> Lawful
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            You agree not to use our service for any illegal activities, including fraud, harassment, or distributing malicious software.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" /> Respectful
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Do not use our service to send spam, unsolicited bulk messages, or engage in abusive behavior towards others.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" /> Ethical
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Use it for intended purposes (testing, verifying, privacy). Do not circumvent legitimate security measures of other services.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* NATURE OF SERVICE */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5" /> Nature of Service
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            <strong className="text-foreground">Temporary & Disposable:</strong> Emails are not intended for long-term storage. We are not responsible for data loss due to the ephemeral nature of the service.
                        </p>
                        <p>
                            <strong className="text-foreground">No Account Creation:</strong> You use the service without a formal account/password (unless upgrading to Pro). This underscores its temporary nature.
                        </p>
                        <p>
                            <strong className="text-foreground">No Permanent Access:</strong> Saving emails in your history does not guarantee permanent access to that address or its contents.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                            <AlertTriangle className="w-5 h-5" /> Public Nature Warning
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <p>
                            While our system strives to provide unique inboxes, the fundamental design of temp mail means there is <strong className="text-foreground">no inherent security</strong> for the content of emails received.
                        </p>
                        <p className="font-medium text-foreground">
                            Do not send or receive sensitive personal information (passwords, financial details, etc.) through our service.
                        </p>
                        <p>
                            Treat messages as potentially viewable if an address were to be re-used or guessed by others.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* PROHIBITED ACTIVITIES */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Ban className="w-6 h-6 text-destructive" /> Prohibited Activities
                </h2>
                <Card>
                    <CardContent className="pt-6">
                        <ul className="grid sm:grid-cols-2 gap-4">
                            {[
                                "Illegal Use (Violating local/international laws)",
                                "Spamming & Unsolicited bulk messages",
                                "Phishing & Malware distribution",
                                "Harassment, Stalking, or Defamation",
                                "Impersonation for malicious purposes",
                                "Automated Abuse (Bots/Scripts)",
                                "Circumventing Security Measures",
                                "Unauthorized Commercial Resale"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm">
                                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </section>

            {/* LEGAL ACCORDION */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Gavel className="w-6 h-6" /> Legal Disclosures
                </h2>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" />
                                Right to Moderate & Terminate
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                            <p className="mb-2">FreeCustom.Email reserves the right, at our sole discretion, to:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Monitor usage to ensure compliance with our terms.</li>
                                <li>Block access from certain IP addresses or ranges if abuse is detected.</li>
                                <li>Remove or block access to email addresses found to be involved in prohibited activities.</li>
                                <li>Terminate or suspend access to our service for users who violate these terms, without prior notice.</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2">
                                <FileWarning className="w-4 h-4" />
                                Disclaimer of Warranties
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                            FreeCustom.Email is provided "as is" and "as available" without any warranties, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or completely secure.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                        <AccordionTrigger>
                             <div className="flex items-center gap-2">
                                <ServerOff className="w-4 h-4" />
                                Limitation of Liability
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                            By using our service, you agree that FreeCustom.Email and its operators are not liable for any damages, data loss, or consequences arising from your use of, or inability to use, the service.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </section>

            {/* AGREEMENT FOOTER */}
            <div className="mt-12 text-center p-8 border rounded-xl bg-muted/30">
                <h3 className="text-lg font-semibold mb-2">Your Agreement</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
                    By accessing or using FreeCustom.Email, you signify your agreement to abide by the spirit of these guidelines.
                </p>
                <div className="flex justify-center gap-4">
                    <Link href="/">
                        <Button>Accept & Continue to Inbox</Button>
                    </Link>
                    <Link href="/policies/privacy">
                        <Button variant="outline">View Privacy Policy</Button>
                    </Link>
                </div>
            </div>

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}