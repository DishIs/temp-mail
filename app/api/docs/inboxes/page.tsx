import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";
import { ResponseBlock } from "../ResponseBlock";

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
      <p className="text-sm text-muted-foreground mb-2">Returns all inboxes registered to your account.</p>
      <CodeBlock code={`curl "https://api2.freecustom.email/v1/inboxes" \\
  -H "Authorization: Bearer fce_your_api_key"`} language="curl" />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock status={200} label="Success" body={`{
  "success": true,
  "data": {
    "inboxes": ["test@freecustom.email", "staging@acme.com"],
    "count": 2
  }
}`} />
      <ResponseBlock status={200} label="Empty" body={`{
  "success": true,
  "data": { "inboxes": [], "count": 0 }
}`} />
      <ResponseBlock status={401} label="Missing or invalid API key" body={`{
  "success": false,
  "error": "unauthorized",
  "message": "Missing or invalid API key. Pass your key in the Authorization header: Bearer fce_..."
}`} />

      <h2 id="create" className="text-lg font-semibold mt-8 mb-2">POST /v1/inboxes</h2>
      <p className="text-sm text-muted-foreground mb-2">Request body:</p>
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
            <td className="py-2 font-mono text-xs">inbox</td>
            <td className="py-2">string</td>
            <td className="py-2">Yes</td>
            <td className="py-2">Full email address (e.g. test@freecustom.email)</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock code={`curl -X POST https://api2.freecustom.email/v1/inboxes \\
  -H "Authorization: Bearer fce_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"inbox":"mytest@ditapi.info"}'`} language="curl" />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock status={201} label="Inbox registered" body={`{
  "success": true,
  "data": {
    "inbox": "mytest@ditapi.info",
    "registered_at": "2026-03-04T10:00:00.000Z"
  }
}`} />
      <ResponseBlock status={400} label="Missing inbox" body={`{
  "success": false,
  "error": "missing_field",
  "message": "inbox is required."
}`} />
      <ResponseBlock status={400} label="Invalid email format" body={`{
  "success": false,
  "error": "invalid_inbox",
  "message": "\\"not-an-email\\" is not a valid email address."
}`} />
      <ResponseBlock status={403} label="Custom domain requires upgrade" body={`{
  "success": false,
  "error": "plan_restriction",
  "message": "Custom domain inboxes require the Growth plan or higher.",
  "upgrade_url": "https://freecustom.email/api/pricing"
}`} />
      <ResponseBlock status={409} label="Already registered" body={`{
  "success": false,
  "error": "already_registered",
  "message": "mytest@ditapi.info is already registered to this account."
}`} />

      <h2 id="delete" className="text-lg font-semibold mt-8 mb-2">DELETE /v1/inboxes/{`{inbox}`}</h2>
      <p className="text-sm text-muted-foreground mb-2">Unregisters the inbox. Path <code className="rounded bg-muted px-1 py-0.5 text-xs">inbox</code> must be URL-encoded (e.g. test%40freecustom.email).</p>
      <CodeBlock code={`curl -X DELETE "https://api2.freecustom.email/v1/inboxes/mytest%40ditapi.info" \\
  -H "Authorization: Bearer fce_your_api_key"`} language="curl" />
      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock status={200} label="Unregistered" body={`{
  "success": true,
  "message": "mytest@ditapi.info has been unregistered."
}`} />
      <ResponseBlock status={404} label="Not registered" body={`{
  "success": false,
  "error": "not_found",
  "message": "mytest@ditapi.info is not registered on this account."
}`} />

      <DocPageNav prev={{ href: "/api/docs/authentication", label: "Authentication" }} next={{ href: "/api/docs/messages", label: "Reading messages" }} />
    </article>
  );
}
