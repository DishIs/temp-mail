import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";
import { ResponseBlock } from "../ResponseBlock";

export const metadata = {
  title: "Authentication – API Docs",
  description: "API key generation, Bearer token, and security.",
};

export default function AuthenticationPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Authentication</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        All API requests must include your API key. Generate keys from Dashboard → API → API Keys. Each key is shown once; store it securely.
      </p>

      <h2 id="bearer" className="text-lg font-semibold mt-8 mb-2">Bearer token (recommended)</h2>
      <p className="text-sm text-muted-foreground mb-3">
        Send your API key in the <code className="rounded bg-muted px-1 py-0.5 text-xs">Authorization</code> header. Keys start with <code className="rounded bg-muted px-1 py-0.5 text-xs">fce_</code>.
      </p>
      <CodeBlock code={`Authorization: Bearer fce_xxxxxxxxxxxxxxxxxxxx`} language="http" />

      <h2 id="query" className="text-lg font-semibold mt-8 mb-2">Query parameter</h2>
      <p className="text-sm text-muted-foreground mb-3">
        Alternatively, pass <code className="rounded bg-muted px-1 py-0.5 text-xs">api_key=fce_xxxx</code> as a query parameter (e.g. for WebSocket). Prefer the header in production to avoid key leakage in logs.
      </p>

      <h2 id="security" className="text-lg font-semibold mt-8 mb-2">Security</h2>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
        <li>Never commit API keys to version control. Use environment variables or a secrets manager.</li>
        <li>Rotate keys periodically from Dashboard → API → API Keys. Revoke compromised keys immediately.</li>
        <li>Use HTTPS only; the API does not accept plain HTTP.</li>
      </ul>

      <h2 id="errors" className="text-lg font-semibold mt-8 mb-2">Invalid key responses</h2>
      <p className="text-sm text-muted-foreground mb-2">All auth errors return HTTP 401 with one of the following bodies:</p>
      <ResponseBlock status={401} label="Missing or malformed key" body={`{
  "success": false,
  "error": "unauthorized",
  "message": "Missing or invalid API key. Pass your key in the Authorization header: Bearer fce_..."
}`} />
      <ResponseBlock status={401} label="Revoked key" body={`{
  "success": false,
  "error": "key_revoked",
  "message": "This API key has been revoked. Generate a new key at freecustom.email/dashboard/api."
}`} />

      <DocPageNav prev={{ href: "/api/docs/quickstart", label: "Quickstart" }} next={{ href: "/api/docs/inboxes", label: "Inbox management" }} />
    </article>
  );
}
