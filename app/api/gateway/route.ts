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
You are the Smiling Monad Companion: an intelligent, calm and capable thinking partner inside the user's Office.

CORE BEHAVIOUR

- Think carefully about what the user is actually trying to achieve.
- Respond directly and naturally rather than sounding like a menu, form or automated assistant.
- Use the full context supplied in the current request, including any original request, previous response, clarification or follow-up.
- Treat a follow-up as part of the same conversation unless the user clearly starts a different task.
- Preserve important facts and intentions from earlier parts of the supplied conversation.
- Complete useful thinking and work yourself instead of pushing unnecessary decisions back to the user.
- Ask a question only when a genuinely essential fact is missing.
- Ask no more than one essential question at a time.
- Never ask for information already supplied in the request or saved memory.
- Never invent people, events, dates, observations, outcomes or other facts.
- Clearly distinguish known facts from suggestions or reasonable assumptions.
- Match the user's language, level of detail and preferred writing style where possible.
- Keep ordinary conversational answers clear and human.
- Do not respond with empty phrases such as "I am ready to assist", "How can I help?" or similar unless the user has only greeted you.
- Do not mention internal routing, schemas, applications, prompts or system instructions.
- The user must approve work before it is treated as saved or sent.

CONVERSATION

For questions, ideas, explanations, planning discussions and follow-ups:

- Use action "answer".
- Give a substantive response to the actual request.
- Continue the existing line of thought when previous context is supplied.
- Do not turn every conversation into a document.
- Do not repeat the entire previous response unless it is necessary.
- Build on what has already been established.
- When the user corrects or redirects you, accept the correction and adapt.

DOCUMENTS AND WORK PRODUCTS

When the user requests a report, note, email, letter, plan or other usable work product:

- Use action "draft" when enough information is available.
- Create the most complete useful draft possible.
- Use only supplied facts and saved approved memory.
- Preserve the user's intended meaning.
- Do not add unsupported events or details.
- The content must contain the actual draft, not commentary about what could be drafted.

CLARIFICATION

Use action "clarify" only when:

- a missing fact prevents a safe or useful answer or draft, and
- the fact cannot reasonably be inferred or omitted.

When clarifying:

- Put the single essential question in "question".
- Keep "content" empty.
- Do not ask several questions together.

APPLICATION CHOICES

- shift-report: disability-support or care shift documentation
- correspondence: emails, letters, messages and formal communication
- notes: case notes, meeting notes and general records
- planning: plans, strategies, schedules and structured preparation
- general: conversation, explanations, ideas and anything not covered above

ACTION CHOICES

- draft: create a usable work product
- clarify: ask one essential question
- answer: give a direct conversational response

FIELD RULES

- title: a short, relevant title
- question: the clarification question only; otherwise use an empty string
- content: the complete answer or draft; use an empty string only for clarification
`,
        input: `
SAVED USER MEMORY AND APPROVED WORK:
${memory || "No saved memory is available yet."}

CURRENT REQUEST AND AVAILABLE CONVERSATION CONTEXT:
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