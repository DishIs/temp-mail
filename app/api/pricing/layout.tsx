import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Pricing – Auth flow testing API",
  description: "Pricing plans for the FreeCustom.Email Auth flow testing API. Free tier available, plus Developer, Startup, Growth, and Enterprise plans.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
