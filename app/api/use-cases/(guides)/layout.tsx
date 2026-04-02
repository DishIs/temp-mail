import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
};

export default function UseCasesGuidesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-screen" style={DOT_BG}>
      <div className="fixed inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" />
      <div className="fixed inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        {children}
      </div>
    </div>
  );
}