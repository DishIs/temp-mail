import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { DevHeader } from "@/components/DevHeader";
import { AppFooter } from "@/components/app-footer";

export const metadata = {
  title: "API – FreeCustom.Email",
  description: "Disposable email infrastructure for developers. Programmatic temporary inboxes, real-time WebSocket, OTP extraction.",
};

export default function ApiLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        <DevHeader />
        <main className="flex-1">{children}</main>
        <AppFooter />
      </div>
    </ThemeProvider>
  );
}
