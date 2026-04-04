import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PricingClient from "./PricingClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale: locale as any, namespace: "Pricing" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function PricingPage() {
  return <PricingClient />;
}
