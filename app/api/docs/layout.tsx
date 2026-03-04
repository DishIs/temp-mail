import { ReactNode } from "react";
import { DocsSidebar } from "@/components/DocsSidebar";

export default function ApiDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <DocsSidebar />
      <div className="lg:pl-[240px] min-h-screen">
        <div className="mx-auto max-w-[720px] px-4 sm:px-6 py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
