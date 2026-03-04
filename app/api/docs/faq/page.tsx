import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DocPageNav } from "../DocPageNav";

export const metadata = {
  title: "FAQ – API Docs",
  description: "Frequently asked questions about the API.",
};

const FAQ = [
  { q: "Do credits expire?", a: "No. Credits never expire. Use them whenever you need." },
  { q: "What happens when I hit my monthly limit?", a: "Credits are used automatically. With no credits, you get HTTP 429 until the next reset or after adding credits." },
  { q: "Can I use my own domain?", a: "Yes, on Growth and Enterprise. Add and verify your domain in the dashboard, then register inboxes like user@yourdomain.com." },
  { q: "Is there a free trial?", a: "The Free plan is always available. Paid API plans do not include a separate trial; you can upgrade or add credits anytime." },
  { q: "How does WebSocket billing work?", a: "Each push event (e.g. new_mail) counts as one request toward your monthly quota. Connection limits apply per plan." },
  { q: "Can I switch plans mid-cycle?", a: "Yes. Upgrades apply immediately (prorated). Downgrades apply at the end of the billing period." },
  { q: "What is the difference between API plan and Pro plan?", a: "Pro is for the main FreeCustom.Email web app (inbox, custom domains, OTP in UI). The API plan is for programmatic access (api2.freecustom.email). You can have one or both." },
  { q: "How do I rotate my API key?", a: "Generate a new key in Dashboard → API → API Keys, update your app, then revoke the old key." },
  { q: "Are requests over HTTPS only?", a: "Yes. We do not accept plain HTTP." },
  { q: "What are the per-second limits?", a: "Free: 1 req/s. Developer: 10. Startup: 25. Growth: 50. Enterprise: 100." },
  { q: "What if no OTP is found?", a: "GET /v1/inboxes/{inbox}/otp returns {\"otp\": null}. It is not an error." },
  { q: "Does the Free plan show OTP values?", a: "No. Free returns __DETECTED__ when an OTP is found, so you can test the flow before upgrading." },
  { q: "Can I get a custom Enterprise arrangement?", a: "Contact us for volume pricing, SLA, or dedicated support." },
  { q: "Where is the OpenAPI spec?", a: "At /openapi.yaml on this site (v2.0, March 2026). It documents all public v1 endpoints and internal routes. Use the playground (/api/playground) or any OpenAPI client." },
  { q: "How do I store my API key securely?", a: "Use environment variables or a secrets manager. Never commit keys to version control." },
];

export default function FaqPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">FAQ</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Common questions about pricing, limits, WebSocket, OTP, and the API vs Pro plan.
      </p>

      <Accordion type="single" collapsible className="mt-6 space-y-2">
        {FAQ.map(({ q, a }, i) => (
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

      <DocPageNav prev={{ href: "/api/docs/changelog", label: "Changelog" }} next={null} />
    </article>
  );
}
