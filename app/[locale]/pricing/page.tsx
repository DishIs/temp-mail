import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PricingClient from "./PricingClient";

export async function generateMetadata({ params: { locale } }: { params: { locale: any } }) {
  const t = await getTranslations("Pricing");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function PricingPage() {
  return <PricingClient />;
}
