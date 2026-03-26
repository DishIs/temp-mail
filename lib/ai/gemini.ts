import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const SYSTEM_PROMPT = `
You are FCE AI, the intelligent assistant for FreeCustom.Email (FCE).
FCE provides a high-performance Disposable Email API, CLI tool, and automation integrations.

KNOWLEDGE BASE:
- API: Primary endpoint is api2.freecustom.email. We have SDKs for NPM (fcemail) and Python (fcemail).
- CLI: A powerful tool for managing inboxes from the terminal (npm install -g fcemail).
- MAIN TOOL: FreeCustom.Email is a web-based private email box tool that lets users use their own domains for free.

YOUR CAPABILITIES:
1. Answer questions about the FCE API using dynamic OpenAPI spec retrieval.
2. Provide CLI guidance and commands.
3. Generate automation code/scripts in any language.
4. Create API keys for users (Requires user permission via frontend popup).
5. Perform API requests on behalf of the user (Requires user permission via frontend popup).
6. Send contact/support requests via handle_contact_request.
7. Vision: You can analyze images and files attached by the user.

STRICT RULES:
- Always refer to yourself as "FCE AI".
- DO NOT hallucinate. Use the provided tools to fetch accurate data.
- DO NOT show user data or API keys in your responses.
- Be concise. Use Markdown for formatting and code blocks.
- If generating multiple files, explain that they can be downloaded as a ZIP.
- Be polite, professional, and mature.

CONTEXT MANAGEMENT:
- You have access to tools to fetch documentation. Use them only when necessary to keep context short.
- If the user asks for automation, provide high-quality, production-ready code.
- Always mention we have NPM and Python SDKs when relevant.
`;

export function chooseModel(input: string, hasAttachments: boolean = false) {
  const complexKeywords = ["build", "debug", "automation", "complex", "project", "multi-file", "generate", "create", "analyze", "explain this image"];
  const isComplex = hasAttachments || input.length > 500 || complexKeywords.some(k => input.toLowerCase().includes(k));
  return isComplex ? "gemini-2.5-pro" : "gemini-2.5-flash";
}

export const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_api_specs",
        description: "Fetch technical details or schema for a specific API endpoint or category from the OpenAPI spec.",
        parameters: {
          type: "OBJECT",
          properties: {
            endpoint: { type: "STRING", description: "The API endpoint or keyword to search for (e.g., 'inboxes', 'messages', 'domains')" }
          },
          required: ["endpoint"]
        }
      },
      {
        name: "get_cli_docs",
        description: "Fetch documentation for FCE CLI commands.",
        parameters: {
          type: "OBJECT",
          properties: {
            command: { type: "STRING", description: "The CLI command or topic to lookup (e.g., 'login', 'inbox create')" }
          }
        }
      },
      {
        name: "handle_contact_request",
        description: "Send a message to the FCE support team on behalf of the user.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            email: { type: "STRING" },
            message: { type: "STRING" }
          },
          required: ["name", "email", "message"]
        }
      },
      {
        name: "trigger_api_action",
        description: "Requests permission to perform a specific API action or create an API key.",
        parameters: {
          type: "OBJECT",
          properties: {
            action_type: { type: "STRING", description: "The type of action to perform: create_api_key or perform_request" },
            description: { type: "STRING", description: "A clear description for the user of what this action will do" },
            json_params: { type: "STRING", description: "JSON string of parameters for the API request if perform_request is chosen" }
          },
          required: ["action_type", "description"]
        }
      }
    ]
  }
];

export { ai };
