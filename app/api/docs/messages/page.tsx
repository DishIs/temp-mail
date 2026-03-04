import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";

export const metadata = {
  title: "Reading messages – API Docs",
  description: "List and fetch email messages.",
};

export default function MessagesPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Reading messages</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        List messages for an inbox and fetch a single message by ID. Attachment support depends on your plan.
      </p>

      <h2 id="list" className="text-lg font-semibold mt-8 mb-2">GET /v1/inboxes/{`{inbox}`}/messages</h2>
      <p className="text-sm text-muted-foreground mb-3">Returns messages for the given inbox (newest first).</p>
      <CodeBlock code={`curl "https://api2.freecustom.email/v1/inboxes/mytest@ditmail.info/messages" \\
  -H "Authorization: Bearer YOUR_API_KEY"`} language="curl" />

      <h2 id="get" className="text-lg font-semibold mt-8 mb-2">GET /v1/inboxes/{`{inbox}`}/messages/{`{id}`}</h2>
      <p className="text-sm text-muted-foreground mb-3">Returns full message body and metadata. Returns 404 if not found.</p>
      <CodeBlock code={`curl "https://api2.freecustom.email/v1/inboxes/mytest@ditmail.info/messages/msg_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`} language="curl" />

      <h2 id="delete" className="text-lg font-semibold mt-8 mb-2">DELETE /v1/inboxes/{`{inbox}`}/messages/{`{id}`}</h2>
      <p className="text-sm text-muted-foreground mb-3">Deletes the message. Returns 204.</p>

      <DocPageNav prev={{ href: "/api/docs/inboxes", label: "Inbox management" }} next={{ href: "/api/docs/otp", label: "OTP extraction" }} />
    </article>
  );
}
