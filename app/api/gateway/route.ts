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
      if (
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {
        return content.text;
      }
    }
  }

  return "";
}

const GATEWAY_RULES = `
=== COMPANION CONTROL RULES ===

You are the intelligent controller of the Smiling Monad Space.

The application must not decide what the user means before you do.

Your responsibility is to:

1. Understand the user's actual intention.
2. Decide whether to answer, create something, ask one necessary question,
   or prepare an appropriate tool.
3. Decide how the result should be presented in the Office.
4. Decide which physical Office object, if any, should appear.
5. Return one structured decision for the application to follow.

Do not mechanically match keywords.

Consider the meaning, context, approved memory and likely user goal.

Do not open a folder, workspace or tool merely because a related word appears.

The Office should remain calm and uncluttered.

Only request an Office object when it genuinely helps the current task.

=== ACTIONS ===

answer:
Use for conversation, guidance, explanations, reflection and direct answers.

draft:
Use when producing a usable work product such as a report, email, letter,
plan, agreement, case note, meeting document or other finished material.

clarify:
Use only when one essential missing fact prevents useful progress.

Never use clarify merely because more information could improve the result.
Make reasonable progress whenever possible.

prepare-tool:
Use when the user clearly wants to begin an interactive workflow that requires
a dedicated tool, structured form or staged collection of information.

=== APPLICATIONS ===

shift-report:
Shift reports, support notes and NDIS shift documentation.

correspondence:
Emails, letters, messages and formal communication.

notes:
Case notes, meeting notes, observations and general records.

planning:
Plans, schedules, goals, meetings and organised future actions.

general:
Conversation, guidance, reflection and tasks that do not fit another application.

=== PRESENTATION ===

conversation:
Show the response naturally in the existing conversation area.

document:
Present completed substantial work as a readable document.

folder:
Place completed or saved formal work inside an appropriate physical folder.

workspace:
Use the temporary Workspace when the user needs to actively develop,
review or organise material.

tool:
Open a dedicated interactive tool only when action is prepare-tool.

=== OFFICE OBJECTS ===

none:
No physical object should appear.

report-folder:
Use for formal reports and completed support documentation.

correspondence-folder:
Use for formal letters, emails and communication drafts.

notebook:
Use for notes, observations and informal written records.

planner:
Use for planning, scheduling, goals and organised future work.

workspace:
Use when active editing, comparison or development is required.

The Office object represents the work.

Do not request both a folder and the Workspace unless there is a genuine reason.

=== TOOLS ===

none:
No dedicated tool is needed.

shift-report:
Interactive shift-report workflow.

correspondence:
Interactive correspondence workflow.

notes:
Interactive note-taking workflow.

planning:
Interactive planning workflow.

=== RESPONSE REQUIREMENTS ===

Always return valid JSON matching the supplied schema.

title:
A short, meaningful title.

question:
Only populate when action is clarify.
Otherwise return an empty string.

content:
The complete answer or complete draft.

For prepare-tool, briefly explain what will happen when the tool opens.

reason:
A short explanation of why this action and presentation were selected.
This is for application behaviour, not private chain-of-thought.

nextStep:
Describe the single next application step.

requiresConfirmation:
True only when the next step could send, publish, delete, submit,
share externally or make another consequential change.

Ordinary drafting, answering and opening local tools do not require confirmation.
`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is missing from .env.local.",
        },
        {
          status: 500,
        }
      );
    }

    const body = (await request.json()) as GatewayRequest;

    const userRequest = body.request?.trim() ?? "";
    const memory = body.memory?.trim() ?? "";

    if (!userRequest) {
      return NextResponse.json(
        {
          error: "Please enter a request.",
        },
        {
          status: 400,
        }
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

=== CURRENT USER REQUEST ===

${userRequest}
`,

          text: {
            format: {
              type: "json_schema",
              name: "smiling_monad_gateway_decision",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,

                properties: {
                  action: {
                    type: "string",
                    enum: [
                      "answer",
                      "draft",
                      "clarify",
                      "prepare-tool",
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

                  presentation: {
                    type: "string",
                    enum: [
                      "conversation",
                      "document",
                      "folder",
                      "workspace",
                      "tool",
                    ],
                  },

                  officeObject: {
                    type: "string",
                    enum: [
                      "none",
                      "report-folder",
                      "correspondence-folder",
                      "notebook",
                      "planner",
                      "workspace",
                    ],
                  },

                  tool: {
                    type: "string",
                    enum: [
                      "none",
                      "shift-report",
                      "correspondence",
                      "notes",
                      "planning",
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

                  reason: {
                    type: "string",
                  },

                  nextStep: {
                    type: "string",
                  },

                  requiresConfirmation: {
                    type: "boolean",
                  },
                },

                required: [
                  "action",
                  "application",
                  "presentation",
                  "officeObject",
                  "tool",
                  "title",
                  "question",
                  "content",
                  "reason",
                  "nextStep",
                  "requiresConfirmation",
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

    try {
      const decision = JSON.parse(text);

      return NextResponse.json(decision);
    } catch (parseError) {
      console.error(
        "Gateway JSON parsing error",
        parseError,
        text
      );

      return NextResponse.json(
        {
          error:
            "The Companion returned a response that could not be understood.",
        },
        {
          status: 500,
        }
      );
    }
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