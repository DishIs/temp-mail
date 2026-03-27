import { Metadata } from "next";
import MakeClient from "./MakeClient";

export const metadata: Metadata = {
  title: "Make.com (Integromat) Integration – FreeCustom.Email",
  description: "Automate email workflows with FreeCustom.Email's Make.com app. Trigger scenarios on new emails, extract OTPs, and create disposable inboxes without code.",
};

export default function MakePage() {
  return <MakeClient />;
}
