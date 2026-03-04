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

      <h2 id="v1" className="text-lg font-semibold mt-8 mb-2">v1 (current)</h2>
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
