import { Metadata } from "next";
import AutomationClient from "./AutomationClient";

export const metadata: Metadata = {
  title: "Automation & AI Agents – FreeCustom.Email",
  description: "Connect disposable email inboxes to AI agents (OpenClaw, Claude) and automation platforms (n8n, Make, Zapier). Build powerful agentic email workflows.",
};

export default function AutomationPage() {
  return <AutomationClient />;
}
