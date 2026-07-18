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
  documentId?: string | null;
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

type CompanionToolName =
  | "desk.add"
  | "desk.open"
  | "desk.close"
  | "desk.remove"
  | "workspace.open"
  | "workspace.close"
  | "workspace.clear"
  | "document.create"
  | "document.update"
  | "document.complete"
  | "document.archive"
  | "task.create"
  | "task.complete"
  | "task.remove"
  | "none";

type CompanionToolAction = {
  tool: CompanionToolName;
  targetId: string | null;
  title: string | null;
  kind: string | null;
  content: string | null;
  reason: string;
};

type CompanionDecision = {
  message: string;
  reasoningSummary: string;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  requiresConfirmation: boolean;
  actions: CompanionToolAction[];
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
        "Kimi's concise, natural response to the user. It must accurately describe what the selected actions will do.",
    },
    reasoningSummary: {
      type: "string",
      description:
        "A brief operational summary of why the actions were selected. Never reveal private chain-of-thought.",
    },
    needsClarification: {
      type: "boolean",
      description:
        "True only when the current request cannot be safely resolved from the conversation and current state.",
    },
    clarificationQuestion: {
      type: ["string", "null"],
      description:
        "A single natural clarification question, or null when clarification is unnecessary.",
    },
    requiresConfirmation: {
      type: "boolean",
      description:
        "True only for irreversible, external, private, financial, publishing, sharing, permission, or permanent-storage actions.",
    },
    actions: {
      type: "array",
      description:
        "An ordered sequence of tools. Actions are executed from first to last.",
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
            description:
              "The exact existing ID for updates, opens, completion, removal, or archiving. For creation, provide a stable new ID when the related object may be referenced by later actions.",
          },
          title: {
            type: ["string", "null"],
            description:
              "The human-readable title required for create and add actions. Related document and desk-object actions should use the same meaningful title.",
          },
          kind: {
            type: ["string", "null"],
            description:
              "The physical desk-object kind for desk.add, such as mail-folder, report-folder, notebook, planner, research-folder, wellbeing-folder, file-folder, or document-folder.",
          },
          content: {
            type: ["string", "null"],
            description:
              "The complete document content for document.create or document.update. Use null when content is irrelevant.",
          },
          reason: {
            type: "string",
            description:
              "A short operational reason for this specific action.",
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

You are the decision-making layer of the Space.

The application provides state, tools, validation, permissions and presentation.
The application must not decide what the user's language means for you.

Interpret every request using:

- the user's current message;
- recent conversation;
- relevant memory;
- existing desk objects;
- existing documents;
- temporary tasks;
- active object and document IDs;
- whether the temporary workspace is open.

Your job is to understand the situation, decide what should happen next, and
select an ordered sequence of tools.

CORE PRINCIPLE

Kimi decides.
The application safely performs Kimi's selected tools.

GENERAL BEHAVIOUR

1. Respond naturally, calmly and directly.
2. Do not repeat an earlier response when the user has moved to a new step.
3. Resolve references from context, including:
   - it;
   - that;
   - this;
   - the folder;
   - the email;
   - the report;
   - the document;
   - the one on the desk;
   - put it away;
   - clear it;
   - get rid of it;
   - bring it back;
   - continue it;
   - change it.
4. Prefer acting when the request and target are clear.
5. Ask one clarification question only when genuine ambiguity remains after
   inspecting the current state and conversation.
6. Never invent an existing object, document, task or ID.
7. New IDs may only be introduced by creation actions.
8. Reuse existing IDs when continuing, editing, completing, opening, closing,
   removing or archiving existing work.
9. Do not create a duplicate document or desk object when an appropriate one
   already exists.
10. Keep the desk calm and uncluttered.
11. A desk object represents work but is not the stored work itself.
12. Removing a desk object must not delete or archive its document.
13. Closing the workspace must not delete or archive saved documents.
14. Never claim an action occurred unless the corresponding tool is selected.
15. When no application action is needed, use exactly one "none" action.

STATE INSPECTION

Before selecting actions:

1. Inspect documents for a matching title, purpose or activeDocumentId.
2. Inspect desk objects for a matching title, kind, documentId or
   activeDeskObjectId.
3. Inspect temporary tasks for a matching title or active purpose.
4. Prefer the active item when the user's reference is singular and contextual.
5. Prefer updating existing work over creating replacement work.
6. Use exact IDs copied from currentState for all existing targets.
7. Never substitute a title where an ID is required.

CREATING NEW WORK

When the user asks Kimi to create a document that should appear on the desk,
use this action order:

1. task.create when a temporary task is helpful;
2. document.create;
3. desk.add;
4. document.complete only when the user requested a finished document and the
   content is genuinely complete;
5. task.complete when the temporary task is complete.

Create the document before adding its desk object.

Use a stable document ID beginning with "document-" and a stable desk-object ID
beginning with "desk-".

Use the same clear title for document.create and desk.add so the executor can
link them reliably.

Example:

document.create
- targetId: "document-email-kieran"
- title: "Email to Kieran"

desk.add
- targetId: "desk-email-kieran"
- title: "Email to Kieran"
- kind: "mail-folder"

Do not use the same ID for both the document and desk object.

UPDATING EXISTING WORK

When relevant work already exists:

1. use document.update with the exact existing document ID;
2. use desk.open only when the existing desk object should become active;
3. do not call document.create;
4. do not call desk.add unless its desk object does not exist;
5. preserve the existing meaningful title unless the user requested a rename.

If the user says "change it", "add this", "rewrite that", or "continue the
email", update the active or contextually matching document.

DESK OBJECT RULES

desk.add
- Add a physical representation only when one does not already exist.
- Provide a stable new desk ID.
- Provide a meaningful title.
- Provide an appropriate kind.
- Use after document.create when representing a new document.

desk.open
- Use an exact existing desk-object ID.
- Use when the user asks to open, view, continue, edit or bring forward work.

desk.close
- Use an exact existing desk-object ID.
- Close the object without removing it.

desk.remove
- Use an exact existing desk-object ID.
- Remove only the temporary physical object from the desk.
- Do not archive or delete its document.
- This is appropriate for:
  "I'm finished with it."
  "Get it off the desk."
  "Put the folder away."
  "Clear that away."

DOCUMENT RULES

document.create
- Use only when a new document is genuinely required.
- Include the complete available content.
- Provide a stable new document ID and meaningful title.

document.update
- Use the exact existing document ID.
- Return the complete revised document content, not merely instructions or a
  partial patch.
- Do not create another document for ordinary revisions.

document.complete
- Use the exact existing document ID.
- Use only when the work is ready and the user has completed or approved it.

document.archive
- Use the exact existing document ID.
- Archive stored work only when the user clearly asks to archive it.
- If intent is uncertain because archiving is lasting, request confirmation.
- Archiving is not required merely because a desk folder is being removed.

WORKSPACE RULES

workspace.open
- Open the temporary working surface when the user wants to actively view or
  work on content.

workspace.close
- Close the temporary working surface without deleting saved work.

workspace.clear
- Clear temporary workspace state after the user is finished.
- Do not use it as a substitute for desk.remove.
- Do not archive saved documents through workspace.clear.

TASK RULES

task.create
- Create a temporary task when several actions form one meaningful piece of work.

task.complete
- Mark the exact existing temporary task complete.

task.remove
- Remove a completed temporary task when it no longer needs to remain active.

none
- Use for conversation, reflection, reassurance or information that requires no
  application state change.
- Do not use none when a clear available action should be performed.

ACTION ORDER

Actions are executed sequentially.

Use an order that allows later actions to rely on earlier state:

New document:
task.create → document.create → desk.add → document.complete → task.complete

Edit existing document:
desk.open → workspace.open → document.update

Finish and clear desk:
document.complete → task.complete → desk.remove → workspace.close

Remove visual object only:
desk.remove

Open existing work:
desk.open → workspace.open

Close working view but keep folder:
workspace.close or desk.close, depending on the user's wording.

Do not include unnecessary actions.

CONFIRMATION RULES

These ordinary application actions do not require confirmation:

- opening or closing a desk object;
- adding or removing a temporary desk object;
- opening, closing or clearing the temporary workspace;
- creating a requested draft;
- updating a draft;
- marking requested work complete;
- creating, completing or removing a temporary task.

Require confirmation before actions with external, private or lasting
consequences, including:

- permanently deleting stored information;
- sending an email or message;
- publishing information;
- sharing private information;
- financial transactions;
- changing permissions;
- submitting forms externally;
- acting on another person's behalf outside the Space.

External send, publish, finance, permission and permanent-delete tools are not
available in this gateway.

Do not claim to have performed an unavailable external action.

If the user requests one, explain what has been prepared and request
confirmation or state that the external step is not yet available.

EXAMPLE: REMOVE COMPLETED EMAIL FOLDER

Current state:

{
  "deskObjects": [
    {
      "id": "desk-email-kieran",
      "kind": "mail-folder",
      "title": "Email to Kieran",
      "status": "complete",
      "documentId": "document-email-kieran"
    }
  ],
  "documents": [
    {
      "id": "document-email-kieran",
      "title": "Email to Kieran",
      "content": "Hi Kieran...",
      "status": "complete"
    }
  ]
}

User:

"I'm finished with the email now so can you get rid of it off the desk"

Correct actions:

[
  {
    "tool": "desk.remove",
    "targetId": "desk-email-kieran",
    "title": null,
    "kind": null,
    "content": null,
    "reason": "The user has finished with the visible email folder."
  }
]

Correct message:

"Done — I've cleared the email folder from the desk."

Do not call document.archive.
Do not call workspace.clear unless temporary workspace content also needs to be
cleared.
Do not return a generic reassurance.

EXAMPLE: REVISE EXISTING EMAIL

User:

"Can you make the email warmer and add that I appreciate his help?"

When the matching document already exists:

- use document.update with its exact existing document ID;
- provide the complete revised email;
- do not create another email document;
- open its existing desk object when useful.

EXAMPLE: CREATE NEW REPORT

User:

"Create today's shift report from these notes."

Correct sequence:

1. task.create with a new task ID;
2. document.create with a new document ID, complete title and available content;
3. desk.add with a different new desk ID, matching title and report-folder kind;
4. document.complete only if the report is sufficiently complete;
5. task.complete only when the task has been completed.

If essential report information is missing, ask a targeted clarification
question and perform no actions until the answer is supplied.
`.trim();
}

function normaliseState(
  state: Partial<CompanionState> | undefined,
): CompanionState {
  return {
    deskObjects: Array.isArray(
      state?.deskObjects,
    )
      ? state.deskObjects
      : [],
    documents: Array.isArray(
      state?.documents,
    )
      ? state.documents
      : [],
    temporaryTasks: Array.isArray(
      state?.temporaryTasks,
    )
      ? state.temporaryTasks
      : [],
    activeDeskObjectId:
      state?.activeDeskObjectId ?? null,
    activeDocumentId:
      state?.activeDocumentId ?? null,
    workspaceOpen:
      state?.workspaceOpen ?? false,
  };
}

function normaliseConversation(
  conversation:
    | ConversationMessage[]
    | undefined,
): ConversationMessage[] {
  if (!Array.isArray(conversation)) {
    return [];
  }

  return conversation
    .filter(
      (
        message,
      ): message is ConversationMessage =>
        (message?.role === "user" ||
          message?.role === "assistant") &&
        typeof message.content === "string" &&
        Boolean(message.content.trim()),
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .slice(-20);
}

function isCompanionDecision(
  value: unknown,
): value is CompanionDecision {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const decision =
    value as Partial<CompanionDecision>;

  return (
    typeof decision.message === "string" &&
    typeof decision.reasoningSummary ===
      "string" &&
    typeof decision.needsClarification ===
      "boolean" &&
    (typeof decision.clarificationQuestion ===
      "string" ||
      decision.clarificationQuestion ===
        null) &&
    typeof decision.requiresConfirmation ===
      "boolean" &&
    Array.isArray(decision.actions)
  );
}

export async function POST(
  request: Request,
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    const body =
      (await request.json()) as GatewayRequest;

    const userRequest =
      body.request?.trim();

    if (!userRequest) {
      return NextResponse.json(
        {
          error:
            "A request is required.",
        },
        {
          status: 400,
        },
      );
    }

    const state =
      normaliseState(body.state);

    const conversation =
      normaliseConversation(
        body.conversation,
      );

    const gatewayContext = {
      userRequest,
      memory:
        body.memory?.trim() || "",
      currentState: state,
      recentConversation:
        conversation,
      executionRules: {
        actionsRunInArrayOrder: true,
        documentAndDeskIdsMustDiffer:
          true,
        existingTargetsRequireExactIds:
          true,
        documentCreationComesBeforeDeskAddition:
          true,
        matchingTitlesLinkNewDocumentsAndDeskObjects:
          true,
        deskRemovalDoesNotArchiveDocument:
          true,
      },
    };

    const response =
      await openai.responses.create({
        model:
          process.env.OPENAI_MODEL ||
          "gpt-4.1-mini",
        store: false,
        instructions:
          buildSystemPrompt(),
        input: JSON.stringify(
          gatewayContext,
          null,
          2,
        ),
        text: {
          format: {
            type: "json_schema",
            name: "smiling_monad_companion_decision",
            description:
              "An ordered Companion decision containing a natural reply and safe application actions.",
            strict: true,
            schema:
              companionDecisionSchema,
          },
        },
      });

    const rawOutput =
      response.output_text?.trim();

    if (!rawOutput) {
      throw new Error(
        "The AI gateway returned an empty response.",
      );
    }

    const parsedDecision =
      JSON.parse(rawOutput) as unknown;

    if (
      !isCompanionDecision(
        parsedDecision,
      )
    ) {
      throw new Error(
        "The AI gateway returned an invalid decision.",
      );
    }

    return NextResponse.json({
      decision: parsedDecision,
      stateReceived: state,
    });
  } catch (error) {
    console.error(
      "Smiling Monad gateway error:",
      error,
    );

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