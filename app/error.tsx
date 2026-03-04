"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-background">
      <h1 className="text-3xl font-bold mb-4 text-foreground">Something went wrong</h1>
      <p className="mb-6 text-muted-foreground max-w-lg">
        We’re sorry, but an unexpected error occurred while loading this page.
        If you keep seeing this message, please contact our support team so we
        can help resolve the issue.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="px-5 py-2 rounded-md border border-border bg-foreground text-background hover:opacity-90 transition-opacity text-sm font-medium"
        >
          Try Again
        </button>

        <Link
          href="/contact"
          className="px-5 py-2 rounded-md border border-border bg-muted text-foreground hover:bg-muted/80 transition-colors text-sm font-medium inline-block"
        >
          Contact Us
        </Link>
      </div>

      {error?.digest && (
        <p className="mt-6 text-sm text-muted-foreground">
          Error Code: <code className="rounded bg-muted px-1 py-0.5 text-foreground">{error.digest}</code>
        </p>
      )}
    </div>
  );
}
