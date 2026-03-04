import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, X } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    sub: "/mo",
    reqSec: "1",
    reqMonth: "5,000",
    otp: false,
    attachments: false,
    maxAttachment: "—",
    ws: false,
    maxWs: "—",
    customDomains: false,
    persistence: "Anonymous (10h)",
    recommended: false,
  },
  {
    name: "Developer",
    price: "$7",
    sub: "/mo",
    reqSec: "10",
    reqMonth: "100,000",
    otp: true,
    attachments: false,
    maxAttachment: "—",
    ws: false,
    maxWs: "—",
    customDomains: false,
    persistence: "Free (24h)",
    recommended: true,
  },
  {
    name: "Startup",
    price: "$19",
    sub: "/mo",
    reqSec: "25",
    reqMonth: "500,000",
    otp: true,
    attachments: true,
    maxAttachment: "5 MB",
    ws: true,
    maxWs: "5",
    customDomains: false,
    persistence: "Free (24h)",
    recommended: false,
  },
  {
    name: "Growth",
    price: "$49",
    sub: "/mo",
    reqSec: "50",
    reqMonth: "2,000,000",
    otp: true,
    attachments: true,
    maxAttachment: "25 MB",
    ws: true,
    maxWs: "20",
    customDomains: true,
    persistence: "Pro (forever)",
    recommended: false,
  },
  {
    name: "Enterprise",
    price: "$149",
    sub: "/mo",
    reqSec: "100",
    reqMonth: "10,000,000",
    otp: true,
    attachments: true,
    maxAttachment: "50 MB",
    ws: true,
    maxWs: "100",
    customDomains: true,
    persistence: "Pro (forever)",
    recommended: false,
  },
];

const CREDITS = [
  { amount: "$10", requests: "200,000", perK: "$0.05" },
  { amount: "$25", requests: "600,000", perK: "$0.042" },
  { amount: "$50", requests: "1,500,000", perK: "$0.033" },
  { amount: "$100", requests: "4,000,000", perK: "$0.025" },
];

const Tick = () => <Check className="h-4 w-4 text-foreground shrink-0" />;
const Cross = () => <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />;

const FAQ_ITEMS = [
  {
    q: "Do credits expire?",
    a: "No. Credits never expire. Top up once and use them whenever you need. They apply automatically when you exceed your monthly request quota.",
  },
  {
    q: "What happens when I hit my monthly limit?",
    a: "If you have credits, they are consumed automatically for each request over your plan limit. If you have no credits, you'll receive HTTP 429 (monthly_quota_exceeded) until the next reset or until you add credits.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes, on Growth and Enterprise. Add and verify your domain in the dashboard; then you can register inboxes like user@yourdomain.com via the API.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan is always available. Paid API plans do not include a separate trial period; you can upgrade or add credits at any time.",
  },
  {
    q: "How does WebSocket billing work?",
    a: "Each push event (new_mail, etc.) counts as one request toward your monthly quota. Connection limits apply per plan (e.g. 5 concurrent connections on Startup, 20 on Growth).",
  },
  {
    q: "Can I switch plans mid-cycle?",
    a: "Yes. Upgrades take effect immediately; you're charged a prorated amount. Downgrades take effect at the end of the current billing period.",
  },
  {
    q: "What is the difference between API plan and Pro plan?",
    a: "The Pro plan is for the main FreeCustom.Email web app (permanent inbox, custom domains, OTP in the UI). The API plan is for programmatic access (api2.freecustom.email). They are separate subscriptions; you can have one or both.",
  },
];

export default function ApiPricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          API pricing
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pay per plan or top up with credits. Credits never expire.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col ${
              plan.recommended ? "border-border bg-muted/30 ring-1 ring-border" : "border-border"
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
                  Recommended
                </span>
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.sub}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Req/sec</span>
                <span className="font-medium">{plan.reqSec}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Req/month</span>
                <span className="font-medium">{plan.reqMonth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">OTP extraction</span>
                {plan.otp ? <Tick /> : <Cross />}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Attachments</span>
                {plan.attachments ? <span className="text-xs">{plan.maxAttachment}</span> : <Cross />}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">WebSocket</span>
                {plan.ws ? <span className="text-xs">{plan.maxWs} conn</span> : <Cross />}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Custom domains</span>
                {plan.customDomains ? <Tick /> : <Cross />}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Persistence</span>
                <span className="text-xs text-right">{plan.persistence}</span>
              </div>
            </CardContent>
            <div className="p-4 pt-0">
              {plan.name === "Free" ? (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/auth?callbackUrl=/api/dashboard">Get started</Link>
                </Button>
              ) : (
                <Button asChild size="sm" className="w-full">
                  <Link href="/auth?callbackUrl=/api/dashboard">Get started</Link>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Credits */}
      <section className="mb-16">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Credits (never expire)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CREDITS.map(({ amount, requests, perK }) => (
            <Card key={amount} className="border-border">
              <CardHeader className="py-3">
                <CardTitle className="text-lg">{amount}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {requests} requests · {perK}/1k
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          FAQ
        </h2>
        <Accordion type="single" collapsible className="space-y-2">
          {FAQ_ITEMS.map(({ q, a }, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="rounded-lg border border-border bg-card px-4">
              <AccordionTrigger className="text-left text-sm font-medium py-4 hover:no-underline">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
