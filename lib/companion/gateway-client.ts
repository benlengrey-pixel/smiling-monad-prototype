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

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

export type CompanionConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CompanionGatewayRequest = {
  request: string;
  memory?: string;
  conversation?:
    CompanionConversationMessage[];
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

const isRecord = (
  value: unknown,
): value is Record<
  string,
  unknown
> =>
  typeof value ===
    "object" &&
  value !== null &&
  !Array.isArray(
    value,
  );

const isStringOrNull = (
  value: unknown,
): value is string | null =>
  typeof value ===
    "string" ||
  value === null;

const isCompanionDecision = (
  value: unknown,
): value is CompanionDecision => {
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
    !Array.isArray(
      value.actions,
    )
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
};

const readErrorMessage = async (
  response: Response,
): Promise<string> => {
  try {
    const body =
      (await response.json()) as
        CompanionGatewayErrorResponse;

    if (
      typeof body.error ===
        "string" &&
      body.error.trim()
    ) {
      return body.error;
    }
  } catch {
    // The response was not valid JSON.
  }

  return `The Companion gateway returned ${response.status}.`;
};

const readCompanionAccessToken =
  async (): Promise<string> => {
    const supabase =
      getSupabaseBrowserClient();

    const {
      data: {
        session,
      },
      error,
    } =
      await supabase.auth.getSession();

    if (error) {
      throw new Error(
        "Your sign-in session could not be checked.",
      );
    }

    const accessToken =
      session?.access_token
        ?.trim() ?? "";

    if (!accessToken) {
      throw new Error(
        "Please sign in before using Kimi.",
      );
    }

    return accessToken;
  };

const createGatewayHeaders = (
  accessToken: string,
): HeadersInit => ({
  "Content-Type":
    "application/json",

  Authorization:
    `Bearer ${accessToken}`,
});

const hasActiveCompanionWork = (
  state: CompanionState,
): boolean =>
  Boolean(
    state.activeDeskObjectId ||
    state.activeDocumentId ||
    state.workspaceOpen ||
    state.temporaryTasks.some(
      (task) =>
        task.status ===
        "active",
    ),
  );

const requestFastConversationDecision =
  async ({
    input,
    accessToken,
    signal,
  }: {
    input:
      CompanionGatewayRequest;
    accessToken: string;
    signal?: AbortSignal;
  }): Promise<
    CompanionDecision | null
  > => {
    const response =
      await fetch(
        "/api/gateway/conversation",
        {
          method:
            "POST",

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
                input.conversation ??
                [],

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
        response.status ===
          401 ||
        response.status ===
          403
      ) {
        throw new Error(
          await readErrorMessage(
            response,
          ),
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
      fastBody.requiresAction ===
      true
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
  };

const requestFullCompanionDecision =
  async ({
    input,
    accessToken,
    signal,
  }: {
    input:
      CompanionGatewayRequest;
    accessToken: string;
    signal?: AbortSignal;
  }): Promise<
    CompanionDecision
  > => {
    const response =
      await fetch(
        "/api/gateway",
        {
          method:
            "POST",

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
                input.conversation ??
                [],

              state:
                input.state,
            }),

          signal,
        },
      );

    if (!response.ok) {
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
  };

export const requestCompanionDecision =
  async (
    input:
      CompanionGatewayRequest,
    signal?: AbortSignal,
  ): Promise<
    CompanionDecision
  > => {
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
            input.state
              .workspaceOpen,
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
  };

export const runCompanionTurn =
  async (
    input:
      CompanionGatewayRequest,
    signal?: AbortSignal,
  ): Promise<
    CompanionGatewayResult
  > => {
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

        /*
         * Navigation is returned as
         * execution metadata.
         *
         * The Office performs the
         * visual route change with
         * Next.js.
         */
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
  };

export const getCompanionReply = (
  result:
    CompanionGatewayResult,
): string => {
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
    pendingConfirmationCount >
    0
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
};