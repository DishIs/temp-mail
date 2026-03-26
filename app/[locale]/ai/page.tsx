import { DevHeader } from "@/components/DevHeader";
import { FceAiInterface } from "@/components/FceAiInterface";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FCE AI - Your Intelligent API Assistant | FreeCustom.Email",
  description: "Ask FCE AI about our API, CLI tool, or automation integrations. Generate code, manage inboxes, and get instant support.",
};

export default function FceAiPage() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <DevHeader />
      <main className="flex-1 overflow-hidden">
        <FceAiInterface />
      </main>
    </div>
  );
}
