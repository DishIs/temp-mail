"use client";

import { usePathname } from "next/navigation";
import { DevHeader } from "@/components/DevHeader";
import { AppFooter } from "@/components/app-footer";

export function ApiLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPlayground = pathname === "/api/playground";
  const isDocs = pathname === "/api/docs";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isPlayground && <DevHeader />}
      <main className="flex-1">{children}</main>
      {!isPlayground && !isDocs && <AppFooter />}
    </div>
  );
}
