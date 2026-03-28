import { GoogleGenAI, Type, Tool } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const SYSTEM_PROMPT = `
You are FCE AI, a hyper-intelligent, production-ready coding assistant for FreeCustom.Email (FCE) with site: https://www.freecustom.email. Your primary purpose is to provide flawless, production-grade code, accurate documentation, and helpful guidance for the FCE API, SDKs, and CLI tool.

CRITICAL RULE: You do NOT have any hardcoded knowledge about the FCE API, SDKs, plans, or CLI. You MUST fetch the latest data from the live pages using your available tools before answering any technical questions. Do not hallucinate endpoints or methods.

YOUR CAPABILITIES:
1. Generate production-ready code
2. Answer API questions accurately (fetch data first)
3. Provide exact CLI commands (fetch data first)
4. Analyze code or screenshots
5. Perform API actions via tools (with permission)
6. Read app pages to fetch guaranteed data (pricing, plans, docs, general info) using \`get_app_page_data\` and \`list_app_pages\`. Prioritize looking at \`/api/*\` pages like \`/api/pricing\` for exact API plan details. Use \`list_app_pages\` to see what's available, and then \`get_app_page_data\` to read the actual page content.

YOUR TASK:
- Think step-by-step before answering. Use \`<think>...</think>\` tags to output your thought process.
- Always provide COMPLETE and ACCURATE solutions
- IMPORTANT: Always show and provide direct links to relevant pages like \`/api/cli\`, \`/api/dashboard\`, \`/api/playground\`, \`/api/automation/make\`, \`/api/automation/n8n\`, \`/api/automation/zapier\`, \`/api/automation/openclaw\`, \`/api/pricing\` etc. and ask users to visit them if they need further info or practical usage.
- Never hallucinate SDKs or APIs. Always query the docs/specs first.
- Prefer SDK usage over raw HTTP
- Be concise but precise
- Always behave like a production-grade assistant

You are FCE AI.
`;

export function chooseModel(
  input: string,
  hasAttachments: boolean = false
): "gemini-2.5-flash" | "gemini-2.5-pro" {
  const complexKeywords = [
    "build",
    "debug",
    "automation",
    "complex",
    "project",
    "multi-file",
    "generate",
    "create",
    "analyze",
    "explain this image",
  ];

  const isComplex =
    hasAttachments ||
    input.length > 500 ||
    complexKeywords.some((k) =>
      input.toLowerCase().includes(k)
    );

  return isComplex ? "gemini-2.5-pro" : "gemini-2.5-flash";
}
export const TOOLS: Tool[] = [
  {
    functionDeclarations:[
      {
        name: "get_api_specs",
        description: "Fetch API schema or details from openapi.yaml",
        parameters: {
          type: Type.OBJECT,
          properties: {
            endpoint: {
              type: Type.STRING,
              description: "Endpoint or keyword like 'inboxes', 'messages'. Leave empty for the whole file.",
            },
          },
        },
      },
      {
        name: "get_app_page_data",
        description: "Read the content of any page on the webapp to gain knowledge (e.g. pricing, docs). Fetching runs against the live URL path.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            page_path: {
              type: Type.STRING,
              description: "Path to the page (e.g. '/api/docs/authentication', '/api/pricing')",
            },
          },
          required: ["page_path"],
        },
      },
      {
        name: "get_sdk_docs",
        description: "Fetch SDK documentation for a specific language or general docs",
        parameters: {
          type: Type.OBJECT,
          properties: {
            language: {
              type: Type.STRING,
              description: "Language like 'npm', 'python', or specific doc path like 'custom-domains'",
            },
          },
          required: ["language"],
        },
      },
      {
        name: "list_app_pages",
        description: "List all known webapp knowledge paths to query. No arguments needed.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "get_cli_docs",
        description: "Fetch CLI documentation",
        parameters: {
          type: Type.OBJECT,
          properties: {
            command: {
              type: Type.STRING,
              description: "Command like 'login' or 'inbox create'",
            },
          },
        },
      },
      {
        name: "handle_contact_request",
        description: "Send support request",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            message: { type: Type.STRING },
          },
          required: ["name", "email", "message"],
        },
      },
      {
        name: "trigger_api_action",
        description: "Request permission for API action or key creation",
        parameters: {
          type: Type.OBJECT,
          properties: {
            action_type: {
              type: Type.STRING,
              description: "create_api_key or perform_request",
            },
            description: {
              type: Type.STRING,
              description: "Explain what will happen",
            },
            json_params: {
              type: Type.STRING,
              description: "JSON string for API params",
            },
          },
          required: ["action_type", "description"],
        },
      },
    ],
  },
];