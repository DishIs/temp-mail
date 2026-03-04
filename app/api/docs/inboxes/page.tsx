import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";

export const metadata = {
  title: "Inbox management – API Docs",
  description: "Register and manage disposable inboxes.",
};

export default function InboxesPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Inbox management</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Register an inbox address to start receiving email at that address. You can list and remove inboxes via the API.
      </p>

      <h2 id="list" className="text-lg font-semibold mt-8 mb-2">GET /v1/inboxes</h2>
      <p className="text-sm text-muted-foreground mb-3">Returns all inboxes registered to your account.</p>
      <CodeBlock code={`curl "https://api2.freecustom.email/v1/inboxes" \\
  -H "Authorization: Bearer YOUR_API_KEY"`} language="curl" />

      <h2 id="create" className="text-lg font-semibold mt-8 mb-2">POST /v1/inboxes</h2>
      <p className="text-sm text-muted-foreground mb-3">Request body:</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 font-medium">Field</th>
            <th className="text-left py-2 font-medium">Type</th>
            <th className="text-left py-2 font-medium">Required</th>
            <th className="text-left py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="py-2 font-mono text-xs">address</td>
            <td className="py-2">string</td>
            <td className="py-2">Yes</td>
            <td className="py-2">Full email address (e.g. test@ditmail.info)</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock code={`curl -X POST https://api2.freecustom.email/v1/inboxes \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"mytest@ditmail.info"}'`} language="curl" />

      <h2 id="delete" className="text-lg font-semibold mt-8 mb-2">DELETE /v1/inboxes/{`{inbox}`}</h2>
      <p className="text-sm text-muted-foreground mb-3">Removes the inbox from your account. Returns 204.</p>
      <CodeBlock code={`curl -X DELETE "https://api2.freecustom.email/v1/inboxes/mytest@ditmail.info" \\
  -H "Authorization: Bearer YOUR_API_KEY"`} language="curl" />

      <DocPageNav prev={{ href: "/api/docs/authentication", label: "Authentication" }} next={{ href: "/api/docs/messages", label: "Reading messages" }} />
    </article>
  );
}
