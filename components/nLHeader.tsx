// components/app-header.tsx (Second Variant)
"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, Menu as MenuIconLucide, Laptop } from "lucide-react";
import Link from "next/link";
import { FaDiscord, FaGithub } from "react-icons/fa";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { Session } from "next-auth";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader({ initialSession }: { initialSession: Session | null }) {
  const { data: _, status } = useSession();
  const session = initialSession; 
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  }, [theme, setTheme]);

  const toggleMobileMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleMobileLinkClick = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const isLoggedIn = status === 'authenticated' && !!session?.user;
  // @ts-ignore
  const userPlan = session?.user?.plan || 'free';
  const isPro = userPlan === 'pro';

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        onClick={menuOpen ? handleMobileLinkClick : undefined}
        className={`text-sm font-medium transition-colors hover:text-primary ${
          isActive ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {children}
      </Link>
    );
  };

  const NavLinksGroup = () => (
    <>
      <NavLink href="/dashboard">Dashboard</NavLink>
      {!isLoggedIn && <NavLink href="/blog">Blog</NavLink>}
      {(!isLoggedIn || !isPro) && <NavLink href="/pricing">Pricing</NavLink>}
    </>
  );

  const RenderAuthButton = () => {
    if (status === 'loading') {
      return <div className="h-9 w-9 bg-muted rounded-full animate-pulse"></div>;
    }

    if (isLoggedIn && session?.user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-2">
              <div className={`relative h-full w-full rounded-full border-2 ${isPro ? 'border-yellow-400' : 'border-slate-300'}`}>
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User avatar'}
                    className="rounded-full object-cover h-full w-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-muted rounded-full text-muted-foreground text-xs">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1.5 w-full flex justify-center">
                <div className={`rounded-sm px-[3px] py-[0.5px] text-[8px] leading-none font-bold border ${isPro ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-secondary text-secondary-foreground border-border'}`}>
                  {isPro ? 'PRO' : 'FREE'}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session.user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/dashboard">Dashboard</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            {!isPro && (
              <div className="p-1">
                <Button asChild className="w-full h-8" size="sm">
                  <Link href="/pricing">Upgrade to Pro</Link>
                </Button>
              </div>
            )}
            <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
        <Button asChild size="sm" className="ml-2">
            <Link href="/auth">Login</Link>
        </Button>
    );
  };

  return (
    <header className="border-b w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Home" onClick={menuOpen ? handleMobileLinkClick : undefined}>
            <Image
              src="/logo.webp"
              alt="FreeCustom.Email Logo"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
          <span className="text-base sm:text-lg font-bold whitespace-nowrap hidden xs:block">
            FreeCustom.Email
          </span>
           <span className="text-base font-bold whitespace-nowrap xs:hidden">
            FC.E
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-6">
             <NavLinksGroup />
          </nav>
          
          <div className="flex items-center border-l pl-4 ml-2 gap-2">
             <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
                aria-label="Toggle theme"
              >
                {mounted ? (
                  <>
                    <Sun className={`h-4 w-4 transition-all ${theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
                    <Moon className={`absolute h-4 w-4 transition-all ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
                    <Laptop className={`absolute h-4 w-4 transition-all ${theme === 'system' ? 'scale-100' : 'scale-0'}`} />
                  </>
                ) : (
                    <span className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <RenderAuthButton />
          </div>
        </div>

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
              <>
                <Sun className={`h-4 w-4 transition-all ${theme === 'light' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
                <Moon className={`absolute h-4 w-4 transition-all ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
                <Laptop className={`absolute h-4 w-4 transition-all ${theme === 'system' ? 'scale-100' : 'scale-0'}`} />
              </>
            ) : (
                 <span className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
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

      {menuOpen && (
        <nav className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-4 bg-background border-b shadow-sm">
          <div className="flex flex-col gap-3 pt-2">
            <NavLinksGroup />
          </div>
          
          <div className="border-t pt-3 flex flex-col gap-2">
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors py-1" onClick={handleMobileLinkClick}>
                API Documentation
            </Link>
            <div className="flex gap-4 pt-1">
                <a href="https://github.com/DishIs/temp-mail" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
                    <FaGithub className="h-5 w-5" />
                </a>
                <a href="https://discord.gg/EDmxUbym" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Discord">
                    <FaDiscord className="h-5 w-5" />
                </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}