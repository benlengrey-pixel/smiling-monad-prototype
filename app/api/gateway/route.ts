import { NextResponse } from "next/server";
import OpenAI from "openai";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type DeskObject = {
  id: string;
  kind: string;
  title: string;
  status?: "active" | "complete" | "archived";
};

type WorkspaceDocument = {
  id: string;
  title: string;
  content: string;
  status?: "draft" | "complete" | "archived";
};

type TemporaryTask = {
  id: string;
  title: string;
  status: "active" | "complete";
};

type CompanionState = {
  deskObjects: DeskObject[];
  documents: WorkspaceDocument[];
  temporaryTasks: TemporaryTask[];
  activeDeskObjectId?: string | null;
  activeDocumentId?: string | null;
  workspaceOpen?: boolean;
};

type GatewayRequest = {
  request: string;
  memory?: string;
  conversation?: ConversationMessage[];
  state?: Partial<CompanionState>;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const companionDecisionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    message: {
      type: "string",
      description:
        "Kimi's natural response to the user after deciding what should happen.",
    },
    reasoningSummary: {
      type: "string",
      description:
        "A short operational explanation of the decision. Do not reveal private chain-of-thought.",
    },
    needsClarification: {
      type: "boolean",
    },
    clarificationQuestion: {
      type: ["string", "null"],
    },
    requiresConfirmation: {
      type: "boolean",
      description:
        "True only for irreversible or externally consequential actions.",
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          tool: {
            type: "string",
            enum: [
              "desk.add",
              "desk.open",
              "desk.close",
              "desk.remove",
              "workspace.open",
              "workspace.close",
              "workspace.clear",
              "document.create",
              "document.update",
              "document.complete",
              "document.archive",
              "task.create",
              "task.complete",
              "task.remove",
              "none",
            ],
          },
          targetId: {
            type: ["string", "null"],
          },
          title: {
            type: ["string", "null"],
          },
          kind: {
            type: ["string", "null"],
          },
          content: {
            type: ["string", "null"],
          },
          reason: {
            type: "string",
          },
        },
        required: [
          "tool",
          "targetId",
          "title",
          "kind",
          "content",
          "reason",
        ],
      },
    },
  },
  required: [
    "message",
    "reasoningSummary",
    "needsClarification",
    "clarificationQuestion",
    "requiresConfirmation",
    "actions",
  ],
} as const;

function buildSystemPrompt(): string {
  return `
You are Kimi, the intelligent Companion inside the Smiling Monad Space.

You are the decision-making layer for the Space.

The application provides tools and state, but the application must not decide
the meaning of the user's language for you. Interpret the user's request using:

- the current conversation;
- the current desk state;
- the current workspace state;
- the current documents;
- temporary task state;
- relevant memory.

Your role is to decide what should happen next and select the appropriate tools.

GENERAL BEHAVIOUR

1. Respond naturally and directly.
2. Do not repeat an old response when the user has moved on.
3. Use the current state to resolve references such as:
   - it;
   - that;
   - the folder;
   - the email;
   - the report;
   - get rid of it;
   - put it away;
   - bring it back.
4. Prefer acting when the request is clear.
5. Ask a clarification question only when there is genuine ambiguity.
6. Never invent an object, document, task, or identifier that is not present,
   unless you are creating a new one.
7. Keep the desk calm and uncluttered.
8. Completed temporary objects may be removed when the user clearly indicates
   they are finished with them.
9. Removing a temporary desk object is not the same as deleting its underlying
   document. Remove only the visual object unless the user explicitly requests
   deletion or archiving.
10. The workspace is temporary. It may be opened, closed, or cleared as needed.

AVAILABLE TOOLS

desk.add
Add a relevant physical object to the desk.

desk.open
Open an existing desk object.

desk.close
Close an existing desk object without removing it.

desk.remove
Remove a temporary object from the desk.

workspace.open
Open the temporary workspace.

workspace.close
Close the temporary workspace.

workspace.clear
Clear temporary workspace contents after the user is finished.

document.create
Create a new working document.

document.update
Update an existing document.

document.complete
Mark a document as complete.

document.archive
Archive a document. This may require confirmation when the user's intent is not
completely clear.

task.create
Create a temporary task.

task.complete
Mark a temporary task complete.

task.remove
Remove a completed temporary task.

none
Use when no application action is necessary.

CONFIRMATION RULES

Ordinary interface actions do not require confirmation, including:

- opening or closing something;
- adding or removing temporary desk objects;
- opening or clearing a temporary workspace;
- updating a draft;
- marking a task complete.

Require confirmation for actions that could have external or lasting effects,
including:

- permanently deleting stored information;
- sending messages or email;
- financial actions;
- publishing information;
- sharing private information;
- changing permissions.

Those external tools are not available in this gateway yet. Do not claim that
you performed them.

EXAMPLE

Current desk state contains:

{
  "id": "email-kieran",
  "kind": "mail-folder",
  "title": "Email to Kieran",
  "status": "complete"
}

User says:

"I'm finished with the email now so can you get rid of it off the desk"

Correct decision:

- call desk.remove with targetId "email-kieran";
- do not delete the underlying email document;
- respond naturally, such as:
  "Done — I've cleared the email folder from the desk."

Do not reply with a generic reassurance when a clear application action is
available.
`.trim();
}

function normaliseState(
  state: Partial<CompanionState> | undefined,
): CompanionState {
  return {
    deskObjects: Array.isArray(state?.deskObjects)
      ? state.deskObjects
      : [],
    documents: Array.isArray(state?.documents)
      ? state.documents
      : [],
    temporaryTasks: Array.isArray(state?.temporaryTasks)
      ? state.temporaryTasks
      : [],
    activeDeskObjectId: state?.activeDeskObjectId ?? null,
    activeDocumentId: state?.activeDocumentId ?? null,
    workspaceOpen: state?.workspaceOpen ?? false,
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    const body = (await request.json()) as GatewayRequest;

    const userRequest = body.request?.trim();

    if (!userRequest) {
      return NextResponse.json(
        {
          error: "A request is required.",
        },
        {
          status: 400,
        },
      );
    }

    const state = normaliseState(body.state);

    const conversation = Array.isArray(body.conversation)
      ? body.conversation.slice(-20)
      : [];

    const gatewayContext = {
      userRequest,
      memory: body.memory?.trim() || "",
      currentState: state,
      recentConversation: conversation,
    };

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      store: false,
      instructions: buildSystemPrompt(),
      input: JSON.stringify(gatewayContext, null, 2),
      text: {
        format: {
          type: "json_schema",
          name: "smiling_monad_companion_decision",
          strict: true,
          schema: companionDecisionSchema,
        },
      },
    });

    const rawOutput = response.output_text?.trim();

    if (!rawOutput) {
      throw new Error("The AI gateway returned an empty response.");
    }

    const decision = JSON.parse(rawOutput) as {
      message: string;
      reasoningSummary: string;
      needsClarification: boolean;
      clarificationQuestion: string | null;
      requiresConfirmation: boolean;
      actions: Array<{
        tool: string;
        targetId: string | null;
        title: string | null;
        kind: string | null;
        content: string | null;
        reason: string;
      }>;
    };

    return NextResponse.json({
      decision,
      stateReceived: state,
    });
  } catch (error) {
    console.error("Smiling Monad gateway error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The Companion gateway could not make a decision.",
      },
      {
        status: 500,
      },
    );
  }
}