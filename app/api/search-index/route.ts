import { NextResponse } from 'next/server';
import { blogClient } from '@/lib/blog-client';

const API_PAGES = [
  { title: "API Overview", url: "/api", description: "Disposable email infrastructure for developers.", type: "api" },
  { title: "FCE AI", url: "/ai", description: "Chat with FreeCustom.Email AI assistant.", type: "api" },
  { title: "Documentation Home", url: "/api/docs", description: "API documentation home.", type: "api" },
  { title: "Quickstart", url: "/api/docs/quickstart", description: "Get started with the API in minutes.", type: "api" },
  { title: "Authentication", url: "/api/docs/authentication", description: "Learn how to authenticate your API requests.", type: "api" },
  { title: "Inboxes API", url: "/api/docs/inboxes", description: "Create and manage temporary email inboxes.", type: "api" },
  { title: "Messages API", url: "/api/docs/messages", description: "Read and manage incoming emails.", type: "api" },
  { title: "Custom Domains", url: "/api/docs/custom-domains", description: "Add and verify custom domains.", type: "api" },
  { title: "Platform Domains", url: "/api/docs/platform-domains", description: "Available platform domains.", type: "api" },
  { title: "OTP Extraction", url: "/api/docs/otp", description: "Extract OTP codes from emails automatically.", type: "api" },
  { title: "WebSocket", url: "/api/docs/websocket", description: "Real-time email updates via WebSocket.", type: "api" },
  { title: "SDK Overview", url: "/api/docs/sdk", description: "Official SDKs for Node.js and Python.", type: "api" },
  { title: "Node.js/npm SDK", url: "/api/docs/sdk/npm", description: "Official Node.js SDK documentation.", type: "api" },
  { title: "Python SDK", url: "/api/docs/sdk/python", description: "Official Python SDK documentation.", type: "api" },
  { title: "Rate Limits", url: "/api/docs/rate-limits", description: "API rate limits and quotas.", type: "api" },
  { title: "Errors", url: "/api/docs/errors", description: "API error codes and troubleshooting.", type: "api" },
  { title: "FAQ", url: "/api/docs/faq", description: "Frequently asked questions.", type: "api" },
  { title: "Changelog", url: "/api/docs/changelog", description: "Latest updates and features.", type: "api" },
  { title: "CLI Tool", url: "/api/cli", description: "Command-line interface for FreeCustom.Email.", type: "api" },
  { title: "Automation", url: "/api/automation", description: "Automate email workflows.", type: "api" },
  { title: "Make.com Integration", url: "/api/automation/make", description: "Automate email tasks with Make.com.", type: "api" },
  { title: "n8n Integration", url: "/api/automation/n8n", description: "Automate email tasks with n8n.", type: "api" },
  { title: "Zapier Integration", url: "/api/automation/zapier", description: "Automate email tasks with Zapier.", type: "api" },
  { title: "OpenClaw Integration", url: "/api/automation/openclaw", description: "OpenClaw automation.", type: "api" },
  { title: "Pricing", url: "/api/pricing", description: "API and CLI pricing plans.", type: "api" },
  { title: "Playground", url: "/api/playground", description: "Interactive API playground.", type: "api" },
  { title: "Dashboard", url: "/api/dashboard", description: "Manage your API keys and usage.", type: "api" },
];

export async function GET() {
  try {
    let blogPages: any[] = [];
    try {
      if (blogClient) {
        const posts = await blogClient.getPosts({ page: 1, limit: 100 });
        if (posts && posts.posts) {
          blogPages = posts.posts.map((p: any) => ({
            title: p.title,
            url: `/blog/${p.slug}`,
            description: p.excerpt || "",
            type: "blog"
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch blog posts for search index:", err);
    }
    
    const index = [...API_PAGES, ...blogPages];
    return NextResponse.json(index);
  } catch (error) {
    console.error("Failed to generate search index:", error);
    return NextResponse.json({ error: "Failed to generate search index" }, { status: 500 });
  }
}
