"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, Sun, Moon, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";

const NAV_LINKS = [
  { href: "/api", label: "Overview" },
  { href: "/api/docs", label: "Docs" },
  { href: "/api/pricing", label: "Pricing" },
  { href: "/api/docs/changelog", label: "Changelog" },
  { href: "/api/dashboard", label: "Dashboard" },
];

interface ApiStatusData {
  plan?: { name?: string; label?: string };
  usage?: { credits_remaining?: number; requests_this_month?: number; requests_limit?: number };
}

export function DevHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatusData | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setApiStatus(null);
      return;
    }
    fetch("/api/user/api-status")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const data = d?.data ?? d;
        if (data?.plan || data?.usage) setApiStatus(data);
      })
      .catch(() => {});
  }, [status, session?.user?.id]);

  const toggleTheme = useCallback(() => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }, [theme, setTheme]);

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const planLabel = apiStatus?.plan?.label ?? (apiStatus?.plan as { name?: string })?.name ?? null;
  const credits = apiStatus?.usage?.credits_remaining ?? (apiStatus?.usage as { credits?: number })?.credits ?? 0;

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = pathname === href || (href !== "/api" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        onClick={() => setMenuOpen(false)}
        className={`text-sm font-medium transition-colors hover:text-primary ${
          isActive ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {children}
      </Link>
    );
  };

  return (
    <header className="border-b w-full bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/api" className="flex items-center gap-1.5" aria-label="API Home">
          <Image
            src="/logo.webp"
            alt="FreeCustom.Email"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0"
            priority
          />
          <div className="flex flex-col leading-none">
            <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              FreeCustom.Email
            </span>
            <span className="text-[11px] font-normal text-muted-foreground tracking-tight text-end mt-px">
              for developers
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <NavLink key={href} href={href}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {mounted ? (
              <div className="relative h-4 w-4">
                <Sun className={`absolute h-4 w-4 transition-all ${theme === "light" ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`} />
                <Moon className={`absolute h-4 w-4 transition-all ${theme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0"}`} />
                <Laptop className={`absolute h-4 w-4 transition-all ${theme === "system" ? "scale-100" : "scale-0"}`} />
              </div>
            ) : (
              <span className="h-4 w-4" />
            )}
          </Button>
          {isLoggedIn ? (
            <>
              {(planLabel || credits > 0) ? (
                <div className="flex items-center gap-2 text-xs">
                  {planLabel && (
                    <Badge variant="secondary" className="font-normal capitalize">
                      {planLabel}
                    </Badge>
                  )}
                  {credits > 0 && (
                    <span className="text-muted-foreground tabular-nums">
                      {Number(credits).toLocaleString()} credits
                    </span>
                  )}
                </div>
              ) : (
                <Badge variant="secondary" className="text-xs font-mono">
                  API
                </Badge>
              )}
              <Button asChild size="sm" variant="default">
                <Link href="/api/dashboard">Dashboard</Link>
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

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      </div>

      {menuOpen && (
        <nav className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-2 border-t bg-background">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-md hover:bg-muted text-sm font-medium"
            >
              {label}
            </Link>
          ))}
          <div className="border-t pt-3 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {mounted ? (
                <div className="relative h-4 w-4">
                  <Sun className={`absolute h-4 w-4 transition-all ${theme === "light" ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`} />
                  <Moon className={`absolute h-4 w-4 transition-all ${theme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0"}`} />
                  <Laptop className={`absolute h-4 w-4 transition-all ${theme === "system" ? "scale-100" : "scale-0"}`} />
                </div>
              ) : (
                <span className="h-4 w-4" />
              )}
            </Button>
            {isLoggedIn ? (
              <>
                {(planLabel || credits > 0) && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {planLabel && <span className="capitalize">{planLabel}</span>}
                    {planLabel && credits > 0 && " · "}
                    {credits > 0 && <span className="tabular-nums">{Number(credits).toLocaleString()} credits</span>}
                  </div>
                )}
                <Link
                  href="/api/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-md bg-primary text-primary-foreground text-sm font-medium text-center"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth?callbackUrl=/api" onClick={() => setMenuOpen(false)} className="p-2 rounded-md hover:bg-muted text-sm font-medium">
                  Sign in
                </Link>
                <Link href="/auth?callbackUrl=/api/dashboard" onClick={() => setMenuOpen(false)} className="p-2 rounded-md bg-primary text-primary-foreground text-sm font-medium text-center">
                  Get API key
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
