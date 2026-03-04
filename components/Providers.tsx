"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { DeletionRedirect } from "@/components/DeletionRedirect";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <DeletionRedirect>{children}</DeletionRedirect>
    </SessionProvider>
  );
}