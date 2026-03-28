import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AiClient from "./AiClient";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("ai");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function FceAiPage() {
  return <AiClient />;
}
