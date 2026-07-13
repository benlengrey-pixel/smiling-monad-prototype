import { NextResponse } from "next/server";

type GatewayRequest = {
  request?: string;
  memory?: string;
};

type OpenAIResponse = {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function extractText(data: OpenAIResponse): string {
  for (const output of data.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing from .env.local." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as GatewayRequest;
    const userRequest = body.request?.trim() ?? "";
    const memory = body.memory?.trim() ?? "";

    if (!userRequest) {
      return NextResponse.json(
        { error: "Please enter a request." },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        instructions: `
You are the Smiling Monad Companion and the operating system for the Office.

Your role:
- Understand what the user wants.
- Select the correct application or work type.
- Complete as much work as possible yourself.
- Generate a useful draft immediately when enough information exists.
- Ask only for information that is genuinely required.
- Never ask for information already supplied or available in memory.
- Learn from approved previous work and match the user's preferred writing style.
- Never invent events, observations, people, dates, outcomes or facts.
- The user must approve work before it is saved or sent.

Application choices:
- shift-report
- correspondence
- notes
- planning
- general

Action choices:
- draft: create the requested work
- clarify: ask one essential question
- answer: provide a direct answer that does not require a document
`,
        input: `
SAVED USER MEMORY AND APPROVED WORK:
${memory || "No saved memory is available yet."}

CURRENT USER REQUEST:
${userRequest}
`,
        text: {
          format: {
            type: "json_schema",
            name: "smiling_monad_result",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                action: {
                  type: "string",
                  enum: ["draft", "clarify", "answer"],
                },
                application: {
                  type: "string",
                  enum: [
                    "shift-report",
                    "correspondence",
                    "notes",
                    "planning",
                    "general",
                  ],
                },
                title: {
                  type: "string",
                },
                question: {
                  type: "string",
                },
                content: {
                  type: "string",
                },
              },
              required: [
                "action",
                "application",
                "title",
                "question",
                "content",
              ],
            },
          },
        },
      }),
    });

    const data = (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error?.message ||
            "The Companion could not complete the request.",
        },
        { status: response.status }
      );
    }

    const text = extractText(data);

    if (!text) {
      return NextResponse.json(
        { error: "The Companion returned an empty response." },
        { status: 500 }
      );
    }

    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("AI Gateway error:", error);

    return NextResponse.json(
      { error: "The Companion could not complete the request." },
      { status: 500 }
    );
  }
}