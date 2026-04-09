import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Use Cases – Auth flow testing API",
  description: "Explore how developers use the FreeCustom.Email API for QA automation, CI/CD, multi-account testing, and AI agents.",
};

export default function UseCasesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
