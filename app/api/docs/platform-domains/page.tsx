import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";
import { ResponseBlock } from "../ResponseBlock";

export const metadata = {
  title: "Platform domains – API Docs",
  description: "List platform-managed domains available for inbox creation.",
};

export default function PlatformDomainsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform domains</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Platform domains are managed by FreeCustom.Email and shared across all users.
        Results are plan-gated and Redis-cached with a 5-minute TTL — new domains
        appear automatically without a code change on your side.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        Looking to use your own domain? See{" "}
        <a href="/api/docs/custom-domains" className="underline underline-offset-2">
          Custom domains
        </a>
        .
      </p>

      <h2 id="plan-gating" className="text-lg font-semibold mt-8 mb-2">Plan gating</h2>
      <p className="text-sm text-muted-foreground mb-4">
        The domain list returned depends on your API plan:
      </p>
      <div className="rounded-lg border border-border overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Plan</th>
              <th className="text-left px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Domains visible</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-4 py-2.5 text-foreground">Free / Developer / Startup</td>
              <td className="px-4 py-2.5 text-muted-foreground">Free-tier domains only</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-foreground">Growth / Enterprise</td>
              <td className="px-4 py-2.5 text-muted-foreground">Free-tier + pro-tier domains</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="list" className="text-lg font-semibold mt-8 mb-2">GET /v1/domains</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Returns the domains available for inbox creation on your plan. Domains expiring
        within 30 days include <code className="rounded bg-muted px-1 py-0.5 text-xs">expires_at</code> and{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">expires_in_days</code> as a nudge to
        migrate; healthy domains omit these fields to keep the payload lean.
      </p>
      <CodeBlock
        code={`curl "https://api2.freecustom.email/v1/domains" \\
  -H "Authorization: Bearer fce_your_api_key"`}
        language="curl"
      />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock
        status={200}
        label="Success — Free / Developer / Startup"
        body={`{
  "success": true,
  "count": 10,
  "note": "Upgrade to Growth plan to access additional pro domains.",
  "data": [
    { "domain": "ditube.info",  "tier": "free", "tags": ["popular"] },
    { "domain": "ditplay.info", "tier": "free", "tags": ["popular"] },
    { "domain": "ditapi.info",  "tier": "free", "tags": [] },
    {
      "domain": "getnotify.io",
      "tier": "free",
      "tags": ["new"],
      "expires_at": "2026-04-01",
      "expires_in_days": 25,
      "expiring_soon": true
    }
  ]
}`}
      />
      <ResponseBlock
        status={200}
        label="Success — Growth / Enterprise"
        body={`{
  "success": true,
  "count": 14,
  "note": "Growth/Enterprise plan: free + pro domains included.",
  "data": [
    { "domain": "ditube.info",  "tier": "free", "tags": ["popular"] },
    { "domain": "ditmail.pro",  "tier": "pro",  "tags": ["new", "featured"] },
    { "domain": "mock-api.pro", "tier": "pro",  "tags": ["new", "featured"] }
  ]
}`}
      />

      <h2 id="all" className="text-lg font-semibold mt-8 mb-2">GET /v1/domains/all</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Same list as <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /v1/domains</code> but
        always includes full expiry metadata on every entry — useful for dashboard
        integrations that monitor domain health.
      </p>
      <CodeBlock
        code={`curl "https://api2.freecustom.email/v1/domains/all" \\
  -H "Authorization: Bearer fce_your_api_key"`}
        language="curl"
      />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock
        status={200}
        label="Success"
        body={`{
  "success": true,
  "count": 10,
  "data": [
    {
      "domain": "ditube.info",
      "tier": "free",
      "tags": ["popular"],
      "expires_at": "2026-08-01",
      "expires_in_days": 147,
      "expiring_soon": false,
      "expired": false
    },
    {
      "domain": "ditmail.pro",
      "tier": "pro",
      "tags": ["new", "featured"],
      "expires_at": "2026-09-05",
      "expires_in_days": 178,
      "expiring_soon": false,
      "expired": false
    }
  ]
}`}
      />

      <DocPageNav
        prev={{ href: "/api/docs/otp",            label: "OTP extraction"  }}
        next={{ href: "/api/docs/custom-domains",  label: "Custom domains"  }}
      />
    </article>
  );
}