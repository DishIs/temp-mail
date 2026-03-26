import { ai, chooseModel, TOOLS, SYSTEM_PROMPT } from "@/lib/ai/gemini";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const lastMessageObj = messages[messages.length - 1];
    const hasAttachments = !!(lastMessageObj.attachments && lastMessageObj.attachments.length > 0);
    
    let modelName = chooseModel(lastMessageObj.content || "", hasAttachments);

    const formattedMessages = messages.map((m: any) => {
      const parts: any[] = [{ text: m.content || "" }];
      
      if (m.attachments && m.attachments.length > 0) {
        m.attachments.forEach((at: any) => {
          if (at.type.startsWith("image/")) {
            parts.push({
              inlineData: {
                mimeType: at.type,
                data: at.base64.split(",")[1],
              },
            });
          } else {
            parts.push({ text: `\n[Attached File: ${at.name}]\n${at.content || ""}` });
          }
        });
      }
      
      return {
        role: m.role === "user" ? "user" : "model",
        parts,
      };
    });

    const stream = await ai.models.generateContentStream({
      model: modelName,
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Understood. I am FCE AI. I am ready to assist with API, CLI, automation, and analyze any files or images you provide." }] },
        ...formattedMessages,
      ],
      config: {
        tools: TOOLS,
        maxOutputTokens: 2048,
        temperature: 0.7,
      }
    });

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (chunk.text) {
                controller.enqueue(encoder.encode(chunk.text));
              }

              if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                const callInfo = JSON.stringify({ type: "function_call", calls: chunk.functionCalls });
                controller.enqueue(encoder.encode(`\n__FCE_AI_CALL__:${callInfo}`));
              }
            }
          } catch (e) {
            console.error("Stream error:", e);
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error: any) {
    console.error("AI Chat Error Details:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}
