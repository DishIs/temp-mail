// app/api/mcp/page.tsx
import { Metadata } from "next";
import { MCPClient } from "./MCPClient";

export const metadata: Metadata = {
  title: "MCP Access – AI-Native Email Workflows",
  description: "Model Context Protocol integration for the FreeCustom.Email Auth flow testing API. Build AI-native email workflows directly into your agents.",
};

export default function McpPage() {
  return <MCPClient />;
}
