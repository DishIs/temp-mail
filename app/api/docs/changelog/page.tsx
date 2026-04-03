import { DocPageNav } from "../DocPageNav";

export const metadata = {
  title: "Changelog – API Docs",
  description: "API changes and releases.",
};

export default function ChangelogPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Changelog</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Notable changes to the developer API (api2.freecustom.email/v1). For product-wide updates, see the main site changelog.
      </p>

      <h2 className="text-lg font-semibold mt-8 mb-2">April 2026: Webhooks, MCP & Wait API</h2>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
        <li><strong>Webhooks:</strong> Real-time HTTP push notifications when emails arrive. Manage endpoints directly from the API Dashboard.</li>
        <li><strong>Model Context Protocol (MCP):</strong> Direct support for AI agents through the official FCE MCP server.</li>
        <li><strong>Wait API:</strong> Added <code className="rounded bg-muted px-1 py-0.5 text-xs">wait=true</code> and <code className="rounded bg-muted px-1 py-0.5 text-xs">timeout</code> parameters to <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /inboxes/{`{inbox}`}/messages</code> for HTTP long-polling.</li>
        <li><strong>Max Inboxes:</strong> Added enforced maximum active inbox limits across different pricing tiers.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-8 mb-2">March 2026: Official SDKs, AI & Yearly Billing</h2>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
        <li><strong>AI Assistant:</strong> Built-in FCE AI introduced to help write test suites and navigate API docs.</li>
        <li><strong>Official SDKs:</strong> Released Python and Node.js SDKs with native TypeScript support, automatic OTP extraction, and WebSocket connectivity.</li>
        <li><strong>Yearly Billing:</strong> Introduced yearly pricing options with 2 months free across all paid API tiers.</li>
        <li><strong>Global Search:</strong> Integrated high-performance global search across the documentation and landing pages.</li>
      </ul>

      <h2 id="v1" className="text-lg font-semibold mt-8 mb-2">v1 (Initial Release)</h2>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
        <li>Stable base URL: <code className="rounded bg-muted px-1 py-0.5 text-xs">https://api2.freecustom.email/v1</code></li>
        <li>Endpoints: /me, /usage, /plans, /inboxes, /inboxes/{`{inbox}`}/messages, /inboxes/{`{inbox}`}/otp</li>
        <li>WebSocket at wss://api2.freecustom.email/v1/ws</li>
        <li>Plans: Free, Developer, Startup, Growth, Enterprise. Credits never expire.</li>
      </ul>

      <DocPageNav prev={{ href: "/api/docs/errors", label: "Errors" }} next={{ href: "/api/docs/faq", label: "FAQ" }} />
    </article>
  );
}
