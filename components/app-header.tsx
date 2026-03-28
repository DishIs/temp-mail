// components/app-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  Moon, Sun, Laptop, Menu as MenuIcon, X,
  LogOut, LayoutDashboard, CreditCard, User,
} from "lucide-react";
import Link from "next/link";
import { FaDiscord, FaGithub } from "react-icons/fa";
import { SiReddit, SiBuymeacoffee, SiPatreon } from "react-icons/si";
import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { Session } from "next-auth";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LocaleSwitcher from "./LocaleSwitcher";

function useThemeRipple() {
  const { theme, setTheme } = useTheme();

  const toggle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const next =
        theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

      if (!document.startViewTransition) {
        setTheme(next);
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const maxR = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      document.startViewTransition(() => {
        setTheme(next);
      }).ready.then(() => {
        document.documentElement.animate(
          {
            clipPath:[
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxR}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 420,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
    },
    [theme, setTheme],
  );

  return { theme, toggle };
}

function ThemeIcon({ theme, mounted }: { theme: string | undefined; mounted: boolean; }) {
  if (!mounted) return <span className="h-4 w-4" />;
  return (
    <span className="relative h-4 w-4 block">
      <Sun className={`absolute h-4 w-4 transition-all duration-200 ${theme === "light" ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
      <Moon className={`absolute h-4 w-4 transition-all duration-200 ${theme === "dark" ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
      <Laptop className={`absolute h-4 w-4 transition-all duration-200 ${theme === "system" ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} />
    </span>
  );
}

const NAV_LINKS =[
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/api", label: "API", mono: true },
  { href: "/ai", label: "FCE AI", mono: true },
];

export function AppHeader() {
  const { data: session, status } = useSession();
  const { theme, toggle } = useThemeRipple();
  const[menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); },[]);

  const isLoggedIn = status === "authenticated" || !!session?.user;
  // @ts-ignore
  const isPro = (session?.user?.plan ?? "free") === "pro";

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

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
                isPro
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
                isPro ? "bg-amber-400 text-black border-amber-500" : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {isPro ? "PRO" : "FREE"}
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
              href="/dashboard" 
              onClick={() => setDropdownOpen(false)}
              className="flex items-center px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
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
            
            {!isPro && (
              <div className="mb-1">
                <Button asChild size="sm" className="w-full h-8 text-xs bg-foreground text-background hover:bg-foreground/90">
                  <Link href="/pricing" onClick={() => setDropdownOpen(false)}>
                    <CreditCard className="mr-1.5 h-3 w-3" />
                    Upgrade to Pro
                  </Link>
                </Button>
              </div>
            )}
            
            <button
              onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
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
      <Button asChild size="sm" variant="ghost" className="shrink-0">
        <Link href="/auth">Sign in</Link>
      </Button>
    );
  };

  return (
    <>
      <style>{`
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation: none;
          mix-blend-mode: normal;
        }
        ::view-transition-new(root) {
          z-index: 9999;
        }
      `}</style>

      <header className="border-b border-border w-full bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[90rem]">

          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Home">
            <Image src="/logo.webp" alt="FreeCustom.Email" width={28} height={28} className="h-7 w-7" priority />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight text-foreground">FreeCustom.Email</span>
              <span className="text-[10px] font-normal text-muted-foreground tracking-widest uppercase -mt-0.5">temp mail</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label, mono }) => {
              const show = href === "/blog" || href === "/pricing" ? !isPro || !isLoggedIn : true;
              if (!show) return null;
              return (
                <Link
                  key={href} href={href}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive(href) ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mono ? <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted border border-border/80">{label}</span> : label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <LocaleSwitcher />
            <button
              onClick={toggle}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Toggle theme"
            >
              <ThemeIcon theme={theme} mounted={mounted} />
            </button>
            {/* Stable Width Wrapper prevents Layout Shift */}
            <div className="flex items-center justify-end min-w-[76px] shrink-0">
              <AuthSection />
            </div>
          </div>

          <div className="md:hidden flex items-center gap-1.5">
            <button
              onClick={toggle}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Toggle theme"
            >
              <ThemeIcon theme={theme} mounted={mounted} />
            </button>
            {/* Stable Width Wrapper prevents Layout Shift */}
            <div className="flex items-center justify-center min-w-[76px] shrink-0">
              <AuthSection />
            </div>
            <button
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 pb-5 pt-3">
            <nav className="flex flex-col gap-0.5 mb-4">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href} href={href} onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive(href) ? "text-foreground font-medium bg-muted/30" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-border pt-4 flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-3">
                {[
                  { href: "https://github.com/DishIs/temp-mail", icon: FaGithub, label: "GitHub" },
                  { href: "https://discord.com/invite/Ztp7kT2QBz", icon: FaDiscord, label: "Discord" },
                  { href: "https://www.reddit.com/r/FreeCustomEmail", icon: SiReddit, label: "Reddit" },
                  { href: "https://www.buymeacoffee.com/dishantsinghdev", icon: SiBuymeacoffee, label: "BuyMeACoffee" },
                  { href: "https://www.patreon.com/c/maildrop", icon: SiPatreon, label: "Patreon" },
                ].map(({ href, icon: Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
              <div className="ml-auto"><LocaleSwitcher /></div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}