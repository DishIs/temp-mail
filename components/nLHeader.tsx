// components/app-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Menu as MenuIconLucide,
  Laptop,
  LogOut,
  Settings,
  LayoutDashboard,
  CreditCard,
  User,
  Mail
} from "lucide-react";
import Link from "next/link";
import { FaDiscord, FaGithub } from "react-icons/fa";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { signOut } from "@/lib/auth-client";
import { useSession } from "@/hooks/use-session";

import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SiBuymeacoffee, SiPatreon, SiReddit } from "react-icons/si";
import { SessionToken } from "@/lib/session";

export function AppHeader({ initialSession }: { initialSession: SessionToken | null }) {
  const { data: sessionData, status } = useSession();
  const session = sessionData || initialSession;

  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  }, [theme, setTheme]);

  const toggleMobileMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleMobileLinkClick = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const isLoggedIn = status === 'authenticated' || !!session?.id;
  // @ts-ignore
  const userPlan = session?.user?.plan || 'free';
  const isPro = userPlan === 'pro';

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        onClick={menuOpen ? handleMobileLinkClick : undefined}
        className={`text-sm font-medium transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-muted-foreground'
          }`}
      >
        {children}
      </Link>
    );
  };

  const RenderAuthButton = () => {
    if (status === 'loading') {
      return <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />;
    }

    if (isLoggedIn && session?.id) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 ml-2 hover:bg-transparent">
              <Avatar className={`h-9 w-9 border-2 transition-all ${isPro ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'border-border'}`}>
                <AvatarImage src={session.image || ""} alt={session.name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {session.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              {/* Status Badge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <Badge
                  variant={isPro ? "default" : "secondary"}
                  className={`px-1 py-0 text-[9px] h-4 min-w-max border leading-none ${isPro ? "bg-amber-400 hover:bg-amber-500 text-black border-amber-500" : "bg-muted text-muted-foreground border-border"}`}
                >
                  {isPro ? 'PRO' : 'FREE'}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
            {/* User Info Header */}
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-1.5">
                <p className="text-sm font-semibold leading-none truncate">{session.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{session.email}</p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Profile & Billing</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {!isPro && (
              <div className="p-1 mb-1">
                <Button asChild className="w-full h-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 text-xs" size="sm">
                  <Link href="/pricing">
                    <CreditCard className="mr-2 h-3 w-3" />
                    Upgrade to Pro
                  </Link>
                </Button>
              </div>
            )}

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Button asChild size="sm" className="ml-2 font-semibold">
        <Link href="/auth">
          Login
        </Link>
      </Button>
    );
  };

  return (
    <header className="border-b w-full bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-300">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group" aria-label="Home" onClick={menuOpen ? handleMobileLinkClick : undefined}>
          <div className="relative">
            <Image
              src="/logo.webp"
              alt="FreeCustom.Email Logo"
              width={32}
              height={32}
              className="h-8 w-8 transition-transform group-hover:scale-110"
              priority
            />
          </div>
          <span className="text-base sm:text-lg font-bold whitespace-nowrap hidden xs:block tracking-tight">
            FreeCustom.Email
          </span>
          <span className="text-base font-bold whitespace-nowrap xs:hidden">
            FC.E
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-6">
            <NavLink href="/dashboard">Dashboard</NavLink>
            {!isLoggedIn && <NavLink href="/blog">Blog</NavLink>}
            {(!isLoggedIn || !isPro) && <NavLink href="/pricing">Pricing</NavLink>}
          </nav>

          <div className="flex items-center border-l pl-4 ml-2 gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-muted-foreground hover:text-primary"
              aria-label="Toggle theme"
            >
              {mounted ? (
                <div className="relative h-4 w-4">
                  <Sun className={`absolute h-4 w-4 transition-all ${theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
                  <Moon className={`absolute h-4 w-4 transition-all ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
                  <Laptop className={`absolute h-4 w-4 transition-all ${theme === 'system' ? 'scale-100' : 'scale-0'}`} />
                </div>
              ) : (
                <span className="h-4 w-4" />
              )}
            </Button>
            <RenderAuthButton />
          </div>
        </div>

        {/* MOBILE ACTIONS */}
        <div className="md:hidden flex items-center gap-2">
          <RenderAuthButton />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
            aria-label="Toggle theme"
          >
            {mounted ? (
              <div className="relative h-4 w-4">
                <Sun className={`absolute h-4 w-4 transition-all ${theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
                <Moon className={`absolute h-4 w-4 transition-all ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
                <Laptop className={`absolute h-4 w-4 transition-all ${theme === 'system' ? 'scale-100' : 'scale-0'}`} />
              </div>
            ) : (
              <span className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="h-9 w-9"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <MenuIconLucide className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <nav className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-4 bg-background border-b shadow-lg animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-1 pt-2">
            <Link
              href="/dashboard"
              onClick={handleMobileLinkClick}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm font-medium"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            {!isLoggedIn && (
              <Link
                href="/blog"
                onClick={handleMobileLinkClick}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm font-medium"
              >
                <Mail className="h-4 w-4" /> Blog
              </Link>
            )}
            {(!isLoggedIn || !isPro) && (
              <Link
                href="/pricing"
                onClick={handleMobileLinkClick}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm font-medium"
              >
                <CreditCard className="h-4 w-4" /> Pricing
              </Link>
            )}
          </div>

          <div className="border-t pt-3 flex flex-col gap-3">
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors px-2" onClick={handleMobileLinkClick}>
              API Documentation
            </Link>
            <div className="flex gap-4 px-2">
              <a href="https://github.com/DishIs/temp-mail" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                <FaGithub className="h-5 w-5" />
              </a>
              <a href="https://discord.com/invite/Ztp7kT2QBz" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Discord">
                <FaDiscord className="h-5 w-5" />
              </a>
              <a href="https://www.reddit.com/r/FreeCustomEmail" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Reddit">
                <SiReddit className="h-5 w-5" />
              </a>
              <a href="https://www.buymeacoffee.com/dishantsinghdev" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Reddit">
                <SiBuymeacoffee className="h-5 w-5" />
              </a>
              <a href="https://www.patreon.com/c/maildrop" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Reddit">
                <SiPatreon className="h-5 w-5" />
              </a>
            </div>

          </div>
        </nav>
      )}
    </header>
  );
}