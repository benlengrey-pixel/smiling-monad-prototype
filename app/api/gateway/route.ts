import { NextResponse } from "next/server";
import { SMILING_MONAD_UNIFORM } from "@/lib/companion/uniform";

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

const GATEWAY_RULES = `
=== GATEWAY RESPONSE CONTRACT ===

Always return JSON matching the supplied schema.

Applications:

- shift-report
- correspondence
- notes
- planning
- general

Actions:

- answer
- draft
- clarify

Use:

answer
for explanations, discussion and conversation.

Use:

draft
when creating reports, emails, letters, agreements, plans, notes or other usable work products.

Use:

clarify
only when one essential missing fact prevents useful progress.

Never use clarify simply because additional information would improve the result.

Title:
Provide a short meaningful title.

Question:
Only populate when action is clarify.

Content:
Contains either:

- the complete answer
- the complete draft

Leave content empty only for clarification.
`;

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

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model:
            process.env.OPENAI_MODEL ??
            "gpt-4.1-mini",

          instructions: `
${SMILING_MONAD_UNIFORM}

${GATEWAY_RULES}
`,

          input: `
=== APPROVED MEMORY ===

${memory || "No approved memory available."}

=== CURRENT TASK ===

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
                    enum: [
                      "draft",
                      "clarify",
                      "answer",
                    ],
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
      }
    );

    const data =
      (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error?.message ??
            "The Companion could not complete the request.",
        },
        {
          status: response.status,
        }
      );
    }

    const text = extractText(data);

    if (!text) {
      return NextResponse.json(
        {
          error:
            "The Companion returned an empty response.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Gateway error", error);

    return NextResponse.json(
      {
        error:
          "The Companion could not complete the request.",
      },
      {
        status: 500,
      }
    );
  }
}