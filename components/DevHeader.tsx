// components/DevHeader.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, Sun, Moon, Laptop, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";

const NAV_LINKS = [
  { href: "/api",                label: "Overview"  },
  { href: "/api/docs",           label: "Docs"      },
  { href: "/api/playground",     label: "Playground"},
  { href: "/api/pricing",        label: "Pricing"   },
  { href: "/api/docs/changelog", label: "Changelog" },
  { href: "/api/dashboard",      label: "Dashboard" },
];

interface ApiStatusData {
  plan?: { name?: string; label?: string };
  usage?: { credits_remaining?: number; requests_this_month?: number; requests_limit?: number };
}

// ── shared theme-ripple hook ───────────────────────────────────────────────
function useThemeRipple() {
  const { theme, setTheme } = useTheme();
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = useCallback(() => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

    if (!btnRef.current || !document.startViewTransition) {
      setTheme(next);
      return;
    }

    const btn = btnRef.current;
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top  + rect.height / 2;
    const maxR = Math.hypot(
      Math.max(x, window.innerWidth  - x),
      Math.max(y, window.innerHeight - y)
    );

    document.startViewTransition(() => {
      setTheme(next);
    }).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxR}px at ${x}px ${y}px)`] },
        { duration: 420, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
      );
    });
  }, [theme, setTheme]);

  return { theme, toggle, btnRef };
}

function ThemeIcon({ theme, mounted }: { theme: string | undefined; mounted: boolean }) {
  if (!mounted) return <span className="h-4 w-4" />;
  return (
    <span className="relative h-4 w-4 block">
      <Sun    className={`absolute h-4 w-4 transition-all duration-200 ${theme === "light"  ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
      <Moon   className={`absolute h-4 w-4 transition-all duration-200 ${theme === "dark"   ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
      <Laptop className={`absolute h-4 w-4 transition-all duration-200 ${theme === "system" ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
    </span>
  );
}

export function DevHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, toggle, btnRef } = useThemeRipple();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatusData | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) { setApiStatus(null); return; }
    fetch("/api/user/api-status")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const data = d?.data ?? d;
        if (data?.plan || data?.usage) setApiStatus(data);
      })
      .catch(() => {});
  }, [status, session?.user?.id]);

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const planLabel  = apiStatus?.plan?.label ?? (apiStatus?.plan as { name?: string })?.name ?? null;
  const credits    = apiStatus?.usage?.credits_remaining ?? (apiStatus?.usage as { credits?: number })?.credits ?? 0;
  const isFreeUser = (!planLabel || String(planLabel).toLowerCase() === "free") && credits <= 0;

  const isActive = (href: string) =>
    pathname === href || (href !== "/api" && pathname.startsWith(href));

  return (
    <>
      <style>{`
        ::view-transition-old(root),
        ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
        ::view-transition-new(root) { z-index: 9999; }
      `}</style>

      <header className="border-b border-border w-full bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[90rem]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="API Home">
            <Image src="/logo.webp" alt="FreeCustom.Email" width={28} height={28} className="h-7 w-7" priority />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight text-foreground">FreeCustom.Email</span>
              <span className="text-[10px] font-normal text-muted-foreground tracking-widest uppercase -mt-0.5">for developers</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  isActive(href) ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mid: collapsed dropdown */}
          <div className="hidden md:flex lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  Nav <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                {NAV_LINKS.map(({ href, label }) => (
                  <DropdownMenuItem key={href} asChild>
                    <Link href={href} className={isActive(href) ? "font-medium" : ""}>{label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-2">
            <button ref={btnRef} onClick={toggle}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              <ThemeIcon theme={theme} mounted={mounted} />
            </button>

            {isLoggedIn ? (
              <>
                {(planLabel || credits > 0) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {planLabel && (
                      <span className="capitalize border border-border rounded-full px-2 py-0.5 font-medium text-foreground">
                        {planLabel}
                      </span>
                    )}
                    {credits > 0 && (
                      <span className="tabular-nums font-mono">{Number(credits).toLocaleString()} credits</span>
                    )}
                  </div>
                )}
                <Button asChild size="sm">
                  <Link href={isFreeUser ? "/api/pricing" : "/api/dashboard"}>
                    {isFreeUser ? "Upgrade" : "Dashboard"}
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/auth?callbackUrl=/api">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth?callbackUrl=/api/dashboard">Get API key</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 pb-5 pt-3">
            <nav className="flex flex-col gap-0.5 mb-4">
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive(href)
                      ? "text-foreground font-medium bg-muted/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-border pt-4 flex items-center gap-3 flex-wrap">
              <button ref={btnRef} onClick={toggle}
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
              >
                <ThemeIcon theme={theme} mounted={mounted} />
              </button>
              {isLoggedIn ? (
                <>
                  {(planLabel || credits > 0) && (
                    <span className="text-xs text-muted-foreground">
                      {planLabel && <span className="capitalize">{planLabel}</span>}
                      {planLabel && credits > 0 && " · "}
                      {credits > 0 && <span className="tabular-nums font-mono">{Number(credits).toLocaleString()} credits</span>}
                    </span>
                  )}
                  <Button asChild size="sm" className="ml-auto">
                    <Link href={isFreeUser ? "/api/pricing" : "/api/dashboard"} onClick={() => setMenuOpen(false)}>
                      {isFreeUser ? "Upgrade" : "Dashboard"}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/auth?callbackUrl=/api" onClick={() => setMenuOpen(false)}>Sign in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth?callbackUrl=/api/dashboard" onClick={() => setMenuOpen(false)}>Get API key</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}