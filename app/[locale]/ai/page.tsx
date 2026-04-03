import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AiClient from "./AiClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "ai" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function FceAiPage() {
  return <AiClient />;
}
