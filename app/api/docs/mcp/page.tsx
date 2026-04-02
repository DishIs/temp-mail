import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";
import { ResponseBlock } from "../ResponseBlock";

export const metadata = {
  title: "MCP Access – AI-Native Email Workflows",
  description: "Model Context Protocol integration for FreeCustom.Email.",
};

export default function McpDocsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        MCP — AI-Native Email Workflows
      </h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        The FreeCustom.Email MCP layer is a premium interface built specifically for AI agents and LLMs. It wraps our backend into intent-driven tools that agents can call directly — no polling, no regex, no glue code.
      </p>

      {/* Plan gating */}
      <h2 id="plans" className="text-lg font-semibold mt-8 mb-2">
        Plan Requirements
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        MCP access requires the <strong>Growth</strong> ($49/mo) or <strong>Enterprise</strong> ($149/mo) plan. Lower plans receive a structured error with an upgrade hint.
      </p>
      <div className="rounded-lg border border-border overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              {["Plan", "MCP Access", "Ops / min", "Concurrent sessions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Free",       ok: false, ops: "—", sess: "—" },
              { name: "Developer",  ok: false, ops: "—", sess: "—" },
              { name: "Startup",    ok: false, ops: "—", sess: "—" },
              { name: "Growth",     ok: true,  ops: "60", sess: "5" },
              { name: "Enterprise", ok: true,  ops: "200", sess: "10" },
            ].map((r) => (
              <tr key={r.name} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  {r.ok ? <span className="text-foreground">✓</span> : <span className="text-muted-foreground/40">✗ Blocked</span>}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.ops}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.sess}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ResponseBlock
        status={403}
        label="MCP not available on plan"
        body={`{
  "error": "MCP not available on your plan",
  "upgrade": "Growth required",
  "upgrade_required": true,
  "recommended_plan": "growth",
  "pricing_url": "https://freecustom.email/api/pricing"
}`}
      />

      {/* Installation */}
      <h2 id="install" className="text-lg font-semibold mt-10 mb-2">
        Installation — NPX (Recommended)
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Add the following to your MCP client config (e.g., Claude Desktop&apos;s{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">claude_desktop_config.json</code>):
      </p>
      <CodeBlock
        language="json"
        code={`{
  "mcpServers": {
    "fce-mcp": {
      "command": "npx",
      "args": ["-y", "maildrop-mcp-server"],
      "env": {
        "FCE_API_KEY": "your_growth_or_enterprise_api_key"
      }
    }
  }
}`}
      />

      <h3 className="text-base font-semibold mt-6 mb-2">Option 2 — From Source</h3>
      <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
        <li>
          Clone the repo and navigate to <code className="rounded bg-muted px-1 py-0.5 text-xs">mcp-server/</code>.
        </li>
        <li>
          Run <code className="rounded bg-muted px-1 py-0.5 text-xs">npm install</code> and{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run build</code>.
        </li>
        <li>
          Point your config at <code className="rounded bg-muted px-1 py-0.5 text-xs">node build/index.js</code>.
        </li>
      </ol>

      {/* Tools */}
      <h2 id="tools" className="text-lg font-semibold mt-10 mb-2">
        Tools Reference
      </h2>

      {/* get_latest_email */}
      <h3 id="get-latest-email" className="text-base font-semibold mt-6 mb-1">
        <code>get_latest_email</code>
      </h3>
      <p className="text-sm text-muted-foreground mb-1">
        Retrieves the most recent email for a registered inbox.
        <span className="ml-2 font-mono text-[10px] border border-border rounded px-1.5 py-px text-muted-foreground">
          2× credit cost
        </span>
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        <strong>Args:</strong> <code className="rounded bg-muted px-1 py-0.5 text-xs">inbox</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · required</span>
      </p>
      <CodeBlock
        language="bash"
        code={`# Equivalent REST call (MCP wraps this automatically)
GET /v1/mcp/inboxes/{inbox}/messages/latest`}
      />
      <ResponseBlock
        status={200}
        label="Success"
        body={`{
  "success": true,
  "data": {
    "id": "msg_01jqz3k4m5n6",
    "from": "noreply@github.com",
    "subject": "Your GitHub verification code",
    "date": "2026-03-04T09:55:00.000Z",
    "text": "Your code is 482931",
    "otp": "482931",
    "verificationLink": "https://github.com/verify?token=abc123"
  }
}`}
      />

      {/* extract_otp */}
      <h3 id="extract-otp" className="text-base font-semibold mt-8 mb-1">
        <code>extract_otp</code>
      </h3>
      <p className="text-sm text-muted-foreground mb-1">
        Parses and returns the latest 4–6 digit OTP or verification link.
        <span className="ml-2 font-mono text-[10px] border border-border rounded px-1.5 py-px text-muted-foreground">
          3× credit cost
        </span>
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        <strong>Args:</strong> <code className="rounded bg-muted px-1 py-0.5 text-xs">inbox</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · required</span>
      </p>
      <CodeBlock
        language="bash"
        code={`GET /v1/mcp/inboxes/{inbox}/otp`}
      />
      <ResponseBlock
        status={200}
        label="OTP found"
        body={`{
  "success": true,
  "otp": "482931",
  "email_id": "msg_01jqz3k4m5n6",
  "from": "noreply@github.com",
  "subject": "Your GitHub verification code",
  "timestamp": 1709546100000,
  "verification_link": "https://github.com/verify?token=abc123"
}`}
      />
      <ResponseBlock
        status={200}
        label="No OTP found"
        body={`{
  "success": true,
  "otp": null,
  "message": "No OTP found in recent messages."
}`}
      />

      {/* create_and_wait_for_otp */}
      <h3 id="create-and-wait" className="text-base font-semibold mt-8 mb-1">
        <code>create_and_wait_for_otp</code>{" "}
        <span className="font-mono text-[10px] border border-foreground/30 text-foreground/70 rounded px-1.5 py-px ml-1">
          🔥 GOLD
        </span>
      </h3>
      <p className="text-sm text-muted-foreground mb-1">
        Creates a random inbox and holds the HTTP connection open (long-poll) until an OTP email arrives. Enables a complete registration verification flow in a single tool call.
        <span className="ml-2 font-mono text-[10px] border border-border rounded px-1.5 py-px text-muted-foreground">
          5× credit cost
        </span>
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        <strong>Args:</strong>{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">domain</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · optional</span>
        {" · "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">timeout</code>{" "}
        <span className="text-muted-foreground/60 text-xs">number (10–60) · optional · default 45</span>
      </p>
      <CodeBlock
        language="bash"
        code={`POST /v1/mcp/create-and-wait-otp
Content-Type: application/json

{ "domain": "ditube.info", "timeout": 45 }`}
      />
      <ResponseBlock
        status={200}
        label="OTP received"
        body={`{
  "success": true,
  "inbox": "x7k9mq2p@ditube.info",
  "otp": "847291",
  "verification_link": null,
  "from": "service@acme.com",
  "subject": "Your verification code"
}`}
      />
      <ResponseBlock
        status={200}
        label="Timeout (no OTP received)"
        body={`{
  "success": false,
  "inbox": "x7k9mq2p@ditube.info",
  "message": "Timeout reached, no OTP received"
}`}
      />
      <ResponseBlock
        status={429}
        label="Rate limit exceeded"
        body={`{
  "success": false,
  "error": "mcp_rate_limit_exceeded",
  "message": "MCP limit of 60 ops/min exceeded.",
  "upgrade_required": true,
  "recommended_plan": "enterprise"
}`}
      />

      {/* Abuse & Limits */}
      <h2 id="limits" className="text-lg font-semibold mt-10 mb-2">
        Abuse Protection & Limits
      </h2>
      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
        MCP traffic runs through the Abuse Engine before the normal rate-limiter. The following limits apply in addition to your plan&apos;s monthly quota:
      </p>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
        <li>
          <strong>Ops/minute cap:</strong> 60 (Growth) or 200 (Enterprise). Exceeding returns a structured 429.
        </li>
        <li>
          <strong>Timeout cap:</strong> Connections are forcefully closed after 60 seconds regardless of the{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">timeout</code> param.
        </li>
        <li>
          <strong>Multiplier deduction:</strong> Credits are deducted immediately at call time (2×, 3×, or 5× the base rate).
        </li>
      </ul>

      <DocPageNav
        prev={{ href: "/api/docs/websocket", label: "WebSocket" }}
        next={{ href: "/api/docs/sdk", label: "SDKs" }}
      />
    </article>
  );
}