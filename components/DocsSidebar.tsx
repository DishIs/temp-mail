"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  { label: "Getting Started", links: [{ href: "/api/docs/quickstart", label: "Quickstart" }] },
  { label: "Core Concepts", links: [{ href: "/api/docs/authentication", label: "Authentication" }] },
  {
    label: "Endpoints",
    links: [
      { href: "/api/docs/inboxes", label: "Inbox management" },
      { href: "/api/docs/messages", label: "Reading messages" },
      { href: "/api/docs/otp", label: "OTP extraction" },
    ],
  },
  { label: "Real-time", links: [{ href: "/api/docs/websocket", label: "WebSocket" }] },
  {
    label: "Billing",
    links: [
      { href: "/api/docs/rate-limits", label: "Rate limits" },
      { href: "/api/docs/credits", label: "Credits" },
    ],
  },
  {
    label: "Reference",
    links: [
      { href: "/api/docs/errors", label: "Errors" },
      { href: "/api/docs/changelog", label: "Changelog" },
      { href: "/api/docs/faq", label: "FAQ" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <nav className="flex flex-col gap-6 py-4">
      {SIDEBAR_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-3">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.links.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block py-1.5 px-3 text-sm border-l-2 -ml-px transition-colors",
                      isActive
                        ? "border-primary text-primary font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
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

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-20 left-4 z-40 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" /> Menu
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-50 w-[240px] border-r border-border bg-background overflow-y-auto transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="sticky top-0 p-3">
          <NavContent />
        </div>
      </aside>

      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-[240px] border-r border-border bg-background overflow-y-auto">
        <div className="p-3">
          <NavContent />
        </div>
      </aside>
    </>
  );
}
