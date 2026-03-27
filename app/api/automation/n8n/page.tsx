import { Metadata } from "next";
import N8nClient from "./N8nClient";

export const metadata: Metadata = {
  title: "n8n Automation – FreeCustom.Email",
  description: "Self-host your email automation with FCE and n8n. Use HTTP nodes or the fce CLI to create disposable inboxes and extract OTPs in your workflows.",
};

export default function N8nPage() {
  return <N8nClient />;
}
