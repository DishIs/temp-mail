import { Metadata } from "next";
import OpenClawClient from "./OpenClawClient";

export const metadata: Metadata = {
  title: "OpenClaw x FCE – AI Agent Email Automation",
  description: "Give your AI agents a temporary email address with FreeCustom.Email and OpenClaw. Automate signups, tests, and OTP extractions through natural language commands.",
};

export default function OpenClawPage() {
  return <OpenClawClient />;
}
