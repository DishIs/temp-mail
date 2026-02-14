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
import { AppHeader } from "@/components/app-header";
import { ThemeProvider } from "@/components/theme-provider";
import toast from "react-hot-toast"; 
import { useTranslations } from "next-intl";

type BillingCycle = "weekly" | "monthly" | "yearly";

// --- PRIVACY AD COMPONENT ---
// Accepts translated strings to ensure the sub-component remains pure
const PrivacyAd = ({ 
  locationName, 
  t
}: { 
  locationName: string; 
  t: any 
}) => (
  <div className="mt-4 p-3 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/30 text-center group cursor-pointer hover:bg-muted/50 transition-colors">
    <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
      <EyeOff className="w-3 h-3" /> {t('ad_label')}
    </div>
    <div className="h-16 flex flex-col items-center justify-center text-sm font-medium text-foreground/80">
      <span className="font-semibold">{t('ad_title')}</span>
      <span className="text-xs text-muted-foreground">
        {t('ad_desc', { location: locationName })}
      </span>
    </div>
  </div>
);

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Initialize Translations
  const t = useTranslations('Pricing');

  const handleUpgrade = async (planType: 'free' | 'pro') => {
    if (planType === 'free') {
      if (!session) router.push('/auth?callbackUrl=/dashboard');
      else router.push('/dashboard');
    } else {
      // PRO FLOW
      if (!session) {
        toast.error(t('toasts.login_req'));
        router.push('/auth?callbackUrl=/pricing');
        return;
      }

      setIsProcessing(true);
      const toastId = toast.loading(t('toasts.init_payment'));

      try {
        const res = await fetch('/api/paypal/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cycle: billingCycle }),
        });

        const data = await res.json();

        if (data.error) {
            toast.error(data.error || t('toasts.payment_fail'), { id: toastId });
            setIsProcessing(false);
            return;
        }

        if (data.url) {
            toast.success(t('toasts.redirect'), { id: toastId });
            window.location.href = data.url;
        } else {
            toast.error(t('toasts.no_url'), { id: toastId });
            setIsProcessing(false);
        }

      } catch (error) {
        console.error(error);
        toast.error(t('toasts.conn_err'), { id: toastId });
        setIsProcessing(false);
      }
    }
  };

  const pricingMap = {
    weekly: { price: "$1.99", label: t('unit_week'), savings: null },
    monthly: { price: "$3.99", label: t('unit_month'), savings: null },
    yearly: { price: "$19.99", label: t('unit_year'), savings: t('save_msg') },
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen max-w-[100vw] bg-background">
        <AppHeader initialSession={session} />
        
        <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
            <Badge variant="secondary" className="mb-4">{t('header_badge')}</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t('header_title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('header_subtitle')}
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-10">
            <Tabs defaultValue="monthly" className="w-full max-w-md" onValueChange={(v) => setBillingCycle(v as BillingCycle)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="weekly">{t('cycle_weekly')}</TabsTrigger>
                <TabsTrigger value="monthly">{t('cycle_monthly')}</TabsTrigger>
                <TabsTrigger value="yearly">{t('cycle_yearly')}</TabsTrigger>
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
                    {t('plan_guest_title')} <Badge variant="outline">{t('plan_guest_badge')}</Badge>
                  </CardTitle>
                  <CardDescription>{t('plan_guest_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="text-3xl font-bold">$0</div>
                  <ul className="space-y-3 text-sm">
                    <Feature text={t('features.storage_12h')} />
                    <Feature text={t('features.random_addr')} />
                    <Feature text={t('features.no_attach')} unavailable />
                  </ul>
                  <PrivacyAd locationName={t('plan_guest_title')} t={t} />
                </CardContent>
                <CardFooter>
                  <Button variant="secondary" className="w-full" onClick={() => router.push('/')}>
                    {t('plan_guest_btn')}
                  </Button>
                </CardFooter>
              </Card>

              {/* TIER: FREE */}
              <Card className="border-muted flex flex-col h-full relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-xl">
                    {t('plan_free_title')} <Badge variant="secondary">{t('plan_free_badge')}</Badge>
                  </CardTitle>
                  <CardDescription>{t('plan_free_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="text-3xl font-bold">$0</div>
                  <ul className="space-y-3 text-sm">
                    <Feature text={t('features.storage_24h')} />
                    <Feature text={t('features.custom_prefix')} />
                    <Feature text={t('features.browser_save')} />
                  </ul>
                  <PrivacyAd locationName={t('plan_free_title')} t={t} />
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => handleUpgrade('free')}>
                    {session ? t('plan_free_btn_current') : t('plan_free_btn_create')}
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
                    <Crown className="w-6 h-6 fill-current" /> {t('plan_pro_title')}
                  </CardTitle>
                  <CardDescription>{t('plan_pro_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold">{pricingMap[billingCycle].price}</span>
                    <span className="text-muted-foreground">{pricingMap[billingCycle].label}</span>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-muted-foreground">{t('plan_pro_subtitle')}</p>
                    <ul className="space-y-3 text-sm">
                      <Feature text={t('features.storage_perm')} />
                      <Feature text={t('features.custom_domain')} />
                      <Feature text={t('features.attach_25mb')} />
                      <Feature text={t('features.unlimited_inbox')} />
                      <Feature text={t('features.no_ads')} />
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
                    {isProcessing ? t('plan_pro_btn_processing') : t('plan_pro_btn')}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TooltipProvider>

          {/* Feature Deep Dive */}
          <div className="max-w-4xl w-full mt-8">
            <h2 className="text-2xl font-bold text-center mb-8">{t('faq_title')}</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>{t('faq_domain_title')}</AccordionTrigger>
                <AccordionContent>
                    {t('faq_domain_desc')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>{t('faq_storage_title')}</AccordionTrigger>
                <AccordionContent>
                   {t('faq_storage_desc')}
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