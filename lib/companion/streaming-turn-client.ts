import {
  runCompanionTurn,
  type CompanionGatewayRequest,
  type CompanionGatewayResult,
} from "@/lib/companion/gateway-client";

import {
  streamCompanionConversation,
} from "@/lib/companion/streaming-conversation-client";

import type {
  CompanionDecision,
  ToolExecutionResult,
} from "@/lib/companion/tool-executor";

export const COMPANION_STREAM_EVENT =
  "smiling-monad-companion-stream";

export type CompanionStreamEventDetail = {
  status:
    | "started"
    | "streaming"
    | "completed"
    | "cleared";

  message: string;
};

function dispatchStreamEvent(
  detail: CompanionStreamEventDetail,
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<
      CompanionStreamEventDetail
    >(
      COMPANION_STREAM_EVENT,
      {
        detail,
      },
    ),
  );
}

function createConversationDecision(
  message: string,
): CompanionDecision {
  return {
    message,

    reasoningSummary:
      "Kimi responded through the natural streaming conversation path.",

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
          "No application action was required.",
      },
    ],
  };
}

function createConversationExecution(
  input: CompanionGatewayRequest,
): ToolExecutionResult {
  return {
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
  };
}

export function clearCompanionStream():
  void {
  dispatchStreamEvent({
    status:
      "cleared",

    message:
      "",
  });
}

export async function runCompanionTurnWithStreaming({
  input,
  onStreamText,
  signal,
}: {
  input:
    CompanionGatewayRequest;

  onStreamText?: (
    completeMessage: string,
    newText: string,
  ) => void;

  signal?:
    AbortSignal;
}): Promise<CompanionGatewayResult> {
  dispatchStreamEvent({
    status:
      "started",

    message:
      "",
  });

  try {
    const streamedResult =
      await streamCompanionConversation({
        input,

        onText: (
          completeMessage,
          newText,
        ) => {
          dispatchStreamEvent({
            status:
              "streaming",

            message:
              completeMessage,
          });

          onStreamText?.(
            completeMessage,
            newText,
          );
        },

        signal,
      });

    if (
      streamedResult.requiresAction
    ) {
      clearCompanionStream();

      return runCompanionTurn(
        input,
        signal,
      );
    }

    const message =
      streamedResult.message.trim();

    if (!message) {
      throw new Error(
        "Kimi returned an empty response.",
      );
    }

    dispatchStreamEvent({
      status:
        "completed",

      message,
    });

    return {
      decision:
        createConversationDecision(
          message,
        ),

      execution:
        createConversationExecution(
          input,
        ),
    };
  } catch (error) {
    clearCompanionStream();

    throw error;
  }
}