import { NextResponse } from "next/server";

import { SMILING_MONAD_UNIFORM } from "@/lib/companion/uniform";

type GatewayConversationMessage = {
  speaker?: "Ben" | "Kimi";
  text?: string;
};

type GatewayTaskMemory = {
  title?: string;
  originalRequest?: string;
  content?: string;
  status?: string;
  nextStep?: string;
};

type GatewayRequest = {
  request?: string;

  /*
   * Kept for compatibility with the current Office and Workspace.
   */
  memory?: string;

  /*
   * Structured memory used by the upgraded Companion.
   */
  conversation?: GatewayConversationMessage[];
  taskMemory?: GatewayTaskMemory | null;
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

function extractText(
  data: OpenAIResponse
): string {
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

function cleanText(
  value: unknown,
  maximumLength: number
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .slice(0, maximumLength);
}

function buildConversationMemory(
  conversation: GatewayConversationMessage[]
): string {
  const validMessages = conversation
    .filter(
      (
        message
      ): message is Required<GatewayConversationMessage> =>
        (message.speaker === "Ben" ||
          message.speaker === "Kimi") &&
        typeof message.text === "string" &&
        Boolean(message.text.trim())
    )
    .slice(-20);

  if (validMessages.length === 0) {
    return "No recent conversation is available.";
  }

  return validMessages
    .map(
      (message) =>
        `${message.speaker}: ${cleanText(
          message.text,
          4000
        )}`
    )
    .join("\n");
}

function buildTaskMemory(
  taskMemory?: GatewayTaskMemory | null
): string {
  if (!taskMemory) {
    return "No active task is available.";
  }

  const title = cleanText(
    taskMemory.title,
    500
  );

  const originalRequest = cleanText(
    taskMemory.originalRequest,
    4000
  );

  const content = cleanText(
    taskMemory.content,
    20000
  );

  const status = cleanText(
    taskMemory.status,
    200
  );

  const nextStep = cleanText(
    taskMemory.nextStep,
    2000
  );

  const sections = [
    title
      ? `Task title: ${title}`
      : "",
    originalRequest
      ? `Original request: ${originalRequest}`
      : "",
    status
      ? `Task status: ${status}`
      : "",
    nextStep
      ? `Current next step: ${nextStep}`
      : "",
    content
      ? [
          "Current task content:",
          content,
        ].join("\n")
      : "",
  ].filter(Boolean);

  return sections.length > 0
    ? sections.join("\n\n")
    : "No active task details are available.";
}

const GATEWAY_RULES = `
=== COMPANION CONTROL RULES ===

You are the intelligent controller of the Smiling Monad Space.

The application must not decide what the user means before you do.

Your responsibility is to:

1. Understand the user's actual intention.
2. Use the recent conversation and active-task memory to understand references.
3. Decide whether to answer, continue existing work, create something,
   ask one necessary question, or prepare an appropriate tool.
4. Decide how the result should be presented in the Office.
5. Decide which physical Office object, if any, should appear.
6. Return one structured decision for the application to follow.

Do not mechanically match keywords.

Consider the meaning, recent conversation, active task,
approved memory and likely user goal.

=== MEMORY BEHAVIOUR ===

Recent conversation is context, not a new instruction.

Active-task memory describes work already in progress.

When the user says things such as:

- continue
- change that
- make it shorter
- add this
- use the previous one
- what did you mean
- go back to the email
- finish it

use the recent conversation and active task to resolve what "that",
"it", "the email", "the report" or "the previous one" refers to.

Do not ask the user to repeat information already present in memory.

When continuing an active document, update the current content rather
than starting again unless the user explicitly asks for a fresh version.

Do not silently mix unrelated older conversation into a new task.

When the current request clearly begins a different task,
treat it as a new task.

=== ACTIONS ===

answer:
Use for conversation, guidance, explanations, reflection and direct answers.

draft:
Use when producing or updating a usable work product such as a report,
email, letter, plan, agreement, case note, meeting document or other material.

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
Use the Workspace when the user needs to actively develop,
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

When updating an existing task, preserve its appropriate Office object.

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

When continuing an existing task, normally retain its current title.

question:
Only populate when action is clarify.
Otherwise return an empty string.

content:
The complete answer or complete draft.

When updating a document, return the entire updated document,
not only the changed sentence.

For prepare-tool, briefly explain what will happen when the tool opens.

reason:
A short explanation of why this action and presentation were selected.
This is for application behaviour, not private chain-of-thought.

nextStep:
Describe the single next application step.

requiresConfirmation:
True only when the next step could send, publish, delete, submit,
share externally or make another consequential change.

Ordinary drafting, answering, editing and opening local tools
do not require confirmation.
`;

export async function POST(
  request: Request
) {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is missing from .env.local.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      (await request.json()) as GatewayRequest;

    const userRequest = cleanText(
      body.request,
      12000
    );

    const approvedMemory = cleanText(
      body.memory,
      20000
    );

    const conversationMemory =
      buildConversationMemory(
        Array.isArray(body.conversation)
          ? body.conversation
          : []
      );

    const taskMemory = buildTaskMemory(
      body.taskMemory
    );

    if (!userRequest) {
      return NextResponse.json(
        {
          error:
            "Please enter a request.",
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
          "Content-Type":
            "application/json",
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
=== APPROVED LONG-TERM MEMORY ===

${
  approvedMemory ||
  "No approved long-term memory is available."
}

=== RECENT CONVERSATION ===

${conversationMemory}

=== ACTIVE TASK MEMORY ===

${taskMemory}

=== CURRENT USER REQUEST ===

${userRequest}
`,

          text: {
            format: {
              type: "json_schema",
              name:
                "smiling_monad_gateway_decision",
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
      const decision =
        JSON.parse(text);

      return NextResponse.json(
        decision
      );
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
    console.error(
      "Gateway error",
      error
    );

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