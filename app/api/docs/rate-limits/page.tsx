import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";

export const metadata = {
  title: "Rate limits – API Docs",
  description: "Per-second and monthly quotas.",
};

export default function RateLimitsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Rate limits</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Requests are limited per second and per month. When you exceed the monthly limit, credits (if any) are consumed automatically. Response headers expose current limits and remaining usage.
      </p>

      <h2 id="headers" className="text-lg font-semibold mt-8 mb-2">Response headers</h2>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
        <li><code className="rounded bg-muted px-1 py-0.5 text-xs">X-RateLimit-Limit-Second</code> — per-second cap</li>
        <li><code className="rounded bg-muted px-1 py-0.5 text-xs">X-RateLimit-Remaining-Second</code> — remaining this second</li>
        <li><code className="rounded bg-muted px-1 py-0.5 text-xs">X-RateLimit-Limit-Month</code> — monthly quota</li>
        <li><code className="rounded bg-muted px-1 py-0.5 text-xs">X-RateLimit-Remaining-Month</code> — remaining this month</li>
        <li><code className="rounded bg-muted px-1 py-0.5 text-xs">X-API-Plan</code> — your plan name</li>
      </ul>

      <h2 id="429" className="text-lg font-semibold mt-8 mb-2">HTTP 429</h2>
      <p className="text-sm text-muted-foreground mb-2">Per-second limit:</p>
      <CodeBlock code={`{"error":"rate_limit_exceeded","message":"Too many requests per second"}`} language="json" />
      <p className="text-sm text-muted-foreground mt-3 mb-2">Monthly quota (no credits):</p>
      <CodeBlock code={`{"error":"monthly_quota_exceeded","message":"Monthly quota exceeded"}`} language="json" />
      <p className="text-sm text-muted-foreground mt-2">Use the <code className="rounded bg-muted px-1 py-0.5 text-xs">Retry-After</code> header when present to back off.</p>

      <DocPageNav prev={{ href: "/api/docs/websocket", label: "WebSocket" }} next={{ href: "/api/docs/credits", label: "Credits" }} />
    </article>
  );
}
