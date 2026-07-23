import {
  clearCompanionAccessTokenCache,
  readCompanionAccessToken,
} from "@/lib/auth/companion-access-token-cache";

import {
  chooseCompanionInteractionMode,
} from "@/lib/companion/fast-interaction";

import {
  executeCompanionActions,
  type CompanionDecision,
  type CompanionExecutionContext,
  type CompanionPermission,
  type CompanionState,
  type ToolExecutionResult,
} from "@/lib/companion/tool-executor";

export type CompanionConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CompanionGatewayRequest = {
  request: string;
  memory?: string;
  conversation?: CompanionConversationMessage[];
  state: CompanionState;
  confirmedActionKeys?: string[];
};

type CompanionGatewayErrorResponse = {
  error?: string;
};

type FastGatewayResponse = {
  requiresAction?: boolean;
  decision?: unknown;
};

export type CompanionGatewayResult = {
  decision: CompanionDecision;
  execution: ToolExecutionResult;
};

const OFFICE_COMPANION_PERMISSIONS:
  CompanionPermission[] = [
    "navigate",
    "read",
    "create",
    "update",
    "publish",
    "delete",
    "manage-access",
    "financial",
  ];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
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
    typeof value.message !== "string" ||
    typeof value.reasoningSummary !==
      "string" ||
    typeof value.needsClarification !==
      "boolean" ||
    !isStringOrNull(
      value.clarificationQuestion,
    ) ||
    typeof value.requiresConfirmation !==
      "boolean" ||
    !Array.isArray(value.actions)
  ) {
    return false;
  }

  return value.actions.every(
    (action) => {
      if (!isRecord(action)) {
        return false;
      }

      return (
        typeof action.tool === "string" &&
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
        typeof action.reason === "string"
      );
    },
  );
}

async function readErrorMessage(
  response: Response,
): Promise<string> {
  try {
    const body =
      (await response.json()) as
        CompanionGatewayErrorResponse;

    if (
      typeof body.error === "string" &&
      body.error.trim()
    ) {
      return body.error;
    }
  } catch {
    // The response was not valid JSON.
  }

  return `The Companion gateway returned ${response.status}.`;
}

function createGatewayHeaders(
  accessToken: string,
): HeadersInit {
  return {
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${accessToken}`,
  };
}

function hasActiveCompanionWork(
  state: CompanionState,
): boolean {
  return Boolean(
    state.activeDeskObjectId ||
    state.activeDocumentId ||
    state.workspaceOpen ||
    state.temporaryTasks.some(
      (task) =>
        task.status === "active",
    ),
  );
}

async function handleAuthenticationFailure(
  response: Response,
): Promise<never> {
  clearCompanionAccessTokenCache();

  throw new Error(
    await readErrorMessage(
      response,
    ),
  );
}

async function requestFastConversationDecision({
  input,
  accessToken,
  signal,
}: {
  input: CompanionGatewayRequest;
  accessToken: string;
  signal?: AbortSignal;
}): Promise<CompanionDecision | null> {
  const response =
    await fetch(
      "/api/gateway/conversation",
      {
        method: "POST",

        headers:
          createGatewayHeaders(
            accessToken,
          ),

        body:
          JSON.stringify({
            request:
              input.request.trim(),

            memory:
              input.memory?.trim() ||
              "",

            conversation:
              input.conversation ?? [],

            state: {
              hasActiveWork:
                hasActiveCompanionWork(
                  input.state,
                ),

              workspaceOpen:
                input.state
                  .workspaceOpen,
            },
          }),

        signal,
      },
    );

  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      return handleAuthenticationFailure(
        response,
      );
    }

    return null;
  }

  const body =
    (await response.json()) as
      unknown;

  if (!isRecord(body)) {
    return null;
  }

  const fastBody =
    body as FastGatewayResponse;

  if (
    fastBody.requiresAction === true
  ) {
    return null;
  }

  if (
    !isCompanionDecision(
      fastBody.decision,
    )
  ) {
    return null;
  }

  return fastBody.decision;
}

async function requestFullCompanionDecision({
  input,
  accessToken,
  signal,
}: {
  input: CompanionGatewayRequest;
  accessToken: string;
  signal?: AbortSignal;
}): Promise<CompanionDecision> {
  const response =
    await fetch(
      "/api/gateway",
      {
        method: "POST",

        headers:
          createGatewayHeaders(
            accessToken,
          ),

        body:
          JSON.stringify({
            request:
              input.request.trim(),

            memory:
              input.memory?.trim() ||
              "",

            conversation:
              input.conversation ?? [],

            state:
              input.state,
          }),

        signal,
      },
    );

  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      return handleAuthenticationFailure(
        response,
      );
    }

    throw new Error(
      await readErrorMessage(
        response,
      ),
    );
  }

  const body =
    (await response.json()) as
      unknown;

  if (!isRecord(body)) {
    throw new Error(
      "The Companion gateway returned an invalid response.",
    );
  }

  const decision =
    body.decision;

  if (
    !isCompanionDecision(
      decision,
    )
  ) {
    throw new Error(
      "The Companion gateway returned an invalid decision.",
    );
  }

  return decision;
}

export async function requestCompanionDecision(
  input: CompanionGatewayRequest,
  signal?: AbortSignal,
): Promise<CompanionDecision> {
  const requestText =
    input.request.trim();

  if (!requestText) {
    throw new Error(
      "A message is required before Kimi can make a decision.",
    );
  }

  const accessToken =
    await readCompanionAccessToken();

  const interactionMode =
    chooseCompanionInteractionMode({
      request:
        requestText,

      state: {
        hasActiveWork:
          hasActiveCompanionWork(
            input.state,
          ),

        workspaceOpen:
          input.state.workspaceOpen,
      },
    });

  if (
    interactionMode ===
    "conversation"
  ) {
    const fastDecision =
      await requestFastConversationDecision({
        input,
        accessToken,
        signal,
      });

    if (fastDecision) {
      return fastDecision;
    }
  }

  return requestFullCompanionDecision({
    input,
    accessToken,
    signal,
  });
}

export async function runCompanionTurn(
  input: CompanionGatewayRequest,
  signal?: AbortSignal,
): Promise<CompanionGatewayResult> {
  const decision =
    await requestCompanionDecision(
      input,
      signal,
    );

  if (
    decision.needsClarification
  ) {
    return {
      decision,

      execution: {
        state:
          input.state,

        completedActions:
          [],

        pendingConfirmationActions:
          [],

        failedActions:
          [],

        navigation:
          null,
      },
    };
  }

  const executionContext:
    CompanionExecutionContext = {
      permissions:
        OFFICE_COMPANION_PERMISSIONS,

      confirmedActionKeys:
        input.confirmedActionKeys ??
        [],

      navigate:
        () => undefined,
    };

  const execution =
    executeCompanionActions(
      input.state,
      decision.actions,
      executionContext,
    );

  return {
    decision,
    execution,
  };
}

export function getCompanionReply(
  result: CompanionGatewayResult,
): string {
  const {
    decision,
    execution,
  } = result;

  if (
    decision.needsClarification &&
    decision.clarificationQuestion
  ) {
    return (
      decision
        .clarificationQuestion
    );
  }

  const pendingConfirmationCount =
    execution
      .pendingConfirmationActions
      ?.length ?? 0;

  if (
    pendingConfirmationCount > 0
  ) {
    return decision.message;
  }

  if (
    execution.failedActions
      .length === 0
  ) {
    return decision.message;
  }

  const firstFailure =
    execution.failedActions[0]
      ?.error ||
    "The action could not be completed.";

  if (
    execution.completedActions
      .length === 0
  ) {
    return [
      "I understood what you wanted, but I couldn’t complete it.",
      firstFailure,
    ].join(" ");
  }

  return [
    "I completed part of the task, then stopped so I would not leave the Space in an inconsistent state.",
    firstFailure,
  ].join(" ");
}