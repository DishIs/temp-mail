// components/DevHeader.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, Sun, Moon, Laptop, MoreVertical, X, LogOut, LayoutDashboard, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { SearchModal } from "@/components/search-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_LINKS = [
  { href: "/api",                label: "Overview"   },
  { href: "/ai",                 label: "FCE AI"     },
  { href: "/api/docs",           label: "Docs"       },
  { href: "/api/cli",            label: "CLI"        },
  { href: "/api/use-cases",      label: "Use Cases"  },
  { href: "/api/mcp",            label: "MCP"        },
  { href: "/api/automation",     label: "Automation" },
  { href: "/api/playground",     label: "Playground" },
  { href: "/api/pricing",        label: "Pricing"    },
  { href: "/api/docs/changelog", label: "Changelog"  },
  { href: "/api/dashboard", label: "Dashboard"  },
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
  const [apiStatus, setApiStatus] = useState<ApiStatusData | null | undefined>(undefined);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !session?.user?.id) {
      setApiStatus(null);
      return;
    }
    fetch("/api/user/api-status")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const data = d?.data ?? d;
        setApiStatus(data || null);
      })
      .catch(() => setApiStatus(null));
  }, [status, session?.user?.id]);

  const isSessionLoading = !mounted || status === "loading";
  const isApiStatusLoading = status === "authenticated" && apiStatus === undefined;

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const planLabel  = apiStatus?.plan?.label ?? (apiStatus?.plan as { name?: string })?.name ?? null;
  const credits    = apiStatus?.usage?.credits_remaining ?? (apiStatus?.usage as { credits?: number })?.credits ?? 0;
  const isFreeUser = (!planLabel || String(planLabel).toLowerCase() === "free") && credits <= 0;
  
  const getPlanBadgeName = () => {
    if (!planLabel) return "FREE";
    const label = String(planLabel).toLowerCase();
    if (label === "developer") return "DEV";
    if (label === "startup") return "STARTUP";
    if (label === "growth") return "GROWTH";
    if (label === "enterprise") return "ENT";
    return "FREE";
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/api" && pathname.startsWith(href));

  // Show first 4 links in nav, rest in overflow (md) or all on lg
  const PRIMARY_COUNT = 4;

  const AuthSection = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent | TouchEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setDropdownOpen(false);
        }
      }
      if (dropdownOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, [dropdownOpen]);

    if (status === "loading")
      return <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />;

    if (isLoggedIn && session?.user) {
      return (
        <div className="relative shrink-0" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative outline-none shrink-0 block" 
            aria-label="User profile menu"
            aria-expanded={dropdownOpen}
          >
            <Avatar
              className={`h-8 w-8 border transition-all ${
                !isFreeUser
                  ? "border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.35)]"
                  : "border-border"
              }`}
            >
              <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
              <AvatarFallback className="text-xs font-bold bg-muted">
                {session.user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-semibold px-1 rounded-sm leading-none py-px border ${
                !isFreeUser ? "bg-amber-400 text-black border-amber-500" : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {getPlanBadgeName()}
            </span>
          </button>

          <div 
            className={`absolute right-0 top-full mt-3 w-56 origin-top-right rounded-lg border border-border bg-background p-1.5 shadow-xl transition-all duration-200 z-50 ${
              dropdownOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible pointer-events-none"
            }`}
          >
            <div className="px-2 py-2">
              <p className="text-sm font-semibold text-foreground truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{session.user.email}</p>
            </div>
            
            <div className="h-px bg-border w-full my-1" />
            
            <Link 
              href="/api/dashboard" 
              onClick={() => setDropdownOpen(false)}
              className="flex items-center px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              API Dashboard
            </Link>
            
            <Link 
              href="/dashboard/profile" 
              onClick={() => setDropdownOpen(false)}
              className="flex items-center px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <User className="mr-2 h-4 w-4" />
              Profile & Billing
            </Link>
            
            <div className="h-px bg-border w-full my-1" />
            
            {isFreeUser && (
              <div className="mb-1">
                <Button asChild size="sm" className="w-full h-8 text-xs bg-foreground text-background hover:bg-foreground/90">
                  <Link href="/api/pricing" onClick={() => setDropdownOpen(false)}>
                    <CreditCard className="mr-1.5 h-3 w-3" />
                    Upgrade API Plan
                  </Link>
                </Button>
              </div>
            )}
            
            <button
              onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/api" }); }}
              className="w-full flex items-center px-2 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors outline-none"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      );
    }

    return (
      <Button asChild size="sm" variant="ghost" className="shrink-0 px-3">
        <Link href="/auth?callbackUrl=/api">Sign in</Link>
      </Button>
    );
  };

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
          <Link href="/api" className="flex items-center gap-2 shrink-0" aria-label="API Home">
            <Image src="/logo.webp" alt="FreeCustom.Email" width={28} height={28} className="h-7 w-7" priority />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight text-foreground">FreeCustom.Email</span>
              <span className="text-[10px] font-normal text-muted-foreground tracking-widest uppercase -mt-0.5">for developers</span>
            </div>
          </Link>

          {/* Desktop & Medium Responsive Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label }, index) => (
              <Link key={href} href={href}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  index >= PRIMARY_COUNT ? "hidden lg:flex" : "flex"
                } ${
                  isActive(href) ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Overflow dropdown for md */}
            <div className="flex lg:hidden items-center ml-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[10rem]">
                  {NAV_LINKS.slice(PRIMARY_COUNT).map(({ href, label }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className={isActive(href) ? "font-medium" : ""}>{label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>

          {/* Right */}
          <div className="hidden md:flex items-center gap-2">
            <SearchModal />
            <button ref={btnRef} onClick={toggle}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              <ThemeIcon theme={theme} mounted={mounted} />
            </button>

            <div className="flex items-center justify-end min-w-[76px] shrink-0 gap-2">
              <AuthSection />
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <SearchModal triggerClass="h-8 w-8 !px-0 flex justify-center" />
            <div className="flex items-center justify-center min-w-[76px] shrink-0">
              <AuthSection />
            </div>
            <button
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
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
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Toggle theme"
              >
                <ThemeIcon theme={theme} mounted={mounted} />
              </button>

              <div className="ml-auto flex items-center justify-end min-w-[76px] shrink-0 gap-2">
                <AuthSection />
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}