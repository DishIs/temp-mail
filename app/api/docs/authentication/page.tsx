import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";

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
        Send the key in the <code className="rounded bg-muted px-1 py-0.5 text-xs">Authorization</code> header:
      </p>
      <CodeBlock code={`Authorization: Bearer fce_xxxxxxxxxxxxxxxxxxxx`} language="http" />

      <h2 id="query" className="text-lg font-semibold mt-8 mb-2">Query parameter</h2>
      <p className="text-sm text-muted-foreground mb-3">
        Alternatively, pass <code className="rounded bg-muted px-1 py-0.5 text-xs">api_key=fce_xxxx</code> as a query parameter. Prefer the header in production to avoid key leakage in logs.
      </p>

      <h2 id="security" className="text-lg font-semibold mt-8 mb-2">Security</h2>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
        <li>Never commit API keys to version control. Use environment variables or a secrets manager.</li>
        <li>Rotate keys periodically from the dashboard. Revoke compromised keys immediately.</li>
        <li>Use HTTPS only; the API does not accept plain HTTP.</li>
      </ul>

      <h2 id="errors" className="text-lg font-semibold mt-8 mb-2">Invalid key responses</h2>
      <p className="text-sm text-muted-foreground mb-2">Missing key:</p>
      <CodeBlock code={`{"error":"unauthorized","message":"Missing API key"}`} language="json" />
      <p className="text-sm text-muted-foreground mt-3 mb-2">Wrong or revoked key:</p>
      <CodeBlock code={`{"error":"invalid_api_key","message":"Invalid or revoked API key"}`} language="json" />
      <p className="text-sm text-muted-foreground mt-2">Both return HTTP 401.</p>

      <DocPageNav prev={{ href: "/api/docs/quickstart", label: "Quickstart" }} next={{ href: "/api/docs/inboxes", label: "Inbox management" }} />
    </article>
  );
}
