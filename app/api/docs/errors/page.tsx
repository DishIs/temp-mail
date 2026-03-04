import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";

export const metadata = {
  title: "Errors – API Docs",
  description: "Error codes and response format.",
};

const ERROR_TABLE = [
  { code: "401", error: "unauthorized", when: "Missing API key" },
  { code: "401", error: "invalid_api_key", when: "Wrong or revoked key" },
  { code: "403", error: "plan_required", when: "Feature not in current plan" },
  { code: "403", error: "inbox_not_owned", when: "Inbox not registered to you" },
  { code: "403", error: "domain_not_verified", when: "Custom domain not verified" },
  { code: "404", error: "not_found", when: "Message or resource doesn't exist" },
  { code: "429", error: "rate_limit_exceeded", when: "Per-second limit hit" },
  { code: "429", error: "monthly_quota_exceeded", when: "Monthly limit hit, no credits" },
  { code: "500", error: "server_error", when: "Our fault" },
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

      <p className="text-sm text-muted-foreground mt-4">Example body:</p>
      <CodeBlock code={`{"error":"plan_required","message":"OTP extraction requires Developer plan or above"}`} language="json" />

      <DocPageNav prev={{ href: "/api/docs/credits", label: "Credits" }} next={{ href: "/api/docs/changelog", label: "Changelog" }} />
    </article>
  );
}
