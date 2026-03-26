import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs"; // Needed for fs access

export async function POST(req: NextRequest) {
  try {
    const { tool, params } = await req.json();

    if (tool === "get_api_specs") {
      const openapiPath = path.join(process.cwd(), "public", "openapi.yaml");
      const content = fs.readFileSync(openapiPath, "utf8");
      
      // Basic extraction logic to keep context short
      const endpoint = params.endpoint?.toLowerCase();
      if (!endpoint) return NextResponse.json({ result: "Please specify an endpoint or keyword." });

      const lines = content.split("\n");
      let found = false;
      let result = "";
      let indent = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes(endpoint) && !found) {
          found = true;
          indent = line.search(/\S/);
          result += line + "\n";
          continue;
        }

        if (found) {
          const currentIndent = line.search(/\S/);
          if (currentIndent <= indent && line.trim() !== "") {
            break; 
          }
          result += line + "\n";
          if (result.length > 5000) break; // Hard limit
        }
      }

      return NextResponse.json({ result: result || "Endpoint details not found in spec." });
    }

    if (tool === "get_cli_docs") {
      // In a real app, we might fetch the /api/cli page content or have a dedicated markdown file
      // For now, we return the core command list
      return NextResponse.json({ 
        result: `
        fce login - Authenticate via browser
        fce logout - Remove stored credentials
        fce inbox create - Create a new inbox
        fce inbox list - List active inboxes
        fce message list <inbox> - List messages in an inbox
        fce message get <id> - Get full message content
        fce otp get <inbox> - Get latest OTP from an inbox
        `
      });
    }

    if (tool === "get_email_tool_info") {
      return NextResponse.json({
        result: "FreeCustom.Email allows users to create unlimited private inboxes using their own domains. It features a modern web dashboard, real-time notifications, and is completely free for custom domain users."
      });
    }

    return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
  } catch (error) {
    console.error("Tool Handler Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
