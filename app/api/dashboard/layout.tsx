import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Dashboard – Auth flow testing API",
  description: "Manage your API keys, view usage statistics, and configure custom domains for the FreeCustom.Email API.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
