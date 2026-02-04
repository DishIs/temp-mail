// app/pricing/page.tsx
"use client";

import { useState } from "react";
import { Check, X, Shield, Zap, Globe, Crown, ArrowRight, Info, EyeOff, Loader2 } from "lucide-react";
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
import { ThemeProvider } from "@/components/theme-provider";
import toast from "react-hot-toast"; // ✅ Using React Hot Toast

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
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async (planType: 'free' | 'pro') => {
    if (planType === 'free') {
      if (!session) router.push('/auth?callbackUrl=/dashboard');
      else router.push('/dashboard');
    } else {
      // PRO FLOW
      if (!session) {
        toast.error("Please login to subscribe");
        router.push('/auth?callbackUrl=/pricing');
        return;
      }

      setIsProcessing(true);
      const toastId = toast.loading("Initializing secure payment...");

      try {
        const res = await fetch('/api/paypal/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cycle: billingCycle }),
        });

        const data = await res.json();

        if (data.error) {
            toast.error(data.error || "Payment failed", { id: toastId });
            setIsProcessing(false);
            return;
        }

        if (data.url) {
            toast.success("Redirecting to PayPal...", { id: toastId });
            window.location.href = data.url;
        } else {
            toast.error("No redirect URL received", { id: toastId });
            setIsProcessing(false);
        }

      } catch (error) {
        console.error(error);
        toast.error("Could not connect to payment server", { id: toastId });
        setIsProcessing(false);
      }
    }
  };

  const pricingMap = {
    weekly: { price: "$1.99", label: "/ week", savings: null },
    monthly: { price: "$3.99", label: "/ month", savings: null },
    yearly: { price: "$19.99", label: "/ year", savings: "Save ~60%" },
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen max-w-[100vw] bg-background">
        <AppHeader initialSession={session} />
        {/* Toast is handled by Global Provider */}
        
        <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
            <Badge variant="secondary" className="mb-4">Transparent Pricing</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Upgrade Your Inbox
            </h1>
            <p className="text-lg text-muted-foreground">
              Subscribe securely with PayPal. Cancel anytime.
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
                    None <Badge variant="outline">Guest</Badge>
                  </CardTitle>
                  <CardDescription>Strictly anonymous. No trace left behind.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="text-3xl font-bold">$0</div>
                  <ul className="space-y-3 text-sm">
                    <Feature text="12-Hour Storage" />
                    <Feature text="Random Address Only" />
                    <Feature text="No Attachments" unavailable />
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
                    Free <Badge variant="secondary">Account</Badge>
                  </CardTitle>
                  <CardDescription>For recurring usage and basic needs.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="text-3xl font-bold">$0</div>
                  <ul className="space-y-3 text-sm">
                    <Feature text="24-Hour Storage" />
                    <Feature text="Custom Prefixes" />
                    <Feature text="Browser Save" />
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
                    <Crown className="w-6 h-6 fill-current" /> Pro
                  </CardTitle>
                  <CardDescription>The complete private communication suite.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold">{pricingMap[billingCycle].price}</span>
                    <span className="text-muted-foreground">{pricingMap[billingCycle].label}</span>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-muted-foreground">Pro features:</p>
                    <ul className="space-y-3 text-sm">
                      <Feature text="Permanent Storage (5GB)" />
                      <Feature text="Custom Domains" />
                      <Feature text="25MB Attachments" />
                      <Feature text="Unlimited Inboxes" />
                      <Feature text="No Ads" />
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white border-0 shadow-lg" 
                    onClick={() => handleUpgrade('pro')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
                    {isProcessing ? "Connecting to PayPal..." : "Subscribe Now"}
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
                <AccordionTrigger>Custom Domains</AccordionTrigger>
                <AccordionContent>
                    Link your own domain (e.g., @mycompany.com). You get the privacy of our system with the professional look of your own brand.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Permanent Storage</AccordionTrigger>
                <AccordionContent>
                   We allocate 5GB of private cloud storage. Your emails stay until you delete them.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

function Feature({ text, unavailable, tooltip }: { text: string, unavailable?: boolean, tooltip?: string }) {
  return (
    <li className={cn("flex items-center gap-3", unavailable && "text-muted-foreground opacity-70")}>
      {unavailable ? <X className="w-5 h-5 text-muted-foreground shrink-0" /> : <Check className="w-5 h-5 text-green-500 shrink-0" />}
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