import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DocPageNavProps {
  prev: { href: string; label: string } | null;
  next: { href: string; label: string } | null;
}

export function DocPageNav({ prev, next }: DocPageNavProps) {
  return (
    <nav className="flex items-center justify-between gap-4 mt-12 pt-8 border-t border-border">
      {prev ? (
        <Link
          href={prev.href}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {next.label}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
