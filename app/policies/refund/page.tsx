// app/refund-policy/page.tsx
"use client";

import { ShieldCheck, AlertTriangle, Calendar, CreditCard, Mail, ArrowRight, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";

export default function RefundPolicyPage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen max-w-[100vw] bg-background">
        <AppHeader initialSession={session} />
        
        <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <Badge variant="outline" className="mb-4 text-green-600 border-green-600/30 bg-green-500/10">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Money-Back Guarantee
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Fair & Simple Refunds
            </h1>
            <p className="text-lg text-muted-foreground">
              We want you to be happy. If you're not, we'll make it right within 14 days.
            </p>
          </div>

          {/* Policy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full mb-16">
            
            {/* ELIGIBLE FOR REFUND */}
            <Card className="border-green-500/20 bg-green-500/5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CheckCircle2 className="w-24 h-24 text-green-500" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="w-6 h-6 text-green-600" />
                  First 14 Days
                </CardTitle>
                <CardDescription>First-time subscriptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground/80">
                  If you purchased a <strong>Pro</strong> subscription for the first time, you are eligible for a full refund within 14 days of your initial payment.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>No questions asked</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Includes Weekly, Monthly, & Yearly plans</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* NOT ELIGIBLE FOR REFUND */}
            <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle className="w-24 h-24 text-amber-500" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CreditCard className="w-6 h-6 text-amber-600" />
                  Renewals
                </CardTitle>
                <CardDescription>Automatic recurring payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground/80">
                  We do <strong>not</strong> offer refunds for automatic renewals. It is your responsibility to cancel your subscription before the renewal date if you no longer wish to use the service.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-amber-500" />
                    <span>Forgot to cancel? Not refundable.</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-amber-500" />
                    <span>Partial months are not prorated.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Payment Processors Info */}
          <div className="max-w-4xl w-full mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Payment Providers
            </h2>
            <div className="bg-muted/30 border border-muted rounded-xl p-6">
              <p className="mb-4 text-muted-foreground">
                We use secure third-party processors to handle your payments. Refund processing times depend on their policies.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <span className="font-bold text-blue-700 dark:text-blue-400">PayPal</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">PayPal Refunds</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Refunds typically appear in your PayPal balance immediately, or within 3-5 business days if paid via card.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                   <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <span className="font-bold text-green-700 dark:text-green-400">Paddle</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Paddle Refunds</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Refunds typically take 5-10 business days to appear on your bank statement, depending on your bank.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-3xl w-full">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6" /> Common Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I request a refund?</AccordionTrigger>
                <AccordionContent>
                  Please contact our support team at <a href="mailto:support@example.com" className="text-primary underline">support@freecustom.email</a> within 14 days of your purchase. Include your Order ID or the email address used for purchase.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>I forgot to cancel my subscription. Can I get a refund?</AccordionTrigger>
                <AccordionContent>
                   As per our policy, we do not refund renewals. However, you can cancel immediately to prevent future charges. You will retain access to Pro features until the end of your current billing period.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What happens if I dispute the charge with PayPal/Bank?</AccordionTrigger>
                <AccordionContent>
                   We strongly recommend contacting us first. Opening a dispute freezes your account immediately. We resolve 99% of refund requests within 24 hours when contacted directly.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Are technical issues grounds for a refund?</AccordionTrigger>
                <AccordionContent>
                   Yes. If our service is not working as advertised and we cannot fix the issue for you, you are eligible for a refund even outside the 14-day window in specific cases.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Footer Action */}
          <div className="mt-16 text-center space-y-4">
            <p className="text-muted-foreground">Need to cancel your subscription?</p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard/profile">
                <Button variant="outline">Manage Subscription</Button>
              </Link>
              <Link href="/contact">
                <Button>
                    <Mail className="w-4 h-4 mr-2" /> Contact Support
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </ThemeProvider>
  );
}