import type {
  CompanionDecision,
} from "@/lib/companion/tool-executor";

const MAX_FAST_REQUEST_CHARACTERS =
  8_000;

const MAX_FAST_MEMORY_CHARACTERS =
  6_000;

const MAX_FAST_MESSAGE_CHARACTERS =
  4_000;

const MAX_FAST_CONVERSATION_MESSAGES =
  8;

const MAX_FAST_CONVERSATION_MESSAGE_CHARACTERS =
  1_500;

export type CompanionInteractionMode =
  | "conversation"
  | "action";

export type FastConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type FastInteractionState = {
  hasActiveWork?: boolean;
  workspaceOpen?: boolean;
};

export type FastConversationInput = {
  request: string;
  relevantMemory: string;
  recentConversation:
    FastConversationMessage[];
};

export type FastConversationResponse = {
  message: string;
  requiresAction: boolean;
};

const ACTION_VERB_PATTERN =
  /\b(add|archive|attach|book|change|clear|close|complete|create|delete|draft|edit|finish|forward|generate|hide|invite|make|move|open|organise|organize|post|publish|remove|rename|replace|save|schedule|send|share|show|start|submit|update|upload|write)\b/i;

const APP_CONTROL_PATTERN =
  /\b(app|calendar|circle|community|desk|document|file|folder|goal|invitation|market|meeting|member|noticeboard|office|page|profile|report|screen|service|shop|task|training|workspace)\b/i;

const NAVIGATION_PATTERN =
  /\b(go to|head to|navigate to|open the|show me|take me to|bring up|return to)\b/i;

const CONSEQUENTIAL_ACTION_PATTERN =
  /\b(approve|decline|delete|financial|invite|permission|publish|remove access|send|share|submit|transfer)\b/i;

const PERSISTENT_WORK_PATTERN =
  /\b(assessment|document|email|folder|form|letter|meeting notes|plan|report|shift report|template)\b/i;

const CONTEXTUAL_ACTION_PATTERN =
  /\b(change it|close it|complete it|delete it|edit it|finish it|fix it|move it|open it|remove it|save it|send it|show it|update it)\b/i;

const ACTIVE_STATE_QUESTION_PATTERN =
  /\b(how many|what is|what's|what are|where is|where's|which)\b.*\b(active|desk|document|folder|open|task|workspace)\b/i;

export const fastConversationResponseSchema = {
  type: "object",

  additionalProperties: false,

  properties: {
    message: {
      type: "string",

      description:
        "Kimi's natural, direct response to the user.",
    },

    requiresAction: {
      type: "boolean",

      description:
        "True when the request needs application tools, navigation, persistent work, sharing, scheduling, access changes or another consequential action.",
    },
  },

  required: [
    "message",
    "requiresAction",
  ],
} as const;

function cleanText(
  value: unknown,
  maximumCharacters: number,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .replace(
      /\s+/g,
      " ",
    )
    .slice(
      0,
      maximumCharacters,
    );
}

function cleanConversation(
  conversation:
    | FastConversationMessage[]
    | undefined,
): FastConversationMessage[] {
  if (
    !Array.isArray(
      conversation,
    )
  ) {
    return [];
  }

  return conversation
    .filter(
      (
        message,
      ): message is FastConversationMessage =>
        (
          message?.role ===
            "user" ||
          message?.role ===
            "assistant"
        ) &&
        typeof message.content ===
          "string" &&
        Boolean(
          message.content.trim(),
        ),
    )
    .slice(
      -MAX_FAST_CONVERSATION_MESSAGES,
    )
    .map(
      (
        message,
      ): FastConversationMessage => ({
        role:
          message.role,

        content:
          cleanText(
            message.content,
            MAX_FAST_CONVERSATION_MESSAGE_CHARACTERS,
          ),
      }),
    );
}

export function chooseCompanionInteractionMode({
  request,
  state = {},
}: {
  request: string;
  state?: FastInteractionState;
}): CompanionInteractionMode {
  const cleanRequest =
    cleanText(
      request,
      MAX_FAST_REQUEST_CHARACTERS,
    );

  if (!cleanRequest) {
    return "action";
  }

  if (
    CONSEQUENTIAL_ACTION_PATTERN.test(
      cleanRequest,
    )
  ) {
    return "action";
  }

  if (
    NAVIGATION_PATTERN.test(
      cleanRequest,
    ) &&
    APP_CONTROL_PATTERN.test(
      cleanRequest,
    )
  ) {
    return "action";
  }

  if (
    ACTION_VERB_PATTERN.test(
      cleanRequest,
    ) &&
    (
      APP_CONTROL_PATTERN.test(
        cleanRequest,
      ) ||
      PERSISTENT_WORK_PATTERN.test(
        cleanRequest,
      )
    )
  ) {
    return "action";
  }

  if (
    state.hasActiveWork &&
    CONTEXTUAL_ACTION_PATTERN.test(
      cleanRequest,
    )
  ) {
    return "action";
  }

  if (
    (
      state.hasActiveWork ||
      state.workspaceOpen
    ) &&
    ACTIVE_STATE_QUESTION_PATTERN.test(
      cleanRequest,
    )
  ) {
    return "action";
  }

  return "conversation";
}

export function buildFastConversationInstructions():
  string {
  return `
You are Kimi, the intelligent Companion inside the Smiling Monad Space.

Speak naturally, warmly and directly.

This is the fast conversation path. Do not create an application action merely
because a tool exists.

Answer the user directly when they are:
- talking naturally;
- asking a question;
- thinking something through;
- seeking perspective, reassurance or support;
- exploring an idea;
- asking for an explanation;
- continuing an ordinary conversation.

Keep replies concise unless the user clearly asks for detail.

Set requiresAction to true only when the request needs:
- controlling or navigating the application;
- creating, editing, opening, closing, saving or deleting persistent work;
- operating on a desk object, document, task, Circle, calendar or other app item;
- sending, publishing, sharing, inviting or changing access;
- scheduling or performing another consequential external action.

When requiresAction is true:
- do not pretend the action has happened;
- give a short natural acknowledgement;
- do not list technical routing details.

When requiresAction is false:
- answer completely and naturally;
- do not mention tools, schemas, routing or the fast path;
- do not force the user into a workflow.
`.trim();
}

export function buildFastConversationInput({
  request,
  memory,
  conversation,
}: {
  request: string;
  memory?: string;
  conversation?:
    FastConversationMessage[];
}): FastConversationInput {
  return {
    request:
      cleanText(
        request,
        MAX_FAST_REQUEST_CHARACTERS,
      ),

    relevantMemory:
      cleanText(
        memory,
        MAX_FAST_MEMORY_CHARACTERS,
      ),

    recentConversation:
      cleanConversation(
        conversation,
      ),
  };
}

export function isFastConversationResponse(
  value: unknown,
): value is FastConversationResponse {
  if (
    typeof value !==
      "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const candidate =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof candidate.message ===
      "string" &&
    Boolean(
      candidate.message.trim(),
    ) &&
    typeof candidate.requiresAction ===
      "boolean"
  );
}

export function createFastConversationDecision(
  response:
    FastConversationResponse,
): CompanionDecision {
  const message =
    cleanText(
      response.message,
      MAX_FAST_MESSAGE_CHARACTERS,
    );

  if (!message) {
    throw new Error(
      "Kimi returned an empty conversation response.",
    );
  }

  return {
    message,

    reasoningSummary:
      "A natural conversation response did not require an application action.",

    needsClarification:
      false,

    clarificationQuestion:
      null,

    requiresConfirmation:
      false,

    actions: [
      {
        tool:
          "none",

        targetId:
          null,

        title:
          null,

        kind:
          null,

        content:
          null,

        reason:
          "No application action was needed for this conversation.",
      },
    ],
  };
}