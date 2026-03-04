import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";

export const metadata = {
  title: "Quickstart – API Docs",
  description: "Get started with the FreeCustom.Email API in minutes.",
};

export default function QuickstartPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Quickstart</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        This guide walks you from zero to receiving emails and extracting OTPs via the API. You will create an account, generate an API key, register a disposable inbox, and call the main endpoints.
      </p>

      <h2 id="step-1" className="text-lg font-semibold mt-8 mb-2">1. Create an account</h2>
      <p className="text-sm text-muted-foreground">
        Sign up at <Link href="https://www.freecustom.email" className="text-primary hover:underline">freecustom.email</Link> with Google, GitHub, or email. No credit card required for the Free plan.
      </p>

      <h2 id="step-2" className="text-lg font-semibold mt-8 mb-2">2. Go to Dashboard → API tab</h2>
      <p className="text-sm text-muted-foreground">
        After signing in, open your <Link href="/dashboard" className="text-primary hover:underline">Dashboard</Link> and click the <strong>API</strong> tab. If you do not see it, you are on the main app dashboard; the API tab appears once you have (or can have) an API plan.
      </p>

      <h2 id="step-3" className="text-lg font-semibold mt-8 mb-2">3. Generate an API key</h2>
      <p className="text-sm text-muted-foreground">
        In the API dashboard, click <strong>Generate new key</strong>. Copy the key immediately — it is shown only once. Store it in your environment (e.g. <code className="rounded bg-muted px-1 py-0.5 text-xs">FCE_API_KEY</code>) and never commit it to version control.
      </p>

      <h2 id="step-4" className="text-lg font-semibold mt-8 mb-2">4. Register your first inbox</h2>
      <p className="text-sm text-muted-foreground mb-3">
        Send a <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /v1/inboxes</code> request with the <code className="rounded bg-muted px-1 py-0.5 text-xs">inbox</code> field (full email address). The address must use a domain we support (e.g. <code className="rounded bg-muted px-1 py-0.5 text-xs">@ditmail.info</code>).
      </p>
      <CodeBlock code={`curl -X POST https://api2.freecustom.email/v1/inboxes \\
  -H "Authorization: Bearer fce_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"inbox":"mytest@ditmail.info"}'`} language="curl" />
      <p className="text-sm text-muted-foreground mt-2">
        Success (201): <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"success\": true, \"data\": { \"inbox\": \"mytest@ditmail.info\", \"registered_at\": \"2026-03-04T10:00:00.000Z\" } }"}</code>
      </p>

      <h2 id="step-5" className="text-lg font-semibold mt-8 mb-2">5. Send a test email</h2>
      <p className="text-sm text-muted-foreground">
        From any email client or script, send an email to the address you registered (e.g. <code className="rounded bg-muted px-1 py-0.5 text-xs">mytest@ditmail.info</code>). For OTP testing, send a message with a subject or body containing a 4–8 digit code.
      </p>

      <h2 id="step-6" className="text-lg font-semibold mt-8 mb-2">6. Fetch the inbox messages</h2>
      <p className="text-sm text-muted-foreground mb-3">
        Use <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /v1/inboxes/{`{inbox}`}/messages</code> to list messages for that inbox.
      </p>
      <CodeBlock code={`curl "https://api2.freecustom.email/v1/inboxes/mytest@ditmail.info/messages" \\
  -H "Authorization: Bearer fce_your_api_key"`} language="curl" />

      <h2 id="step-7" className="text-lg font-semibold mt-8 mb-2">7. Extract the OTP</h2>
      <p className="text-sm text-muted-foreground mb-3">
        On Developer plan and above, <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /v1/inboxes/{`{inbox}`}/otp</code> returns the latest detected OTP. On the Free plan you receive <code className="rounded bg-muted px-1 py-0.5 text-xs">{"__DETECTED__"}</code> to indicate that an OTP was found (upsell).
      </p>
      <CodeBlock code={`curl "https://api2.freecustom.email/v1/inboxes/mytest@ditmail.info/otp" \\
  -H "Authorization: Bearer fce_your_api_key"`} language="curl" />
      <p className="text-sm text-muted-foreground mt-2">
        Example response: <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"success\": true, \"data\": { \"otp\": \"847291\", \"verification_link\": \"https://...\", \"from\": \"noreply@example.com\", \"subject\": \"Your code is 847291\", \"message_id\": \"msg_abc\", \"received_at\": \"2026-03-04T09:55:00.000Z\" } }"}</code>
      </p>

      <h2 id="step-8" className="text-lg font-semibold mt-8 mb-2">8. Subscribe via WebSocket</h2>
      <p className="text-sm text-muted-foreground mb-3">
        On Startup plan and above, you can open a WebSocket to receive new messages in real time. See the <Link href="/api/docs/websocket" className="text-primary hover:underline">WebSocket guide</Link> for the connection URL and event format.
      </p>

      <h3 className="text-base font-semibold mt-6 mb-2">Setup per language</h3>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
        <li><strong>Node.js</strong>: <code className="rounded bg-muted px-1 py-0.5 text-xs">npm install node-fetch</code> (or use built-in fetch in Node 18+).</li>
        <li><strong>Python</strong>: <code className="rounded bg-muted px-1 py-0.5 text-xs">pip install requests</code>.</li>
        <li><strong>Go</strong>: use <code className="rounded bg-muted px-1 py-0.5 text-xs">net/http</code> from the standard library.</li>
        <li><strong>PHP</strong>: <code className="rounded bg-muted px-1 py-0.5 text-xs">curl</code> extension or Guzzle.</li>
      </ul>

      <div className="mt-8 p-4 rounded-lg border border-border bg-muted/20 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Full API reference</p>
        <p className="mb-2">
          These docs cover every endpoint and feature in the API: authentication, inboxes, messages, OTP extraction, WebSocket, rate limits, credits, and errors. For a machine-readable spec (OpenAPI 3.1), use <a href="/openapi.yaml" target="_blank" rel="noopener noreferrer" className="text-primary underline">/openapi.yaml</a>. Try requests in the browser in the <Link href="/api/playground" className="text-primary underline">Playground</Link>.
        </p>
      </div>

      <DocPageNav prev={null} next={{ href: "/api/docs/authentication", label: "Authentication" }} />
    </article>
  );
}
