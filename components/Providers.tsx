"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { DeletionRedirect } from "@/components/DeletionRedirect";
import { ToastProvider } from "@/components/ui/toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <DeletionRedirect>{children}</DeletionRedirect>
      </ToastProvider>
    </SessionProvider>
  );
}