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
        // Return full spec but truncate to a safe limit if huge, though openapi is usually okay for Gemini.
        return NextResponse.json({
          result: content.substring(0, 100000), // Return a large chunk or all of it.
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

          if (result.length > 50000) break;
        }
      }

      return NextResponse.json({
        result: result || "Not found",
      });
    }

    if (tool === "get_app_page_data") {
      try {
        const pagePath = params?.page_path;
        if (!pagePath) {
          return NextResponse.json({ result: "Please specify a page_path." });
        }
        
        // Ensure the path is within the project to prevent directory traversal
        const resolvedPath = path.resolve(process.cwd(), pagePath);
        if (!resolvedPath.startsWith(process.cwd())) {
           return NextResponse.json({ result: "Invalid path." });
        }

        if (fs.existsSync(resolvedPath)) {
          const content = fs.readFileSync(resolvedPath, "utf8");
          // Return up to 50,000 chars to avoid overwhelming the context but enough to provide guaranteed data
          return NextResponse.json({
            result: content.substring(0, 50000) + (content.length > 50000 ? "\n... (truncated)" : ""),
          });
        }
        return NextResponse.json({ result: `File not found: ${pagePath}` });
      } catch (err) {
        return NextResponse.json({ result: "Error reading file." });
      }
    }

    if (tool === "list_app_pages") {
      try {
        let directory = params?.directory || "";
        
        // Strip leading slash
        if (directory.startsWith("/")) directory = directory.substring(1);
        
        const resolvedDir = path.resolve(process.cwd(), directory);
        if (!resolvedDir.startsWith(process.cwd())) {
          return NextResponse.json({ result: "Invalid directory. Stay within the project." });
        }

        if (!fs.existsSync(resolvedDir)) {
           // Fallback to giving them the root directory's top level folders
           const rootFiles = fs.readdirSync(process.cwd());
           const folders = rootFiles.filter(f => fs.statSync(path.join(process.cwd(), f)).isDirectory());
           return NextResponse.json({ 
             result: `Directory '${directory}' not found. Valid root folders are: ${folders.join(', ')}. Hint: look in 'app/[locale]' or 'app/api'` 
           });
        }

        const files = fs.readdirSync(resolvedDir, { recursive: true }) as string[];
        const resultFiles = files
          .filter(f => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.md'))
          .map(f => path.posix.join(directory, f))
          .join('\n');

        return NextResponse.json({
          result: resultFiles ? resultFiles : "No .tsx or .md pages found in this directory.",
        });
      } catch (err) {
        return NextResponse.json({ result: "Error listing pages: " + (err as Error).message });
      }
    }

    if (tool === "get_sdk_docs") {
      const lang = params?.language?.toLowerCase() || "";
      let targetPath = "";
      
      if (lang === "python" || lang === "npm") {
        targetPath = path.join(process.cwd(), "app", "api", "docs", "sdk", lang, "page.tsx");
      } else {
        // Try to find the doc page by matching the name
        targetPath = path.join(process.cwd(), "app", "api", "docs", lang, "page.tsx");
      }

      if (fs.existsSync(targetPath)) {
        let content = fs.readFileSync(targetPath, "utf8");
        return NextResponse.json({
          result: content.substring(0, 50000) + (content.length > 50000 ? "\n... (truncated)" : ""),
        });
      }

      return NextResponse.json({
        result: `SDK Docs not found for: ${lang}. Try using list_app_pages with 'app/api/docs'.`,
      });
    }

    if (tool === "get_cli_docs") {
      const docPath = path.join(process.cwd(), "app", "api", "cli", "page.tsx");
      let content = "";
      if (fs.existsSync(docPath)) {
        content = fs.readFileSync(docPath, "utf8");
        content = content.substring(0, 50000) + (content.length > 50000 ? "\n... (truncated)" : "");
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