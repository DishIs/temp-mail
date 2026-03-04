import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";

export const metadata = {
  title: "OTP extraction – API Docs",
  description: "Regex-free OTP extraction from emails.",
};

export default function OtpPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">OTP extraction</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        We parse incoming email and extract one-time codes (OTP, verification codes, magic link tokens) so you get the value directly — no regex on your side. Available on Developer plan and above.
      </p>

      <h2 id="free-plan" className="text-lg font-semibold mt-8 mb-2">Free plan: __DETECTED__</h2>
      <p className="text-sm text-muted-foreground mb-3">
        On the Free plan, when an OTP is detected we return <code className="rounded bg-muted px-1 py-0.5 text-xs">{"__DETECTED__"}</code> instead of the actual code. This lets you confirm that the pipeline works before upgrading to a paid plan to receive the real value.
      </p>

      <h2 id="endpoint" className="text-lg font-semibold mt-8 mb-2">GET /v1/inboxes/{`{inbox}`}/otp</h2>
      <p className="text-sm text-muted-foreground mb-3">Returns the latest extracted OTP (and verification link) for the inbox, or null if none found. Requires Developer plan or higher. Response is under <code className="rounded bg-muted px-1 py-0.5 text-xs">data</code>:</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 font-medium">Field</th>
            <th className="text-left py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border"><td className="py-2 font-mono text-xs">otp</td><td className="py-2">The code, or null</td></tr>
          <tr className="border-b border-border"><td className="py-2 font-mono text-xs">verification_link</td><td className="py-2">Extracted link if present</td></tr>
          <tr className="border-b border-border"><td className="py-2 font-mono text-xs">from, subject</td><td className="py-2">Sender and subject</td></tr>
          <tr className="border-b border-border"><td className="py-2 font-mono text-xs">message_id, received_at</td><td className="py-2">Message ID and timestamp</td></tr>
        </tbody>
      </table>
      <CodeBlock code={`curl "https://api2.freecustom.email/v1/inboxes/mytest@ditmail.info/otp" \\
  -H "Authorization: Bearer fce_your_api_key"`} language="curl" />
      <p className="text-sm text-muted-foreground mt-3">Example success (200):</p>
      <CodeBlock code={`{
  "success": true,
  "data": {
    "inbox": "mytest@ditmail.info",
    "otp": "847291",
    "verification_link": "https://github.com/verify?token=abc123",
    "from": "noreply@example.com",
    "subject": "Your code is 847291",
    "message_id": "msg_abc123",
    "received_at": "2026-03-04T09:55:00.000Z"
  }
}`} language="json" />
      <p className="text-sm text-muted-foreground mt-2">No OTP found: <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"success\": true, \"data\": { \"otp\": null, \"verification_link\": null, \"message\": \"No OTP or verification link detected...\" } }"}</code>. 403 if plan is free (upgrade_url in body).</p>

      <h2 id="edge" className="text-lg font-semibold mt-8 mb-2">Edge cases</h2>
      <p className="text-sm text-muted-foreground">
        If no OTP is found, the response is <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"otp\": null }"}</code> (or similar). This is not an error — the request succeeded; there was simply no code in the latest messages.
      </p>

      <DocPageNav prev={{ href: "/api/docs/messages", label: "Reading messages" }} next={{ href: "/api/docs/websocket", label: "WebSocket" }} />
    </article>
  );
}
