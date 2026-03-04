import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/CodeBlock";
import {
  Inbox,
  KeyRound,
  Zap,
  CreditCard,
  Globe,
  Paperclip,
  Check,
  X,
} from "lucide-react";
import { ApiHeroCode } from "@/app/api/ApiHeroCode";
import { ApiCodeExamples } from "@/app/api/ApiCodeExamples";

const FEATURES = [
  {
    icon: Inbox,
    title: "Instant inboxes",
    desc: "Register an inbox and start receiving in seconds",
  },
  {
    icon: KeyRound,
    title: "OTP extraction",
    desc: "Regex-free. We parse the code, you get the value",
  },
  {
    icon: Zap,
    title: "WebSocket push",
    desc: "Real-time delivery. No polling required",
  },
  {
    icon: CreditCard,
    title: "Credits system",
    desc: "Pay per request, never expire",
  },
  {
    icon: Globe,
    title: "Custom domains",
    desc: "Use your own domain on Growth plan and above",
  },
  {
    icon: Paperclip,
    title: "Attachment support",
    desc: "Up to 50MB on Enterprise",
  },
];

const PLANS = [
  { name: "Free", price: "$0/mo", reqSec: "1", reqMonth: "5,000", otp: false, ws: false, attachments: false, customDomains: false, support: "Community" },
  { name: "Developer", price: "$7/mo", reqSec: "10", reqMonth: "100,000", otp: true, ws: false, attachments: false, customDomains: false, support: "Email" },
  { name: "Startup", price: "$19/mo", reqSec: "25", reqMonth: "500,000", otp: true, ws: true, attachments: true, customDomains: false, support: "Email" },
  { name: "Growth", price: "$49/mo", reqSec: "50", reqMonth: "2,000,000", otp: true, ws: true, attachments: true, customDomains: true, support: "Priority" },
  { name: "Enterprise", price: "$149/mo", reqSec: "100", reqMonth: "10,000,000", otp: true, ws: true, attachments: true, customDomains: true, support: "Dedicated" },
];

const CREDITS_PACKS = [
  { amount: "$10", requests: "200k", perK: "$0.05" },
  { amount: "$25", requests: "600k", perK: "$0.042" },
  { amount: "$50", requests: "1.5M", perK: "$0.033" },
  { amount: "$100", requests: "4M", perK: "$0.025" },
];

const Tick = () => <Check className="h-3.5 w-3.5 text-foreground shrink-0" />;
const Cross = () => <X className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />;

export default function ApiOverviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Hero */}
      <section className="text-center mb-16 sm:mb-20">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
          Disposable email infrastructure for developers
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Programmatic temporary inboxes, real-time delivery via WebSocket, and automatic OTP extraction. Built for CI pipelines, test automation, and app development.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-foreground text-background hover:opacity-90 border border-border">
            <Link href="/auth?callbackUrl=/api/dashboard">Get API key</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/api/docs/quickstart">Read the docs</Link>
          </Button>
        </div>
        <div className="mt-10 max-w-2xl mx-auto">
          <ApiHeroCode />
        </div>
      </section>

      {/* Feature grid */}
      <section className="mb-20">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6 text-center">
          Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                </div>
                <CardDescription className="text-sm mt-1">{desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Plan comparison table */}
      <section className="mb-20">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6 text-center">
          Plan comparison
        </h2>
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-3 font-semibold text-muted-foreground w-32">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.name} className="py-3 px-2 text-center font-semibold">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2.5 px-3 text-muted-foreground">Price</td>
                {PLANS.map((p) => (
                  <td key={p.name} className="py-2.5 px-2 text-center font-medium">{p.price}</td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-muted-foreground">Req/sec</td>
                {PLANS.map((p) => (
                  <td key={p.name} className="py-2.5 px-2 text-center">{p.reqSec}</td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-muted-foreground">Req/month</td>
                {PLANS.map((p) => (
                  <td key={p.name} className="py-2.5 px-2 text-center">{p.reqMonth}</td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-muted-foreground">OTP extraction</td>
                {PLANS.map((p) => (
                  <td key={p.name} className="py-2.5 px-2">
                    <div className="flex justify-center items-center">{p.otp ? <Tick /> : <Cross />}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-muted-foreground">WebSocket</td>
                {PLANS.map((p) => (
                  <td key={p.name} className="py-2.5 px-2">
                    <div className="flex justify-center items-center">{p.ws ? <Tick /> : <Cross />}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-muted-foreground">Attachments</td>
                {PLANS.map((p) => (
                  <td key={p.name} className="py-2.5 px-2">
                    <div className="flex justify-center items-center">{p.attachments ? <Tick /> : <Cross />}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-muted-foreground">Custom domains</td>
                {PLANS.map((p) => (
                  <td key={p.name} className="py-2.5 px-2">
                    <div className="flex justify-center items-center">{p.customDomains ? <Tick /> : <Cross />}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-muted-foreground">Support</td>
                {PLANS.map((p) => (
                  <td key={p.name} className="py-2.5 px-2 text-center text-xs">{p.support}</td>
                ))}
              </tr>
              <tr className="bg-muted/20">
                <td className="py-3 px-3"></td>
                {PLANS.map((p) => (
                  <td key={p.name} className="py-3 px-2 text-center">
                    {p.name === "Free" ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href="/auth?callbackUrl=/api/dashboard">Get started</Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm">
                        <Link href="/api/pricing">Get started</Link>
                      </Button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Code examples - tabbed: cURL, Node, Python, Go */}
      <section className="mb-20">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6 text-center">
          Code examples
        </h2>
        <ApiCodeExamples />
      </section>

      {/* How it works */}
      <section className="mb-20">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6 text-center">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg mb-3">1</div>
            <h3 className="font-semibold text-foreground">Get an API key</h3>
            <p className="mt-1 text-sm text-muted-foreground">From your dashboard after signing in.</p>
          </div>
          <div className="text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg mb-3">2</div>
            <h3 className="font-semibold text-foreground">Register an inbox</h3>
            <p className="mt-1 text-sm text-muted-foreground">POST /v1/inboxes to create a disposable address.</p>
          </div>
          <div className="text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg mb-3">3</div>
            <h3 className="font-semibold text-foreground">Read or stream</h3>
            <p className="mt-1 text-sm text-muted-foreground">Fetch messages or subscribe via WebSocket.</p>
          </div>
        </div>
      </section>

      {/* Credits upsell */}
      <section>
        <Card className="border-border bg-muted/20">
          <CardHeader>
            <CardTitle className="text-lg">Need more?</CardTitle>
            <CardDescription>Credits never expire. Top up once, use forever.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {CREDITS_PACKS.map(({ amount, requests, perK }) => (
                <div key={amount} className="rounded-lg border border-border bg-background p-3 text-center">
                  <p className="font-semibold text-foreground">{amount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{requests} requests</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{perK}/1k</p>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/api/pricing">Full plan details</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

