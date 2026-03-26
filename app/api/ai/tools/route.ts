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

    if (tool === "get_cli_docs") {
      return NextResponse.json({
        result: `
fce login
fce logout
fce inbox create
fce inbox list
fce message list <inbox>
fce message get <id>
fce otp get <inbox>
        `,
      });
    }

    if (tool === "get_email_tool_info") {
      return NextResponse.json({
        result:
          "FreeCustom.Email lets you create unlimited private inboxes on custom domains with real-time updates.",
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