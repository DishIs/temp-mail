import { CodeBlock } from "@/components/CodeBlock";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "AI Agent Integration – FreeCustom.Email Use Cases",
  description: "Give Claude, GPT, and LangChain agents the ability to sign up and verify emails autonomously via MCP.",
};

export default function AiAgentsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/api/use-cases" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          ← Use Cases
        </Link>
        <span className="text-muted-foreground/30">/</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">AI Agents</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        AI Agent Integration
      </h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Enable any LLM agent to autonomously create disposable inboxes, wait for OTPs, and complete email verification — using our MCP server or the REST API directly.
      </p>

      <div className="rounded-lg border border-border bg-muted/5 px-5 py-4 my-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">What you&apos;ll need</p>
        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1 mb-0">
          <li>Growth or Enterprise API key (for MCP tools)</li>
          <li>Claude Desktop, Cursor, or a custom agent using the MCP SDK</li>
          <li>Alternatively: any LLM + the REST API (no MCP required)</li>
        </ul>
      </div>

      {/* ── Claude Desktop ── */}
      <h2 id="claude-desktop" className="text-lg font-semibold mt-10 mb-2">
        Claude Desktop — MCP setup
      </h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Add the FCE MCP server to your{" "}
        <code className="text-xs bg-muted/60 rounded px-1">claude_desktop_config.json</code>. Claude will
        see <code className="text-xs bg-muted/60 rounded px-1">create_and_wait_for_otp</code>,{" "}
        <code className="text-xs bg-muted/60 rounded px-1">extract_otp</code>, and{" "}
        <code className="text-xs bg-muted/60 rounded px-1">get_latest_email</code> as callable tools.
      </p>
      <CodeBlock
        language="json"
        code={`// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "fce-mcp": {
      "command": "npx",
      "args": ["-y", "maildrop-mcp-server"],
      "env": {
        "FCE_API_KEY": "fce_your_growth_api_key"
      }
    }
  }
}`}
      />
      <p className="text-sm text-muted-foreground mt-3 mb-3 leading-relaxed">
        Once connected, you can prompt Claude naturally:
      </p>
      <div className="rounded-lg border border-border bg-muted/5 px-5 py-4 mb-4">
        <p className="font-mono text-xs text-foreground mb-1">User →</p>
        <p className="text-sm text-muted-foreground italic">
          &quot;Go to acme.com/signup, register a new account using a disposable email, and return the OTP you receive.&quot;
        </p>
        <p className="font-mono text-xs text-foreground mt-3 mb-1">Claude →</p>
        <p className="text-sm text-muted-foreground italic">
          Calls <code className="text-xs bg-muted/60 rounded px-1">create_and_wait_for_otp(timeout=45)</code>, uses the returned inbox for registration, then returns the OTP.
        </p>
      </div>

      {/* ── LangChain ── */}
      <h2 id="langchain" className="text-lg font-semibold mt-10 mb-2">LangChain (Python)</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Wrap the FCE API as a LangChain tool so any chain or agent can call it.
      </p>
      <CodeBlock
        language="python"
        code={`import os, requests
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate

FCE_API = "https://api2.freecustom.email"
HEADERS = {"Authorization": f"Bearer {os.environ['FCE_API_KEY']}"}

@tool
def create_inbox_and_wait_for_otp(domain: str = "ditapi.info", timeout: int = 45) -> dict:
    """
    Creates a disposable email inbox and waits up to \`timeout\` seconds for
    an OTP email to arrive. Returns the inbox address and OTP.
    """
    r = requests.post(
        f"{FCE_API}/v1/mcp/create-and-wait-otp",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={"domain": domain, "timeout": timeout},
        timeout=timeout + 5,
    )
    return r.json()

@tool
def get_otp_for_inbox(inbox: str) -> dict:
    """Extracts the most recent OTP from an already-registered inbox."""
    r = requests.get(f"{FCE_API}/v1/inboxes/{inbox}/otp", headers=HEADERS)
    return r.json()

llm = ChatOpenAI(model="gpt-4o")
tools = [create_inbox_and_wait_for_otp, get_otp_for_inbox]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an automation agent. Use the tools to handle email verification."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

result = executor.invoke({
    "input": "Create a disposable inbox, sign up at demo.acme.com, and return the OTP."
})
print(result["output"])`}
      />

      {/* ── LangGraph ── */}
      <h2 id="langgraph" className="text-lg font-semibold mt-10 mb-2">LangGraph — Agent Node</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Use FCE as a dedicated node in a LangGraph workflow, keeping email logic isolated.
      </p>
      <CodeBlock
        language="python"
        code={`from langgraph.graph import StateGraph, END
from typing import TypedDict
import requests, os

FCE_HEADERS = {"Authorization": f"Bearer {os.environ['FCE_API_KEY']}"}

class State(TypedDict):
    url: str
    inbox: str | None
    otp: str | None
    verified: bool

def provision_email(state: State) -> State:
    """LangGraph node: create inbox + wait for OTP."""
    r = requests.post(
        "https://api2.freecustom.email/v1/mcp/create-and-wait-otp",
        headers={**FCE_HEADERS, "Content-Type": "application/json"},
        json={"timeout": 45},
        timeout=50,
    )
    data = r.json()
    return {**state, "inbox": data.get("inbox"), "otp": data.get("otp")}

def verify_account(state: State) -> State:
    # Your verification logic here
    print(f"Verifying with OTP: {state['otp']} for {state['inbox']}")
    return {**state, "verified": True}

graph = StateGraph(State)
graph.add_node("provision_email", provision_email)
graph.add_node("verify_account", verify_account)
graph.set_entry_point("provision_email")
graph.add_edge("provision_email", "verify_account")
graph.add_edge("verify_account", END)

app = graph.compile()
result = app.invoke({"url": "https://acme.com", "inbox": None, "otp": None, "verified": False})
print(result)`}
      />

      {/* ── OpenAI Function Calling ── */}
      <h2 id="openai" className="text-lg font-semibold mt-10 mb-2">OpenAI — Function Calling</h2>
      <CodeBlock
        language="python"
        code={`import json, os, requests
from openai import OpenAI

client = OpenAI()
FCE_HEADERS = {"Authorization": f"Bearer {os.environ['FCE_API_KEY']}"}

tools = [
    {
        "type": "function",
        "function": {
            "name": "create_inbox_and_wait_for_otp",
            "description": "Creates a disposable inbox and waits for an OTP email.",
            "parameters": {
                "type": "object",
                "properties": {
                    "timeout": {"type": "integer", "description": "Max seconds to wait (10-60)"},
                },
            },
        },
    }
]

def call_fce(name: str, args: dict) -> str:
    if name == "create_inbox_and_wait_for_otp":
        r = requests.post(
            "https://api2.freecustom.email/v1/mcp/create-and-wait-otp",
            headers={**FCE_HEADERS, "Content-Type": "application/json"},
            json=args,
            timeout=args.get("timeout", 45) + 5,
        )
        return json.dumps(r.json())
    return json.dumps({"error": "unknown tool"})

messages = [{"role": "user", "content": "Create a disposable inbox and give me the OTP."}]

response = client.chat.completions.create(model="gpt-4o", messages=messages, tools=tools)
msg = response.choices[0].message

if msg.tool_calls:
    for tc in msg.tool_calls:
        result = call_fce(tc.function.name, json.loads(tc.function.arguments))
        messages.extend([
            msg,
            {"role": "tool", "tool_call_id": tc.id, "content": result},
        ])
    
    final = client.chat.completions.create(model="gpt-4o", messages=messages)
    print(final.choices[0].message.content)`}
      />

      {/* ── Cursor ── */}
      <h2 id="cursor" className="text-lg font-semibold mt-10 mb-2">Cursor IDE</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Cursor supports MCP natively. Add the server in{" "}
        <code className="text-xs bg-muted/60 rounded px-1">~/.cursor/mcp.json</code>:
      </p>
      <CodeBlock
        language="json"
        code={`{
  "mcpServers": {
    "fce-mcp": {
      "command": "npx",
      "args": ["-y", "maildrop-mcp-server"],
      "env": { "FCE_API_KEY": "fce_your_growth_api_key" }
    }
  }
}`}
      />
      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
        Restart Cursor. In the Composer, ask it to write a test that registers on a site and verifies the email — it will call the FCE tools automatically.
      </p>

      <div className="mt-10 flex gap-3 flex-wrap">
        <Button asChild size="sm">
          <Link href="/api/docs/mcp">MCP Reference</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/api/use-cases/ci-cd-pipelines">CI / CD integration →</Link>
        </Button>
      </div>
    </article>
  );
}