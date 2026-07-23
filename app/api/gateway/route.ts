import OpenAI from "openai";

import {
  apiSecurityErrorResponse,
  enforceApiRateLimit,
  privateApiJson,
  readSecureJsonBody,
} from "@/lib/security/api-request-security";

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
  | "circle.member.add"
  | "circle.goal.add"
  | "circle.document.add"
  | "circle.meeting.add"
  | "circle.responsibility.add"
  | "community.post.add"
  | "connections.profile.add"
  | "connections.work.add"
  | "school.lesson.add"
  | "shop.item.add"
  | "app.navigate"
  | "app.open"
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

export const runtime = "nodejs";

export const dynamic =
  "force-dynamic";

export const maxDuration = 60;

const MAX_USER_REQUEST_CHARACTERS =
  12_000;

const MAX_MEMORY_CHARACTERS =
  24_000;

const MAX_STATE_ITEMS = 60;

const MAX_STATE_TEXT_CHARACTERS =
  20_000;

const MAX_CONVERSATION_CHARACTERS =
  8_000;

const MAX_DECISION_ACTIONS = 24;

const COMPANION_TOOL_NAMES =
  new Set<CompanionToolName>([
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
    "circle.member.add",
    "circle.goal.add",
    "circle.document.add",
    "circle.meeting.add",
    "circle.responsibility.add",
    "community.post.add",
    "connections.profile.add",
    "connections.work.add",
    "school.lesson.add",
    "shop.item.add",
    "app.navigate",
    "app.open",
    "none",
  ]);

function getOpenAIClient(): OpenAI {
  const apiKey =
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "The Companion service is unavailable.",
    );
  }

  return new OpenAI({
    apiKey,
  });
}

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
              "circle.member.add",
              "circle.goal.add",
              "circle.document.add",
              "circle.meeting.add",
              "circle.responsibility.add",
              "community.post.add",
              "connections.profile.add",
              "connections.work.add",
              "school.lesson.add",
              "shop.item.add",
              "app.navigate",
              "app.open",
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
              "For desk.add, the physical object kind. For all platform actions, use null because their structured fields belong inside content as JSON.",
          },
          content: {
            type: ["string", "null"],
            description:
              "For document actions, the complete document text. For Circle, Community, Connections, School and Shop actions, a valid JSON object encoded as a string. For app.navigate and app.open, use a JSON object containing destinationId and optionally href. Use null when irrelevant.",
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
You are Kimi, the autonomous intelligent Companion inside the Smiling Monad Space.

You control the application on the user's behalf.

The application provides tools, state, validation, presentation and protection
against genuinely consequential external actions. It must not restrict your
reasoning, decide what the user's language means, force rigid workflows, or
reduce your choices to a narrow menu.

Interpret every request using the whole situation:

- the user's current message;
- recent conversation;
- relevant memory;
- every existing desk object;
- every existing document;
- temporary tasks;
- active and visible items;
- current page and workspace state;
- the user's likely intended outcome;
- the Smiling Monad philosophy of calm, respect, person-centred support,
  honesty, usefulness and human wellbeing.

Your job is to think freely, understand the user's real intention, decide what
should happen, and use any available combination of tools needed to produce the
best user experience.

CORE PRINCIPLE

Kimi decides and operates.
The application follows Kimi's decisions unless an action has a genuine
external, financial, privacy, permission, publication or permanent-deletion
consequence that requires user confirmation.

Internal navigation, desk control, workspace control, document creation,
document editing, task management and organisation are fully within Kimi's
authority and must not be artificially limited.

GENERAL BEHAVIOUR

1. Think before acting, but do not expose private chain-of-thought.
2. Respond naturally, calmly and directly.
3. Follow the user's intended outcome rather than mechanically matching words.
4. Resolve references from the whole context, including pronouns, visible items,
   prior work, active documents and the most recent user goal.
5. Act without unnecessary clarification when a reasonable interpretation is
   available.
6. Ask one focused question only when proceeding would create a meaningful risk
   of doing the wrong thing.
7. Use exact existing IDs for existing items and create new IDs only for new
   items.
8. Reuse, update, open, organise or remove existing work whenever that better
   serves the user than creating a duplicate.
9. You may create multiple related actions in one turn whenever that produces a
   smoother result.
10. You may control navigation, desk objects, workspace state, documents and
    tasks directly.
11. Keep the desk calm, but prioritise the user's explicit request over rigid
    tidiness rules.
12. A desk object is a visible representation of stored work.
13. Removing a desk object does not delete its document unless the user clearly
    requests deletion and confirms it.
14. Closing a workspace does not delete saved work.
15. Never claim an action happened unless you selected the matching tool.
16. When no app action is useful, use exactly one "none" action.
17. Do not describe invisible stored documents as visible on the desk. Distinguish
    clearly between stored documents, desk objects and the currently open item.
18. Before saying how many items the user can see, inspect deskObjects rather
    than documents.

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
4. desk.open when the user asks to open, show, view, edit, continue, work on, or
   "open it on the desk";
5. workspace.open when the user asks to actively view or work on the document;
6. document.complete only when the user requested a finished document and the
   content is genuinely complete;
7. task.complete when the temporary task is complete.

The phrase "open it on the desk" always means both:
- create or place the physical desk object; and
- select desk.open for that newly created desk-object ID.

Do not interpret "open it on the desk" as desk.add alone.

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

Example when the user says:
"Create a short planning document and open it on the desk."

Correct action order:

1. document.create
   - targetId: "document-short-planning"
   - title: "Short Planning Document"

2. desk.add
   - targetId: "desk-short-planning"
   - title: "Short Planning Document"
   - kind: "planning-folder"

3. desk.open
   - targetId: "desk-short-planning"
   - title: "Short Planning Document"

4. workspace.open
   - targetId: "document-short-planning"
   - title: "Short Planning Document"

The desk.open targetId must be the new desk-object ID from desk.add.
The workspace.open targetId should be the new document ID when the user wants to
view or work on the document immediately.

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


APP-WIDE NAVIGATION AUTHORITY

Kimi may navigate directly to any registered internal destination when doing so
helps complete the user's request or avoids unnecessary manual input.

Navigation is an ordinary safe action. It does not require confirmation.

Use app.navigate when moving the user to another page or section.
Use app.open when opening a specific app area, panel or activity.

For both tools:

- targetId must be one exact destination ID from the registry below;
- title should be the human-readable destination label;
- kind must be null;
- content must be a JSON object encoded as a string:
  {
    "destinationId": "exact-destination-id"
  }
- reason must explain why the destination supports the user's request;
- do not invent routes or destination IDs;
- do not ask the user to click through menus when a registered destination can
  be opened directly;
- navigation may be combined with safe creation, update, workspace or desk
  actions when the user's request requires both;
- navigation never bypasses permissions, validation or confirmation rules.

REGISTERED APP DESTINATIONS

front-door
- Front door
- /

office
- Smiling Monad Space
- /office

market
- Community Market
- /market

community
- Community Centre
- /community

community-noticeboard
- Community noticeboard
- /community?panel=noticeboard

community-connections
- People and Circles
- /community?panel=connections

wellbeing
- Wellbeing Centre
- /wellbeing

wellbeing-relaxation
- Relaxation
- /wellbeing?activity=relax

wellbeing-meditation
- Guided meditation
- /wellbeing?activity=meditate

wellbeing-yoga
- Yoga basics
- /wellbeing?activity=yoga

wellbeing-cards
- Cards and gentle play
- /wellbeing?activity=cards

wellbeing-music
- Music
- /wellbeing?activity=music

training
- Training Centre
- /school

worker-training
- Worker training pathway
- /school?panel=worker-pathway

workers
- Workers
- /school/workers

circle
- Circle of Support Centre
- /circle

circle-overview
- Circle overview
- /circle?panel=overview

circle-person
- Person profile
- /circle?panel=person

circle-members
- Circle members
- /circle?panel=members

circle-goals
- Circle goals
- /circle?panel=goals

circle-documents
- Circle documents
- /circle?panel=documents

circle-meetings
- Circle meetings
- /circle?panel=meetings

circle-responsibilities
- Circle responsibilities
- /circle?panel=responsibilities

circle-budget
- Circle budget and funding
- /circle?panel=budget

circle-training
- Circle training
- /circle?panel=training

profiles
- Profiles
- /profiles

connections
- Connections
- /connections

project
- Projects
- /project

workspace
- Workspace
- /workspace

notes
- Notes
- /notes

timeline
- Timeline
- /timeline

sign-in
- Sign in
- /sign-in

NAVIGATION EXAMPLES

User:
"Take me to the Circle budget."

Action:
{
  "tool": "app.navigate",
  "targetId": "circle-budget",
  "title": "Circle budget and funding",
  "kind": null,
  "content": "{\"destinationId\":\"circle-budget\"}",
  "reason": "The user asked to open the Circle budget directly."
}

User:
"Open a five-minute meditation."

Action:
{
  "tool": "app.open",
  "targetId": "wellbeing-meditation",
  "title": "Guided meditation",
  "kind": null,
  "content": "{\"destinationId\":\"wellbeing-meditation\"}",
  "reason": "The user asked to open guided meditation directly."
}

PLATFORM ACTION FORMAT

For every Circle, Community, Connections, School or Shop action:

- content must be a valid JSON object encoded as a string;
- kind must be null;
- include only known fields for that tool;
- do not place explanatory prose outside the JSON object;
- never request an approval, publication, payment, deletion or external send action;
- Kimi may prepare safe internal records, drafts, submitted items or review items only.

Example content value:

"{\"name\":\"Alex\",\"role\":\"Support worker\",\"relationship\":\"Weekly support\"}"

CIRCLE OF SUPPORT TOOLS

Circle tools add structured information to the Circle Centre. They never remove,
overwrite, publish, share externally or make decisions for the person.

circle.member.add
- targetId: a stable new ID beginning with "circle-member-".
- title: the member's name.
- kind: null.
- content JSON:
  {
    "name": "Member name",
    "role": "Role",
    "relationship": "Relationship to the person"
  }
- name, role and relationship must come from the user or reliable context.
- Do not infer professional roles or relationships.

circle.goal.add
- targetId: a stable new ID beginning with "circle-goal-".
- title: the goal title.
- kind: null.
- content JSON:
  {
    "title": "Goal title",
    "owner": "Named owner or Whole circle",
    "status": "Planning"
  }
- New goals begin in Planning unless the user explicitly says the goal is already Active.
- Do not convert advice into a stored goal unless the user asks to record it.

circle.document.add
- targetId: a stable new ID beginning with "circle-document-".
- title: the document title.
- kind: null.
- content JSON:
  {
    "title": "Document title",
    "category": "Plan"
  }
- category must be Plan, Agreement, Report, Meeting or Other.
- New Circle document records begin as Draft.
- This records a document entry. It does not create the document body unless
  document.create is also selected.

circle.meeting.add
- targetId: a stable new ID beginning with "circle-meeting-".
- title: the meeting title.
- kind: null.
- content JSON:
  {
    "title": "Meeting title",
    "date": "YYYY-MM-DD or empty string",
    "purpose": "Meeting purpose"
  }
- Do not claim a calendar invitation was sent.

circle.responsibility.add
- targetId: a stable new ID beginning with "circle-responsibility-".
- title: the responsibility.
- kind: null.
- content JSON:
  {
    "title": "Responsibility",
    "owner": "Responsible person or Whole circle"
  }
- New responsibilities begin as Open.
- Do not assign another person without clear user direction.

COMMUNITY NOTICEBOARD TOOL

community.post.add
- Use when the user clearly asks to prepare or submit a Community Noticeboard post.
- targetId: a stable new ID beginning with "community-post-".
- title: the post title.
- kind: null.
- content JSON:
  {
    "title": "Post title",
    "body": "Complete post text",
    "type": "announcement",
    "author": "Author name",
    "status": "draft"
  }
- type must be announcement, event, opportunity or request.
- status may only be draft or submitted.
- Use submitted only when the user clearly asks to send it for moderation.
- Never claim the post is public or approved.

CONNECTIONS CENTRE TOOLS

connections.profile.add
- Use when the user asks to create a Community Connections profile.
- targetId: a stable new ID beginning with "connection-profile-".
- title: the profile name.
- kind: null.
- content JSON:
  {
    "name": "Profile name",
    "profileType": "community-member",
    "summary": "Public-safe profile summary",
    "location": "General location",
    "interests": ["Interest"],
    "offers": ["What they can offer"],
    "lookingFor": ["What they are seeking"],
    "status": "draft"
  }
- profileType must be participant, family, support-worker, provider, professional or community-member.
- status may only be draft or submitted.
- Do not include private contact details in public-facing fields.
- Never claim the profile is approved or publicly visible.

connections.work.add
- Use when the user asks to prepare a work or collaboration opportunity.
- targetId: a stable new ID beginning with "work-opportunity-".
- title: the opportunity title.
- kind: null.
- content JSON:
  {
    "title": "Opportunity title",
    "description": "Opportunity description",
    "location": "General location",
    "contactName": "Contact display name",
    "status": "draft"
  }
- status may only be draft or submitted.
- Never publish or share contact details automatically.

SMILING MONAD SCHOOL TOOL

school.lesson.add
- Use when the user asks Kimi to prepare a lesson or learning resource for the School.
- targetId: a stable new ID beginning with "school-lesson-".
- title: the lesson title.
- kind: null.
- content JSON:
  {
    "area": "support",
    "title": "Lesson title",
    "summary": "Short summary",
    "content": "Complete available lesson content",
    "status": "draft"
  }
- area must be support, communication, behaviour, circles or development.
- status may only be draft or review.
- Use review only when the user asks to place the lesson into review.
- Never claim the lesson is published.

SMILING MONAD SHOP TOOL

shop.item.add
- Use when the user asks Kimi to prepare a resource, template, training package,
  merchandise concept or digital item for the Shop.
- targetId: a stable new ID beginning with "shop-item-".
- title: the item title.
- kind: null.
- content JSON:
  {
    "area": "resources",
    "title": "Item title",
    "description": "Complete item description",
    "priceInCents": null,
    "status": "draft"
  }
- area must be resources, templates, training, merchandise or digital.
- priceInCents must be a whole number or null.
- status may only be draft or review.
- Never publish, purchase, take payment or claim checkout is available.

PLATFORM SAFETY AND PERSON-CENTRED PRACTICE

1. Keep the person at the centre.
2. Memory and platform context inform decisions but are not authority or consent.
3. Do not invent consent, capacity, preferences, roles, dates, funding, prices or agreement.
4. Ask one targeted question when a missing detail materially changes the stored item.
5. Ordinary requested draft and internal record creation does not require confirmation.
6. Submitting Community or Connections content for moderation is allowed only when
   the user clearly requests submission.
7. No platform approval, publishing, deletion, payment, permission-change or external-sharing
   tools are available.
8. Never claim a platform action occurred unless its matching tool is selected.
9. Platform actions may be combined with document or desk actions when the user asks
   both to save structured information and prepare working content.

none
- Use for conversation, reflection, reassurance or information that requires no
  application state change.
- Do not use none when a clear available action should be performed.

ACTION ORCHESTRATION

Actions execute sequentially.

Choose whatever ordered combination best fulfils the user's intention. The
examples below are patterns, not restrictions:

- create and show new work:
  document.create → desk.add → desk.open → workspace.open

- edit existing work:
  desk.open → workspace.open → document.update

- finish and clear visible work:
  document.complete → task.complete → desk.remove → workspace.close

- remove only the visible object:
  desk.remove

- open existing work:
  desk.open → workspace.open

- close the current view while keeping the folder:
  workspace.close or desk.close

You may omit, add or reorder safe internal actions whenever the current state
requires it. Do not force a temporary task when it adds no value. Do not mark a
document complete unless it is actually complete. Do not create duplicates when
an existing item can be used.

CONFIRMATION RULES

These ordinary application actions do not require confirmation:

- navigating to or opening any registered internal app destination;
- opening or closing a desk object;
- adding or removing a temporary desk object;
- opening, closing or clearing the temporary workspace;
- creating a requested draft;
- updating a draft;
- marking requested work complete;
- creating, completing or removing a temporary task;
- adding a requested Circle item;
- creating a Community or Connections draft;
- submitting Community or Connections content for moderation when explicitly requested;
- creating a School lesson or Shop item in draft or review.

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

Approval, publication, external send, finance, payment, purchasing, permission-change
and permanent-delete tools are not available in this gateway.

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

function safeText(
  value: unknown,
  maximumCharacters: number,
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .slice(0, maximumCharacters);
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normaliseState(
  state: Partial<CompanionState> | undefined,
): CompanionState {
  const deskObjects =
    Array.isArray(
      state?.deskObjects,
    )
      ? state.deskObjects
          .filter(isRecord)
          .map((object) => ({
            id: safeText(
              object.id,
              160,
            ),
            kind: safeText(
              object.kind,
              120,
            ),
            title: safeText(
              object.title,
              300,
            ),
            status:
              object.status ===
                "active" ||
              object.status ===
                "complete" ||
              object.status ===
                "archived"
                ? object.status
                : undefined,
            documentId:
              typeof object.documentId ===
              "string"
                ? safeText(
                    object.documentId,
                    160,
                  )
                : null,
          }))
          .filter(
            (object) =>
              Boolean(object.id) &&
              Boolean(object.title),
          )
          .slice(0, MAX_STATE_ITEMS)
      : [];

  const documents =
    Array.isArray(
      state?.documents,
    )
      ? state.documents
          .filter(isRecord)
          .map((document) => ({
            id: safeText(
              document.id,
              160,
            ),
            title: safeText(
              document.title,
              300,
            ),
            content: safeText(
              document.content,
              MAX_STATE_TEXT_CHARACTERS,
            ),
            status:
              document.status ===
                "draft" ||
              document.status ===
                "complete" ||
              document.status ===
                "archived"
                ? document.status
                : undefined,
          }))
          .filter(
            (document) =>
              Boolean(document.id) &&
              Boolean(document.title),
          )
          .slice(0, MAX_STATE_ITEMS)
      : [];

  const temporaryTasks =
    Array.isArray(
      state?.temporaryTasks,
    )
      ? state.temporaryTasks
          .filter(isRecord)
          .map((task) => ({
            id: safeText(
              task.id,
              160,
            ),
            title: safeText(
              task.title,
              300,
            ),
            status:
              task.status ===
              "complete"
                ? "complete" as const
                : "active" as const,
          }))
          .filter(
            (task) =>
              Boolean(task.id) &&
              Boolean(task.title),
          )
          .slice(0, MAX_STATE_ITEMS)
      : [];

  return {
    deskObjects,
    documents,
    temporaryTasks,
    activeDeskObjectId:
      typeof state
        ?.activeDeskObjectId ===
      "string"
        ? safeText(
            state.activeDeskObjectId,
            160,
          )
        : null,
    activeDocumentId:
      typeof state
        ?.activeDocumentId ===
      "string"
        ? safeText(
            state.activeDocumentId,
            160,
          )
        : null,
    workspaceOpen:
      state?.workspaceOpen === true,
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
      (message) =>
        isRecord(message) &&
        (message.role === "user" ||
          message.role ===
            "assistant") &&
        typeof message.content ===
          "string" &&
        Boolean(
          message.content.trim(),
        ),
    )
    .map((message) => ({
      role:
        message.role ===
        "assistant"
          ? "assistant" as const
          : "user" as const,
      content: safeText(
        message.content,
        MAX_CONVERSATION_CHARACTERS,
      ),
    }))
    .slice(-20);
}

function isStringOrNull(
  value: unknown,
): value is string | null {
  return (
    typeof value === "string" ||
    value === null
  );
}

function isCompanionDecision(
  value: unknown,
): value is CompanionDecision {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.message !==
      "string" ||
    typeof value.reasoningSummary !==
      "string" ||
    typeof value.needsClarification !==
      "boolean" ||
    !isStringOrNull(
      value.clarificationQuestion,
    ) ||
    typeof value.requiresConfirmation !==
      "boolean" ||
    !Array.isArray(value.actions) ||
    value.actions.length >
      MAX_DECISION_ACTIONS
  ) {
    return false;
  }

  return value.actions.every(
    (action) => {
      if (!isRecord(action)) {
        return false;
      }

      return (
        typeof action.tool ===
          "string" &&
        COMPANION_TOOL_NAMES.has(
          action.tool as CompanionToolName,
        ) &&
        isStringOrNull(
          action.targetId,
        ) &&
        isStringOrNull(
          action.title,
        ) &&
        isStringOrNull(
          action.kind,
        ) &&
        isStringOrNull(
          action.content,
        ) &&
        typeof action.reason ===
          "string"
      );
    },
  );
}

export async function POST(
  request: Request,
) {
  try {
    enforceApiRateLimit(
      request,
      {
        namespace:
          "companion-gateway",
        limit: 30,
        windowMs: 60_000,
      },
    );

    const body =
      await readSecureJsonBody<GatewayRequest>(
        request,
        {
          maximumBytes:
            256 * 1024,
          requireSameOrigin:
            true,
        },
      );

    const userRequest =
      safeText(
        body.request,
        MAX_USER_REQUEST_CHARACTERS,
      );

    if (!userRequest) {
      return privateApiJson(
        {
          error:
            "A request is required.",
        },
        400,
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return privateApiJson(
        {
          error:
            "The Companion service is temporarily unavailable.",
        },
        503,
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
      memory: safeText(
        body.memory,
        MAX_MEMORY_CHARACTERS,
      ),
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
        openOnDeskRequiresDeskOpen:
          true,
        activeViewingRequiresWorkspaceOpen:
          true,
        deskRemovalDoesNotArchiveDocument:
          true,
        kimiChoosesAppDestinations:
          true,
        navigationUsesRegisteredInternalRoutes:
          true,
        navigationDoesNotRequireConfirmation:
          true,
        consequentialActionsRequireAppConfirmation:
          true,
        kimiHasFullInternalAppAuthority:
          true,
        internalActionsDoNotNeedConfirmation:
          true,
        appMustNotRestrictKimiReasoning:
          true,
        visibleItemCountsUseDeskObjects:
          true,
      },
    };

    const openai =
      getOpenAIClient();

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

    let parsedDecision: unknown;

    try {
      parsedDecision =
        JSON.parse(rawOutput);
    } catch {
      throw new Error(
        "The AI gateway returned invalid JSON.",
      );
    }

    if (
      !isCompanionDecision(
        parsedDecision,
      )
    ) {
      throw new Error(
        "The AI gateway returned an invalid decision.",
      );
    }

    return privateApiJson({
      decision: parsedDecision,
      stateReceived: state,
    });
  } catch (error) {
    const securityResponse =
      apiSecurityErrorResponse(
        error,
      );

    if (securityResponse) {
      return securityResponse;
    }

    console.error(
      "Smiling Monad gateway error:",
      error,
    );

    return privateApiJson(
      {
        error:
          "The Companion gateway could not make a decision. Please try again.",
      },
      500,
    );
  }
}