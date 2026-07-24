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
  const streamedResult =
    await streamCompanionConversation({
      input,

      onText: (
        completeMessage,
        newText,
      ) => {
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
}