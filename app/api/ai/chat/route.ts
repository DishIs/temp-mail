import { ai, chooseModel, TOOLS, SYSTEM_PROMPT } from "@/lib/ai/gemini";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const hasAttachments =
      !!(lastMessage?.attachments?.length > 0);

    const modelName = chooseModel(
      lastMessage?.content || "",
      hasAttachments
    );

    const formattedMessages = messages.map((m: any) => {
      const parts: any[] = [];

      if (m.content) {
        parts.push({ text: m.content });
      }

      if (m.attachments?.length) {
        for (const at of m.attachments) {
          if (at.type?.startsWith("image/") && at.base64) {
            const base64Data = at.base64.includes(",")
              ? at.base64.split(",")[1]
              : at.base64;

            parts.push({
              inlineData: {
                mimeType: at.type,
                data: base64Data,
              },
            });
          } else {
            parts.push({
              text: `\n[Attached File: ${at.name}]\n${at.content || ""}`,
            });
          }
        }
      }

      return {
        role: m.role === "user" ? "user" : "model",
        parts,
      };
    });

    const stream = await ai.models.generateContentStream({
      model: modelName,
      contents: [
        {
          role: "system",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        ...formattedMessages,
      ],
      config: {
        tools: TOOLS,
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              // TEXT STREAM
              if (chunk.text) {
                controller.enqueue(
                  encoder.encode(chunk.text)
                );
              }

              // TOOL CALL STREAM
              if (chunk.functionCalls?.length) {
                const payload = JSON.stringify({
                  type: "function_call",
                  calls: chunk.functionCalls,
                });

                controller.enqueue(
                  encoder.encode(`\n__FCE_AI_CALL__:${payload}`)
                );
              }
            }
          } catch (err) {
            console.error("Stream error:", err);
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
    console.error("AI Chat Error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}