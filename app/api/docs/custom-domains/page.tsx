import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";
import { ResponseBlock } from "../ResponseBlock";

export const metadata = {
  title: "Custom domains – API Docs",
  description: "Add, verify, and remove your own domains to receive mail at any address.",
};

export default function CustomDomainsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Custom domains</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Bring your own domain and receive mail at any address{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">@yourdomain</code>.
        Custom domains are shared between the API and the webapp dashboard — a domain
        added here appears in the dashboard immediately, and vice-versa.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Requires:</strong> Growth ($49/mo) or Enterprise ($149/mo) plan.
      </p>

      <h2 id="workflow" className="text-lg font-semibold mt-8 mb-2">Workflow</h2>
      <ol className="text-sm text-muted-foreground space-y-1.5 pl-5 list-decimal">
        <li><code className="rounded bg-muted px-1 py-0.5 text-xs">POST /v1/custom-domains</code> — add the domain, receive the two DNS records.</li>
        <li>Add the <strong className="text-foreground">MX</strong> and <strong className="text-foreground">TXT</strong> records at your registrar.</li>
        <li><code className="rounded bg-muted px-1 py-0.5 text-xs">POST /v1/custom-domains/{"{domain}"}/verify</code> — confirm DNS propagation.</li>
        <li><code className="rounded bg-muted px-1 py-0.5 text-xs">POST /v1/inboxes</code> with any <code className="rounded bg-muted px-1 py-0.5 text-xs">user@yourdomain</code> — start receiving mail.</li>
      </ol>
      <p className="text-xs text-muted-foreground mt-3">
        DNS propagation can take up to 48 hours. Most providers update within minutes.
      </p>

      <h2 id="list" className="text-lg font-semibold mt-8 mb-2">GET /v1/custom-domains</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Returns all custom domains on your account with their verification status and
        the DNS records needed to verify them.
      </p>
      <CodeBlock
        code={`curl "https://api2.freecustom.email/v1/custom-domains" \\
  -H "Authorization: Bearer fce_your_api_key"`}
        language="curl"
      />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock
        status={200}
        label="Success"
        body={`{
  "success": true,
  "count": 2,
  "data": [
    {
      "domain": "mail.acme.com",
      "verified": true,
      "mx_record": "mx.freecustom.email",
      "txt_record": "freecustomemail-verification=a1b2c3d4e5f6...",
      "added_at": "2026-01-15T10:00:00.000Z"
    },
    {
      "domain": "staging.acme.com",
      "verified": false,
      "mx_record": "mx.freecustom.email",
      "txt_record": "freecustomemail-verification=9z8y7x6w5v4u...",
      "added_at": "2026-03-10T08:30:00.000Z"
    }
  ]
}`}
      />
      <ResponseBlock
        status={403}
        label="Plan too low"
        body={`{
  "success": false,
  "error": "plan_required",
  "message": "Custom domains require Growth ($49/mo) or Enterprise ($149/mo) plan.",
  "upgrade_url": "https://freecustom.email/api/pricing"
}`}
      />

      <h2 id="add" className="text-lg font-semibold mt-8 mb-2">POST /v1/custom-domains</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Adds a new domain and returns the two DNS records to configure at your registrar.
        This call is <strong className="text-foreground">idempotent</strong> — if the domain is already
        added it returns the existing entry with <code className="rounded bg-muted px-1 py-0.5 text-xs">200</code>.
        Maximum 10 custom domains per account.
      </p>
      <CodeBlock
        code={`curl -X POST "https://api2.freecustom.email/v1/custom-domains" \\
  -H "Authorization: Bearer fce_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{ "domain": "mail.acme.com" }'`}
        language="curl"
      />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock
        status={201}
        label="Domain added"
        body={`{
  "success": true,
  "message": "Domain added. Configure the DNS records below, then call the verify endpoint.",
  "data": {
    "domain": "mail.acme.com",
    "verified": false,
    "mx_record": "mx.freecustom.email",
    "txt_record": "freecustomemail-verification=a1b2c3d4e5f6...",
    "added_at": "2026-03-11T12:00:00.000Z",
    "dns_records": [
      { "type": "MX",  "hostname": "@", "value": "mx.freecustom.email", "priority": "10", "ttl": "Auto" },
      { "type": "TXT", "hostname": "@", "value": "freecustomemail-verification=a1b2c3d4e5f6...", "ttl": "Auto" }
    ],
    "next_step": "POST /v1/custom-domains/mail.acme.com/verify"
  }
}`}
      />
      <ResponseBlock
        status={400}
        label="Limit reached"
        body={`{
  "success": false,
  "error": "limit_reached",
  "message": "Maximum of 10 custom domains reached."
}`}
      />
      <ResponseBlock
        status={400}
        label="Invalid domain"
        body={`{
  "success": false,
  "error": "invalid_domain",
  "message": "Must be a valid domain name (e.g. \\"mail.yourdomain.com\\")."
}`}
      />

      <h2 id="verify" className="text-lg font-semibold mt-8 mb-2">POST /v1/custom-domains/{"{domain}"}/verify</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Triggers a live DNS lookup for the domain's MX and TXT records. Call this after
        adding the records at your registrar. If it fails, the response tells you exactly
        which record is missing so you know what to fix.
      </p>

      <div className="rounded-lg border border-border overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Type</th>
              <th className="text-left px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Host</th>
              <th className="text-left px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Value</th>
              <th className="text-left px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Priority</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground">MX</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">@</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">mx.freecustom.email</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">10</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground">TXT</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">@</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">freecustomemail-verification=&lt;token&gt;</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">—</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        The <code className="rounded bg-muted px-1 py-0.5">{"<token>"}</code> is the value
        returned in <code className="rounded bg-muted px-1 py-0.5">txt_record</code> when you
        added the domain. It is unique per domain + account.
      </p>

      <CodeBlock
        code={`curl -X POST "https://api2.freecustom.email/v1/custom-domains/mail.acme.com/verify" \\
  -H "Authorization: Bearer fce_your_api_key"`}
        language="curl"
      />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock
        status={200}
        label="Verified"
        body={`{
  "success": true,
  "verified": true,
  "message": "Domain \\"mail.acme.com\\" verified successfully. You can now register inboxes at @mail.acme.com.",
  "data": {
    "domain": "mail.acme.com",
    "verified": true,
    "mx_record": "mx.freecustom.email",
    "txt_record": "freecustomemail-verification=a1b2c3d4e5f6...",
    "added_at": "2026-03-11T12:00:00.000Z"
  }
}`}
      />
      <ResponseBlock
        status={422}
        label="DNS records not found yet"
        body={`{
  "success": false,
  "verified": false,
  "error": "verification_failed",
  "message": "TXT record \\"freecustomemail-verification=a1b2c3d4e5f6...\\" not found.",
  "hint": "DNS propagation can take up to 48 hours.",
  "dns_records_needed": [
    { "type": "MX",  "hostname": "@", "value": "mx.freecustom.email", "priority": "10" },
    { "type": "TXT", "hostname": "@", "value": "freecustomemail-verification=a1b2c3d4e5f6..." }
  ]
}`}
      />
      <ResponseBlock
        status={404}
        label="Domain not added yet"
        body={`{
  "success": false,
  "error": "domain_not_found",
  "message": "\\"mail.acme.com\\" not found. Add it first via POST /v1/custom-domains."
}`}
      />

      <h2 id="delete" className="text-lg font-semibold mt-8 mb-2">DELETE /v1/custom-domains/{"{domain}"}</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Permanently removes a custom domain from your account. All API inboxes registered
        at <code className="rounded bg-muted px-1 py-0.5 text-xs">@{"{domain}"}</code> are
        automatically unregistered and listed in <code className="rounded bg-muted px-1 py-0.5 text-xs">inboxes_removed</code>.
        The domain is also removed from the webapp dashboard.
      </p>
      <CodeBlock
        code={`curl -X DELETE "https://api2.freecustom.email/v1/custom-domains/mail.acme.com" \\
  -H "Authorization: Bearer fce_your_api_key"`}
        language="curl"
      />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock
        status={200}
        label="Removed"
        body={`{
  "success": true,
  "message": "\\"mail.acme.com\\" removed.",
  "inboxes_removed": [
    "support@mail.acme.com",
    "noreply@mail.acme.com"
  ]
}`}
      />
      <ResponseBlock
        status={404}
        label="Not found"
        body={`{
  "success": false,
  "error": "domain_not_found",
  "message": "Domain \\"mail.acme.com\\" not found in your account."
}`}
      />

      <DocPageNav
        prev={{ href: "/api/docs/platform-domains", label: "Platform domains" }}
        next={{ href: "/api/docs/websocket",         label: "WebSocket"        }}
      />
    </article>
  );
}