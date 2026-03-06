// ─────────────────────────────────────────────────────────────────────────────
// components/docs-sidebar.tsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  { label: "Getting Started", links: [{ href: "/api/docs/quickstart",      label: "Quickstart"        }] },
  { label: "Core Concepts",   links: [{ href: "/api/docs/authentication",  label: "Authentication"    }] },
  { label: "Endpoints", links: [
    { href: "/api/docs/inboxes",   label: "Inbox management" },
    { href: "/api/docs/messages",  label: "Reading messages" },
    { href: "/api/docs/otp",       label: "OTP extraction"   },
  ]},
  { label: "Real-time", links: [{ href: "/api/docs/websocket", label: "WebSocket" }] },
  { label: "Billing", links: [
    { href: "/api/docs/rate-limits", label: "Rate limits" },
    { href: "/api/docs/credits",     label: "Credits"     },
  ]},
  { label: "Reference", links: [
    { href: "/api/docs/errors",     label: "Errors"     },
    { href: "/api/docs/changelog",  label: "Changelog"  },
    { href: "/api/docs/faq",        label: "FAQ"        },
  ]},
];

function NavContent({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-5 py-5 px-4">
      {SIDEBAR_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-1">
            {group.label}
          </p>
          <ul className="space-y-0">
            {group.links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link href={href} onClick={onNav}
                    className={cn(
                      "block py-1.5 px-3 text-sm border-l-2 -ml-px transition-colors",
                      active
                        ? "border-foreground text-foreground font-medium"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground",
                    )}>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button type="button"
        className="lg:hidden fixed top-[4.5rem] left-4 z-40 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(true)} aria-label="Open docs menu"
      >
        <Menu className="h-3.5 w-3.5" /> Menu
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)} aria-hidden />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        "lg:hidden fixed left-0 top-0 bottom-0 z-[60] w-[240px]",
        "border-r border-border bg-background overflow-y-auto transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border sticky top-0 bg-background z-10">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Docs</span>
          <button onClick={() => setOpen(false)}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <NavContent onNav={() => setOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-[240px] border-r border-border bg-background overflow-y-auto">
        <NavContent />
      </aside>
    </>
  );
}
