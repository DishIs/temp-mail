import { Metadata } from "next";
import ZapierClient from "./ZapierClient";

export const metadata: Metadata = {
  title: "Zapier Integration – FreeCustom.Email",
  description: "Connect FreeCustom.Email to 5,000+ apps via Zapier. Trigger automated workflows when emails arrive, and sync OTP codes to Slack, Google Sheets, or any other app.",
};

export default function ZapierPage() {
  return <ZapierClient />;
}
