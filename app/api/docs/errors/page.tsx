import { DocPageNav } from "../DocPageNav";
import { ResponseBlock } from "../ResponseBlock";

export const metadata = {
  title: "Errors – API Docs",
  description: "Error codes and response format.",
};

const ERROR_TABLE = [
  { code: "400", error: "missing_field / invalid_inbox", when: "Missing or invalid request body (e.g. inbox required)" },
  { code: "401", error: "unauthorized", when: "Missing or malformed API key" },
  { code: "401", error: "key_revoked", when: "API key has been revoked" },
  { code: "403", error: "forbidden", when: "Inbox not registered to this account" },
  { code: "403", error: "plan_restriction", when: "Feature not in current plan (OTP, WebSocket, custom domain)" },
  { code: "403", error: "domain_not_verified", when: "Custom domain not verified in dashboard" },
  { code: "404", error: "not_found", when: "Message or inbox not found" },
  { code: "409", error: "already_registered", when: "Inbox already registered to this account" },
  { code: "429", error: "rate_limit_exceeded", when: "Per-second limit hit (Retry-After header)" },
  { code: "429", error: "monthly_quota_exceeded", when: "Monthly quota exhausted, no credits" },
  { code: "500", error: "server_error", when: "Internal server error" },
];

export default function ErrorsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Error reference</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        All errors return a JSON body with an <code className="rounded bg-muted px-1 py-0.5 text-xs">error</code> field and usually a <code className="rounded bg-muted px-1 py-0.5 text-xs">message</code>.
      </p>

      <table className="w-full text-sm border-collapse mt-6">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 font-medium">HTTP</th>
            <th className="text-left py-2 font-medium">error</th>
            <th className="text-left py-2 font-medium">When</th>
          </tr>
        </thead>
        <tbody>
          {ERROR_TABLE.map((row) => (
            <tr key={row.error} className="border-b border-border">
              <td className="py-2 font-mono text-xs">{row.code}</td>
              <td className="py-2 font-mono text-xs">{row.error}</td>
              <td className="py-2">{row.when}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-sm text-muted-foreground mt-4">All errors include <code className="rounded bg-muted px-1 py-0.5 text-xs">success: false</code> and an <code className="rounded bg-muted px-1 py-0.5 text-xs">error</code> code. Example:</p>
      <ResponseBlock status={403} label="Plan restriction (example)" body={`{
  "success": false,
  "error": "plan_restriction",
  "message": "OTP extraction requires Developer plan or higher. Your current plan: free.",
  "upgrade_url": "https://freecustom.email/api/pricing"
}`} />

      <DocPageNav prev={{ href: "/api/docs/credits", label: "Credits" }} next={{ href: "/api/docs/changelog", label: "Changelog" }} />
    </article>
  );
}
