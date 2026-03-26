import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { tool, params } = await req.json();

    if (tool === "get_api_specs") {
      const openapiPath = path.join(
        process.cwd(),
        "public",
        "openapi.yaml"
      );

      if (!fs.existsSync(openapiPath)) {
        return NextResponse.json({
          result: "openapi.yaml not found",
        });
      }

      const content = fs.readFileSync(openapiPath, "utf8");

      const endpoint = params?.endpoint?.toLowerCase();

      if (!endpoint) {
        return NextResponse.json({
          result: "Please specify an endpoint.",
        });
      }

      const lines = content.split("\n");

      let result = "";
      let found = false;
      let indent = -1;

      for (const line of lines) {
        if (!found && line.toLowerCase().includes(endpoint)) {
          found = true;
          indent = line.search(/\S/);
          result += line + "\n";
          continue;
        }

        if (found) {
          const currentIndent = line.search(/\S/);

          if (currentIndent <= indent && line.trim()) break;

          result += line + "\n";

          if (result.length > 5000) break;
        }
      }

      return NextResponse.json({
        result: result || "Not found",
      });
    }

    if (tool === "get_sdk_docs") {
      const lang = params?.language?.toLowerCase() === "python" ? "python" : "npm";
      const docPath = path.join(
        process.cwd(),
        "app",
        "api",
        "docs",
        "sdk",
        lang,
        "page.tsx"
      );

      if (fs.existsSync(docPath)) {
        let content = fs.readFileSync(docPath, "utf8");
        // Extract basic textual information if needed, or just return the whole page content (up to limits)
        return NextResponse.json({
          result: content.substring(0, 5000) + (content.length > 5000 ? "\n... (truncated)" : ""),
        });
      }

      return NextResponse.json({
        result: "SDK Docs not found for language: " + lang,
      });
    }

    if (tool === "get_cli_docs") {
      const docPath = path.join(process.cwd(), "app", "api", "cli", "page.tsx");
      let content = "";
      if (fs.existsSync(docPath)) {
        content = fs.readFileSync(docPath, "utf8");
        content = content.substring(0, 5000) + (content.length > 5000 ? "\n... (truncated)" : "");
      } else {
        content = `
fce login
fce logout
fce inbox create
fce inbox list
fce message list <inbox>
fce message get <id>
fce otp get <inbox>
        `;
      }
      return NextResponse.json({
        result: content,
      });
    }

    if (tool === "get_email_tool_info") {
      return NextResponse.json({
        result:
          "FreeCustom.Email lets you create unlimited private inboxes on custom domains with real-time updates.",
      });
    }

    if (tool === "handle_contact_request") {
      return NextResponse.json({
        result: "Contact request submitted successfully.",
      });
    }

    if (tool === "trigger_api_action") {
      return NextResponse.json({
        result: "API action executed successfully.",
      });
    }

    return NextResponse.json(
      { error: "Unknown tool" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Tool error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}