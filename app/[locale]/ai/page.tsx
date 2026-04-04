import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AiClient from "./AiClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale: locale as any, namespace: "ai" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AiPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  return <AiClient />;
}
