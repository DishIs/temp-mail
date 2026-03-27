import { ai, chooseModel, TOOLS, SYSTEM_PROMPT } from "@/lib/ai/gemini";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { Redis } from "@upstash/redis";
import { resend } from "@/lib/resend";

export const runtime = "nodejs";

const redis = Redis.fromEnv();

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get("fce_ai_verified")?.value) {
      return new Response(JSON.stringify({ error: "Unauthorized. Turnstile verification required." }), { status: 403 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const hasAttachments = !!(lastMessage?.attachments?.length > 0);

    const modelName = chooseModel(
      lastMessage?.content || "",
      hasAttachments
    );

    // Limit Session Tokens
    const session = await auth();
    const userEmail = session?.user?.email;
    const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    // Construct a simplistic fingerprint from user-agent and language
    const ua = req.headers.get("user-agent") || "unknown";
    const lang = req.headers.get("accept-language") || "unknown";
    const fingerprint = `${ua}|${lang}`;
    
    const MAX_TOKENS = 150000;
    
    let estimatedTokens = 0;
    for (const m of messages) {
      if (m.content) {
        estimatedTokens += Math.ceil(m.content.length / 4);
      }
    }
    
    const redisKeys = [
      `ai_usage:ip:${ip}`,
      `ai_usage:fp:${fingerprint}`,
      userEmail ? `ai_usage:email:${userEmail}` : null
    ].filter(Boolean) as string[];

    let isAnomaly = false;
    for (const key of redisKeys) {
      const currentUsage = await redis.get<number>(key) || 0;
      if (currentUsage > MAX_TOKENS) {
        isAnomaly = true;
      }
    }

    if (isAnomaly) {
      // Send anomaly alert if not already sent recently to avoid spamming the admin
      const alertKey = `ai_alert_sent:${ip}`;
      const alertSent = await redis.get(alertKey);
      
      if (!alertSent) {
        await resend.emails.send({
          from: `FreeCustom.Email <contact@freecustom.email>`,
          to: process.env.ADMIN_EMAIL || "admin@example.com",
          subject: `[ALERT] FCE AI Abuse Detected`,
          text: `Anomaly detected. Usage exceeded limit for IP: ${ip}, Email: ${userEmail || "Guest"}\nFingerprint: ${fingerprint}`,
        });
        await redis.setex(alertKey, 3600, "1"); // Only alert once per hour per IP
      }

      return new Response(JSON.stringify({ error: "Session token limit exceeded. Please try again later." }), { status: 429 });
    }

    // Increment usage asynchronously
    for (const key of redisKeys) {
      const currentVal = await redis.incrby(key, estimatedTokens);
      if (currentVal === estimatedTokens) {
        // First time setting this key, set expiration
        await redis.expire(key, 86400); // 24 hours reset
      }
    }

    // Format messages strictly to "user" and "model" roles
    const formattedMessages = messages.map((m: any) => {
      const parts: any[] =[];

      if (m.content) {
        parts.push({ text: m.content });
      }

      if (m.toolExecutions?.length) {
        for (const exec of m.toolExecutions) {
          if (m.role === "model") {
            parts.push({
              functionCall: {
                name: exec.name,
                args: exec.args || {},
              }
            });
          }
        }
      }

      // If it's a hidden tool result, Gemini prefers `functionResponse` natively.
      if (m.hidden && m.isToolResult) {
        return {
          role: "user",
          parts: [{
            functionResponse: {
              name: m.toolName,
              response: { result: m.content }
            }
          }]
        };
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
      contents: formattedMessages, // No system role here!
      config: {
        systemInstruction: SYSTEM_PROMPT, // Put system prompt here
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

    let userFacingError = "Internal Server Error. Please try again later.";
    let statusCode = 500;

    try {
      const errorDetails = JSON.parse(error.message);
      if (errorDetails?.error?.message) {
        userFacingError = `AI Error: ${errorDetails.error.message}`;
        if (errorDetails.error.code === 503) {
          userFacingError = "AI is currently experiencing high demand. Please try again in a few moments.";
          statusCode = 503;
        }
      } else {
        userFacingError = `AI Error: ${error.message}`;
      }
    } catch (parseError) {
      // If parsing fails, use the original message or a generic one.
      userFacingError = `AI Error: ${error.message}`;
    }

    return new Response(
      JSON.stringify({
        error: userFacingError,
      }),
      { status: statusCode }
    );
  }
}