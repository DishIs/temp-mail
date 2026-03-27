import { Metadata } from "next";
import CLIClient from "./CLIClient";

export const metadata: Metadata = {
  title: "fce CLI – The Modern Temp Mail Tool",
  description: "Install and use the FreeCustom.Email CLI on macOS, Windows, and Linux. Register inboxes, watch for messages, and extract OTPs directly from your terminal.",
};

export default function CLIPage() {
  return <CLIClient />;
}
