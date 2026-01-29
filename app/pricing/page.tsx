// app/pricing/page.tsx
"use client";

import { useState } from "react";
import { Check, X, Shield, Zap, Globe, Crown, ArrowRight, Info, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/nLHeader";

type BillingCycle = "weekly" | "monthly" | "yearly";

// --- PRIVACY AD COMPONENT ---
const PrivacyAd = ({ location }: { location: string }) => (
  <div className="mt-4 p-3 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/30 text-center group cursor-pointer hover:bg-muted/50 transition-colors">
    <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
      <EyeOff className="w-3 h-3" /> Privacy-Safe Ad
    </div>
    <div className="h-16 flex flex-col items-center justify-center text-sm font-medium text-foreground/80">
      <span className="font-semibold">Support Our Privacy Mission</span>
      <span className="text-xs text-muted-foreground">Ads help keep the {location} tier alive.</span>
    </div>
  </div>
);

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const handleUpgrade = (planType: 'free' | 'pro') => {
    if (planType === 'free') {
      if (!session) router.push('/auth?callbackUrl=/dashboard');
      else router.push('/dashboard');
    } else {
      // PRO FLOW
      if (!session) {
        router.push('/auth?callbackUrl=/pricing');
      } else {
        console.log(`Processing ${billingCycle} payment for Pro...`);
        alert(`Redirecting to payment provider for ${billingCycle} plan...`);
      }
    }
  };

  const pricingMap = {
    weekly: { price: "$1.99", label: "/ week", savings: null },
    monthly: { price: "$3.99", label: "/ month", savings: null },
    yearly: { price: "$19.99", label: "/ year", savings: "Save ~60%" },
  };

  return (
    <>
      <AppHeader initialSession={session} />
      <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <Badge variant="secondary" className="mb-4">Transparent Pricing</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Upgrade Your Inbox
          </h1>
          <p className="text-lg text-muted-foreground">
            Whether you need a quick burner or a permanent private solution, we have a plan for you.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-10">
          <Tabs defaultValue="monthly" className="w-full max-w-md" onValueChange={(v) => setBillingCycle(v as BillingCycle)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pricing Cards */}
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full mb-16">

            {/* TIER: NONE */}
            <Card className="border-muted flex flex-col h-full opacity-90 hover:opacity-100 transition-opacity">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl">
                  None
                  <Badge variant="outline">Guest</Badge>
                </CardTitle>
                <CardDescription>Strictly anonymous. No trace left behind.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="text-3xl font-bold">$0</div>
                <ul className="space-y-3 text-sm">
                  <Feature text="12-Hour Storage" tooltip="Data is hard-wiped from servers after 12h." />
                  <Feature text="Random Address Only" tooltip="You cannot customize the email prefix." />
                  <Feature text="No Attachments" unavailable tooltip="Attachments are stripped for security." />
                  <Feature text="No History Recovery" unavailable />
                </ul>
                <PrivacyAd location="None" />
              </CardContent>
              <CardFooter>
                <Button variant="secondary" className="w-full" onClick={() => router.push('/')}>
                  Stay Anonymous
                </Button>
              </CardFooter>
            </Card>

            {/* TIER: FREE */}
            <Card className="border-muted flex flex-col h-full relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl">
                  Free
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Account</Badge>
                </CardTitle>
                <CardDescription>For recurring usage and basic needs.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="text-3xl font-bold">$0</div>
                <ul className="space-y-3 text-sm">
                  <Feature text="24-Hour Storage" />
                  <Feature text="Custom Prefixes" tooltip="Create name@domain instead of random strings." />
                  <Feature text="1MB Attachments" />
                  <Feature text="Browser Save" tooltip="Save specific emails to your local browser storage." />
                  <Feature text="No Custom Domains" unavailable />
                </ul>
                <PrivacyAd location="Free" />
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => handleUpgrade('free')}>
                  {session ? "Current Plan" : "Create Account"}
                </Button>
              </CardFooter>
            </Card>

            {/* TIER: PRO */}
            <Card className="border-primary border-2 shadow-2xl flex flex-col h-full relative bg-card transform scale-105 z-10">
              {pricingMap[billingCycle].savings && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                  {pricingMap[billingCycle].savings}
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary text-2xl">
                  <Crown className="w-6 h-6 fill-current" />
                  Pro
                </CardTitle>
                <CardDescription>The complete private communication suite.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold">{pricingMap[billingCycle].price}</span>
                  <span className="text-muted-foreground">{pricingMap[billingCycle].label}</span>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-muted-foreground">Everything in Free, plus:</p>
                  <ul className="space-y-3 text-sm">
                    <Feature text="Permanent Cloud Storage" tooltip="Emails are saved to your private 5GB cloud drive forever." />
                    <Feature text="Custom Domains" tooltip="Bring your own domain (e.g., me@mybrand.com)." />
                    <Feature text="25MB Attachments" tooltip="Receive large documents and images." />
                    <Feature text="Unlimited Inboxes" />
                    <Feature text="Priority API Access" />
                    <Feature text="No Ads" />
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="lg" className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white border-0 shadow-lg" onClick={() => handleUpgrade('pro')}>
                  Get Pro Access <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TooltipProvider>

        {/* Feature Deep Dive */}
        <div className="max-w-4xl w-full mt-8">
          <h2 className="text-2xl font-bold text-center mb-8">Why Upgrade? A Deep Dive.</h2>
          <Accordion type="single" collapsible className="w-full">

            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg">
                <span className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Custom Domains</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2"><strong>Free/None:</strong> You are stuck with our public domains (e.g., @junkstopper.info). These are great for signups but can sometimes be flagged by strict websites.</p>
                <p><strong>Pro:</strong> Link your own domain (e.g., @mycompany.com). You get the privacy of our system with the professional look of your own brand. Perfect for QA testing or business privacy.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg">
                <span className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Permanent vs. Temporary</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2"><strong>Free/None:</strong> Emails are auto-deleted after 12-24 hours. If you need a verification code later, it's gone.</p>
                <p><strong>Pro:</strong> We allocate 5GB of private cloud storage (GridFS) to your account. Your emails stay until <em>you</em> delete them. Build a permanent archive of your temporary signups.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg">
                <span className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Faster Emails</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2"><strong>Free/None:</strong> Your inbox gets emails at regular speed.</p>
                <p><strong>Pro:</strong> Your inbox gets emails with fastest speed. Perfect for saving time.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg">
                <span className="flex items-center gap-2"><EyeOff className="w-5 h-5 text-primary" /> Ad-Free Experience</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p><strong>Free/None:</strong> We display privacy-focused ads to cover server costs.</p>
                <p><strong>Pro:</strong> Zero ads. Zero tracking. Just a clean, fast email experience.</p>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </div>
    </>
  );
}

// Helper Component for Feature List
function Feature({ text, unavailable, tooltip }: { text: string, unavailable?: boolean, tooltip?: string }) {
  return (
    <li className={cn("flex items-center gap-3", unavailable && "text-muted-foreground opacity-70")}>
      {unavailable ? (
        <X className="w-5 h-5 text-muted-foreground shrink-0" />
      ) : (
        <Check className="w-5 h-5 text-green-500 shrink-0" />
      )}
      <span className={cn("text-sm flex-1", unavailable && "line-through")}>{text}</span>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </li>
  );
}