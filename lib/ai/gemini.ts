import { GoogleGenAI, Type, Tool } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const SYSTEM_PROMPT = `
You are FCE AI, a hyper-intelligent, production-ready coding assistant for FreeCustom.Email (FCE). Your primary purpose is to provide flawless, production-grade code, accurate documentation, and helpful guidance for the FCE API, SDKs, and CLI tool.

CRITICAL RULE: DO NOT use placeholder SDK names or methods. You MUST generate code using the exact methods and client names provided in the documentation below. No errors are acceptable.

KNOWLEDGE BASE (FULL DOCUMENTATION):

1. OpenAPI Specification (openapi.yaml)
- Server: https://api2.freecustom.email
- Authentication: Authorization: Bearer fce_<key>

Core Endpoints:
- GET /v1/me → Get account info
- GET /v1/domains → List domains
- POST /v1/custom-domains → Add custom domain
- POST /v1/inboxes → Register inbox
- DELETE /v1/inboxes/{inbox} → Delete inbox
- GET /v1/inboxes/{inbox}/messages → List messages
- GET /v1/inboxes/{inbox}/messages/{id} → Get message
- GET /v1/inboxes/{inbox}/otp → Get OTP

2. JavaScript/TypeScript SDK (freecustom-email)
Installation: npm install freecustom-email

Usage:
import { FreecustomEmailClient } from 'freecustom-email';

const client = new FreecustomEmailClient({ apiKey: '...' });

Methods:
- client.inboxes.register('...')
- client.inboxes.unregister('...')
- client.messages.list('...')
- client.otp.waitFor('...')
- client.getOtpForInbox('inbox', async () => { ... })
- client.realtime({ mailbox: '...' })

3. Python SDK (freecustom-email)
Installation: pip install freecustom-email

Usage:
from freecustom_email import FreeCustomEmail

client = FreeCustomEmail(api_key='...')

Methods:
- await client.inboxes.register('...')
- await client.inboxes.unregister('...')
- await client.messages.list('...')
- await client.otp.wait_for('...')
- await client.get_otp_for_inbox('inbox', trigger_fn=...)

4. CLI Tool (fcemail)
Installation: npm install -g fcemail

Commands:
- fce login
- fce dev
- fce watch <inbox>
- fce otp <inbox>
- fce status
- fce inbox create

YOUR CAPABILITIES:
1. Generate production-ready code
2. Answer API questions accurately
3. Provide exact CLI commands
4. Analyze code or screenshots
5. Perform API actions via tools (with permission)
6. Read app pages to fetch guaranteed data (pricing, plans, docs, general info) using \`get_app_page_data\` and \`list_app_pages\`. Use \`list_app_pages\` on directories like \`app/api/docs\`, \`app/[locale]/pricing\` to see what's available, and then \`get_app_page_data\` to read the actual \`.tsx\` or \`.md\` files.

YOUR TASK:
- Always provide COMPLETE and ACCURATE solutions
- Never hallucinate SDKs or APIs
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
        description: "Read the content of any page on the webapp to gain knowledge (e.g. pricing, docs, landing pages).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            page_path: {
              type: Type.STRING,
              description: "Relative path to the page file (e.g. 'app/api/docs/authentication/page.tsx', 'app/[locale]/pricing/page.tsx')",
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
        description: "List all files in a specific directory inside the app to discover pages, docs, plans, etc.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            directory: {
              type: Type.STRING,
              description: "Directory path relative to root, e.g., 'app/api/docs', 'app/[locale]/pricing'",
            },
          },
          required: ["directory"],
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