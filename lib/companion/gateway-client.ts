import {
  executeCompanionActions,
  type CompanionDecision,
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
};

type CompanionGatewayResponse = {
  decision: CompanionDecision;
  stateReceived: CompanionState;
};

type CompanionGatewayErrorResponse = {
  error?: string;
};

export type CompanionGatewayResult = {
  decision: CompanionDecision;
  execution: ToolExecutionResult;
};

const isRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

const isStringOrNull = (
  value: unknown,
): value is string | null =>
  typeof value === "string" || value === null;

const isCompanionDecision = (
  value: unknown,
): value is CompanionDecision => {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.message !== "string" ||
    typeof value.reasoningSummary !== "string" ||
    typeof value.needsClarification !== "boolean" ||
    !isStringOrNull(value.clarificationQuestion) ||
    typeof value.requiresConfirmation !== "boolean" ||
    !Array.isArray(value.actions)
  ) {
    return false;
  }

  return value.actions.every((action) => {
    if (!isRecord(action)) {
      return false;
    }

    return (
      typeof action.tool === "string" &&
      isStringOrNull(action.targetId) &&
      isStringOrNull(action.title) &&
      isStringOrNull(action.kind) &&
      isStringOrNull(action.content) &&
      typeof action.reason === "string"
    );
  });
};

const readErrorMessage = async (
  response: Response,
): Promise<string> => {
  try {
    const body =
      (await response.json()) as CompanionGatewayErrorResponse;

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
};

export const requestCompanionDecision = async (
  input: CompanionGatewayRequest,
  signal?: AbortSignal,
): Promise<CompanionDecision> => {
  const requestText = input.request.trim();

  if (!requestText) {
    throw new Error(
      "A message is required before Kimi can make a decision.",
    );
  }

  const response = await fetch("/api/gateway", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      request: requestText,
      memory: input.memory?.trim() || "",
      conversation: input.conversation ?? [],
      state: input.state,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const body = (await response.json()) as unknown;

  if (!isRecord(body)) {
    throw new Error(
      "The Companion gateway returned an invalid response.",
    );
  }

  const decision = body.decision;

  if (!isCompanionDecision(decision)) {
    throw new Error(
      "The Companion gateway returned an invalid decision.",
    );
  }

  return decision;
};

export const runCompanionTurn = async (
  input: CompanionGatewayRequest,
  signal?: AbortSignal,
): Promise<CompanionGatewayResult> => {
  const decision = await requestCompanionDecision(
    input,
    signal,
  );

  if (
    decision.needsClarification ||
    decision.requiresConfirmation
  ) {
    return {
      decision,
      execution: {
        state: input.state,
        completedActions: [],
        failedActions: [],
      },
    };
  }

  const execution = executeCompanionActions(
    input.state,
    decision.actions,
  );

  return {
    decision,
    execution,
  };
};

export const getCompanionReply = (
  result: CompanionGatewayResult,
): string => {
  const { decision, execution } = result;

  if (
    decision.needsClarification &&
    decision.clarificationQuestion
  ) {
    return decision.clarificationQuestion;
  }

  if (decision.requiresConfirmation) {
    return decision.message;
  }

  if (execution.failedActions.length === 0) {
    return decision.message;
  }

  if (
    execution.completedActions.length === 0 &&
    execution.failedActions.length > 0
  ) {
    return [
      "I understood what you wanted, but I couldn’t complete the action.",
      execution.failedActions[0]?.error,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    decision.message,
    "Part of the action could not be completed.",
  ].join(" ");
};