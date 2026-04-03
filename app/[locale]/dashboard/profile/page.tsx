import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ProfileClient from "./ProfileClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Profile" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default function ProfilePage() {
  return <ProfileClient />;
}
