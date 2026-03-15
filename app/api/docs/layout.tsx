import { ReactNode } from "react";
import { DocsSidebar } from "@/components/DocsSidebar";

export default function ApiDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-start">
      <DocsSidebar />
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-[720px] px-4 sm:px-6 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}