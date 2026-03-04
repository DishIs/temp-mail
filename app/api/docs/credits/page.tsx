import Link from "next/link";
import { DocPageNav } from "../DocPageNav";

export const metadata = {
  title: "Credits – API Docs",
  description: "Credits never expire. Top up and use overages.",
};

export default function CreditsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Credits</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Credits are used automatically when you exceed your monthly request quota. They never expire — top up once and use them whenever you need. Purchase from <Link href="/api/pricing" className="text-primary hover:underline">API pricing</Link> or your dashboard.
      </p>

      <h2 id="packages" className="text-lg font-semibold mt-8 mb-2">Packages</h2>
      <p className="text-sm text-muted-foreground">Starter $10 → 50k · Builder $25 → 150k · Scale $50 → 350k · Pro $100 → 800k requests. Credits never expire; they are consumed automatically after your monthly quota is exhausted.</p>

      <DocPageNav prev={{ href: "/api/docs/rate-limits", label: "Rate limits" }} next={{ href: "/api/docs/errors", label: "Errors" }} />
    </article>
  );
}
