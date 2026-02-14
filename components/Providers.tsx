"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

// No more session prop needed — SessionProvider fetches it automatically
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster position="top-center" reverseOrder={false} />
      {children}
    </SessionProvider>
  );
}