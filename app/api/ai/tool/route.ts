import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// A simple utility to extract text from HTML, preserving some spacing for code blocks
function stripHtml(html: string): string {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Add newlines around common block elements
  text = text.replace(/<\/?(div|p|h[1-6]|ul|ol|li|br|section|article|main|aside|nav|header|footer)[^>]*>/gi, '\n');
  // Preserve pre and code blocks explicitly by adding special markers if needed, 
  // but for now just adding space is fine
  text = text.replace(/<[^>]+>/g, ' ');
  // Collapse multiple spaces to single space
  text = text.replace(/ [ ]+/g, ' ');
  // Collapse multiple newlines
  text = text.replace(/\n\s*\n/g, '\n\n');
  return text.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { tool, params } = await req.json();

    if (tool === "get_api_specs") {
      const openapiUrl = new URL('/openapi.yaml', req.url);
      const res = await fetch(openapiUrl);
      if (!res.ok) {
        return NextResponse.json({
          result: "openapi.yaml not found",
        });
      }

      const content = await res.text();
      
      // The OpenAPI file is ~52KB, well within Gemini's massive context window.
      // Return the entire file so the AI has 100% full context of the structure,
      // schemas, and related endpoints, preventing any parsing errors.
      return NextResponse.json({
        result: content.substring(0, 150000),
      });
    }

    if (tool === "get_app_page_data") {
      try {
        let pagePath = params?.page_path || "";
        if (!pagePath.startsWith("/")) pagePath = "/" + pagePath;
        
        // Some known routes might be dynamic or Next.js app router specific.
        // We fetch the rendered HTML page from our own origin
        const url = new URL(pagePath, req.url);
        const res = await fetch(url);
        
        if (!res.ok) {
          return NextResponse.json({ result: `Page not found or error: ${res.status}` });
        }

        const html = await res.text();
        const content = stripHtml(html);

        return NextResponse.json({
          result: content.substring(0, 50000) + (content.length > 50000 ? "\n... (truncated)" : ""),
        });
      } catch (err) {
        return NextResponse.json({ result: "Error reading file." });
      }
    }

    if (tool === "list_app_pages") {
      // In Cloudflare Workers we can't use fs.readdirSync.
      // Return a static map of highly relevant knowledge pages instead.
      return NextResponse.json({
        result: `
Available Webapp Knowledge Pages (use get_app_page_data with these paths):
- /api/docs/authentication
- /api/docs/changelog
- /api/docs/credits
- /api/docs/custom-domains
- /api/docs/errors
- /api/docs/faq
- /api/docs/inboxes
- /api/docs/messages
- /api/docs/otp
- /api/docs/platform-domains
- /api/docs/quickstart
- /api/docs/rate-limits
- /api/docs/sdk/npm
- /api/docs/sdk/python
- /api/docs/websocket
- /api/cli
- /api/dashboard
- /api/playground
- /api/automation/make
- /api/automation/n8n
- /api/automation/zapier
- /api/automation/openclaw
- /api/pricing (PRIMARY PRICING/PLANS PAGE)
- /openapi.yaml (use get_api_specs)
        `.trim()
      });
    }

    if (tool === "get_sdk_docs") {
      const lang = params?.language?.toLowerCase() || "";
      let targetPath = "";
      
      if (lang === "python" || lang === "npm") {
        targetPath = `/api/docs/sdk/${lang}`;
      } else {
        targetPath = `/api/docs/${lang}`;
      }

      try {
        const url = new URL(targetPath, req.url);
        const res = await fetch(url);
        if (res.ok) {
          const html = await res.text();
          const content = stripHtml(html);
          return NextResponse.json({
            result: content.substring(0, 50000) + (content.length > 50000 ? "\n... (truncated)" : ""),
          });
        }
      } catch(e) {}

      return NextResponse.json({
        result: `SDK Docs not found for: ${lang}. Try using list_app_pages.`,
      });
    }

    if (tool === "get_cli_docs") {
      try {
        const url = new URL("/api/cli", req.url);
        const res = await fetch(url);
        if (res.ok) {
          const html = await res.text();
          const content = stripHtml(html);
          return NextResponse.json({
            result: content.substring(0, 50000) + (content.length > 50000 ? "\n... (truncated)" : ""),
          });
        }
      } catch(e) {}
      
      return NextResponse.json({
        result: `
fce login
fce logout
fce inbox create
fce inbox list
fce message list <inbox>
fce message get <id>
fce otp get <inbox>
        `.trim(),
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