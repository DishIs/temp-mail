import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ProfileClient from "./ProfileClient";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("Profile");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default function ProfilePage() {
  return <ProfileClient />;
}
