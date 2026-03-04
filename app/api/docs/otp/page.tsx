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
      <p className="text-sm text-muted-foreground mb-3">Returns the latest extracted OTP for the inbox, or null if none found. Response fields:</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 font-medium">Field</th>
            <th className="text-left py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border"><td className="py-2 font-mono text-xs">otp</td><td className="py-2">The code, or __DETECTED__ (free), or null</td></tr>
          <tr className="border-b border-border"><td className="py-2 font-mono text-xs">email_id</td><td className="py-2">Message ID</td></tr>
          <tr className="border-b border-border"><td className="py-2 font-mono text-xs">from</td><td className="py-2">Sender address</td></tr>
          <tr className="border-b border-border"><td className="py-2 font-mono text-xs">subject</td><td className="py-2">Subject line</td></tr>
          <tr className="border-b border-border"><td className="py-2 font-mono text-xs">timestamp</td><td className="py-2">When the email was received</td></tr>
          <tr className="border-b border-border"><td className="py-2 font-mono text-xs">verification_link</td><td className="py-2">Extracted link if present</td></tr>
        </tbody>
      </table>
      <CodeBlock code={`curl "https://api2.freecustom.email/v1/inboxes/mytest@ditmail.info/otp" \\
  -H "Authorization: Bearer YOUR_API_KEY"`} language="curl" />
      <p className="text-sm text-muted-foreground mt-3">Example response:</p>
      <CodeBlock code={`{
  "otp": "847291",
  "email_id": "msg_abc123",
  "from": "noreply@instagram.com",
  "subject": "Your Instagram code is 847291",
  "timestamp": "2026-03-01T12:00:00Z",
  "verification_link": null
}`} language="json" />

      <h2 id="edge" className="text-lg font-semibold mt-8 mb-2">Edge cases</h2>
      <p className="text-sm text-muted-foreground">
        If no OTP is found, the response is <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"otp\": null }"}</code> (or similar). This is not an error — the request succeeded; there was simply no code in the latest messages.
      </p>

      <DocPageNav prev={{ href: "/api/docs/messages", label: "Reading messages" }} next={{ href: "/api/docs/websocket", label: "WebSocket" }} />
    </article>
  );
}
