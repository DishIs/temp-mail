import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";
import { ResponseBlock } from "../ResponseBlock";

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
      <p className="text-sm text-muted-foreground mb-2">Returns messages for the given inbox (newest first). Query params: <code className="rounded bg-muted px-1 py-0.5 text-xs">limit</code> (default 20, max 100), <code className="rounded bg-muted px-1 py-0.5 text-xs">before</code> (message ID for pagination).</p>
      <CodeBlock code={`curl "https://api.freecustom.email/v1/inboxes/mytest@ditmail.info/messages" \\
  -H "Authorization: Bearer fce_your_api_key"`} language="curl" />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock status={200} label="Success" body={`{
  "success": true,
  "data": {
    "inbox": "mytest@ditmail.info",
    "messages": [
      {
        "id": "msg_01jqz3k4m5n6p7q8r9s0t1u2v3",
        "from": "noreply@github.com",
        "subject": "Your GitHub verification code",
        "date": "2026-03-04T09:55:00.000Z",
        "has_attachment": false,
        "otp": "482931",
        "verification_link": "https://github.com/verify?token=abc123"
      }
    ],
    "count": 1,
    "has_more": false
  }
}`} />
      <p className="text-xs text-muted-foreground mt-1">On Free plan, <code className="rounded bg-muted px-1 py-0.5">otp</code> and <code className="rounded bg-muted px-1 py-0.5">verification_link</code> may be <code className="rounded bg-muted px-1 py-0.5">__DETECTED__</code>.</p>
      <ResponseBlock status={403} label="Inbox not registered" body={`{
  "success": false,
  "error": "forbidden",
  "message": "mytest@ditmail.info is not registered on this account."
}`} />

      <h2 id="get" className="text-lg font-semibold mt-8 mb-2">GET /v1/inboxes/{`{inbox}`}/messages/{`{id}`}</h2>
      <p className="text-sm text-muted-foreground mb-2">Returns full message body (html, text), metadata, and attachments (if plan allows).</p>
      <CodeBlock code={`curl "https://api.freecustom.email/v1/inboxes/mytest@ditmail.info/messages/msg_abc123" \\
  -H "Authorization: Bearer fce_your_api_key"`} language="curl" />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock status={200} label="Success" body={`{
  "success": true,
  "data": {
    "id": "msg_01jqz3k4m5n6p7q8r9s0t1u2v3",
    "from": "noreply@github.com",
    "to": "mytest@ditmail.info",
    "subject": "Your GitHub verification code",
    "date": "2026-03-04T09:55:00.000Z",
    "html": "<p>Your code is <strong>482931</strong></p>",
    "text": "Your code is 482931",
    "otp": "482931",
    "verification_link": "https://github.com/verify?token=abc123",
    "has_attachment": true,
    "attachments": [{ "filename": "receipt.pdf", "content_type": "application/pdf", "size_bytes": 204800 }]
  }
}`} />
      <ResponseBlock status={404} label="Message not found" body={`{
  "success": false,
  "error": "not_found",
  "message": "Message msg_abc123 not found in mytest@ditmail.info."
}`} />

      <h2 id="delete" className="text-lg font-semibold mt-8 mb-2">DELETE /v1/inboxes/{`{inbox}`}/messages/{`{id}`}</h2>
      <p className="text-sm text-muted-foreground mb-2">Deletes a single message.</p>
      <CodeBlock code={`curl -X DELETE "https://api.freecustom.email/v1/inboxes/mytest@ditmail.info/messages/msg_abc123" \\
  -H "Authorization: Bearer fce_your_api_key"`} language="curl" />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock status={200} label="Deleted" body={`{
  "success": true,
  "message": "Message msg_abc123 deleted."
}`} />
      <ResponseBlock status={404} label="Not found" body={`{
  "success": false,
  "error": "not_found",
  "message": "Message msg_abc123 not found."
}`} />

      <DocPageNav prev={{ href: "/api/docs/inboxes", label: "Inbox management" }} next={{ href: "/api/docs/otp", label: "OTP extraction" }} />
    </article>
  );
}
