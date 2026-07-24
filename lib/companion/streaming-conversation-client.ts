import {
  clearCompanionAccessTokenCache,
  readCompanionAccessToken,
} from "@/lib/auth/companion-access-token-cache";

import type {
  CompanionConversationMessage,
  CompanionGatewayRequest,
} from "@/lib/companion/gateway-client";

type StreamingConversationResult =
  | {
      completed: true;
      requiresAction: false;
      message: string;
    }
  | {
      completed: false;
      requiresAction: true;
      message: "";
    };

type GatewayErrorResponse = {
  error?: string;
};

const MAX_STREAMED_MESSAGE_CHARACTERS =
  8_000;

function hasActiveCompanionWork(
  state: CompanionGatewayRequest["state"],
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

async function readErrorMessage(
  response: Response,
): Promise<string> {
  try {
    const body =
      (await response.json()) as
        GatewayErrorResponse;

    if (
      typeof body.error === "string" &&
      body.error.trim()
    ) {
      return body.error.trim();
    }
  } catch {
    // The response was not JSON.
  }

  return `Kimi returned ${response.status}.`;
}

function createRequestBody({
  request,
  memory,
  conversation,
  state,
}: CompanionGatewayRequest) {
  return {
    request:
      request.trim(),

    memory:
      memory?.trim() ?? "",

    conversation:
      conversation ??
      ([] as CompanionConversationMessage[]),

    state: {
      hasActiveWork:
        hasActiveCompanionWork(
          state,
        ),

      workspaceOpen:
        state.workspaceOpen,
    },
  };
}

export async function streamCompanionConversation({
  input,
  onText,
  signal,
}: {
  input: CompanionGatewayRequest;
  onText: (
    completeMessage: string,
    newText: string,
  ) => void;
  signal?: AbortSignal;
}): Promise<StreamingConversationResult> {
  const requestText =
    input.request.trim();

  if (!requestText) {
    throw new Error(
      "A message is required before Kimi can respond.",
    );
  }

  const accessToken =
    await readCompanionAccessToken();

  const response =
    await fetch(
      "/api/gateway/conversation/stream",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },

        body:
          JSON.stringify(
            createRequestBody(
              input,
            ),
          ),

        signal,
      },
    );

  if (
    response.status === 409
  ) {
    return {
      completed:
        false,

      requiresAction:
        true,

      message:
        "",
    };
  }

  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      clearCompanionAccessTokenCache();
    }

    throw new Error(
      await readErrorMessage(
        response,
      ),
    );
  }

  if (!response.body) {
    throw new Error(
      "Kimi returned an empty response.",
    );
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let completeMessage =
    "";

  try {
    while (true) {
      const {
        done,
        value,
      } =
        await reader.read();

      if (done) {
        break;
      }

      const newText =
        decoder.decode(
          value,
          {
            stream: true,
          },
        );

      if (!newText) {
        continue;
      }

      completeMessage =
        (
          completeMessage +
          newText
        ).slice(
          0,
          MAX_STREAMED_MESSAGE_CHARACTERS,
        );

      onText(
        completeMessage,
        newText,
      );
    }

   _STREAMED_MESSAGE_CHARACTERS,
        );

      onText(
        completeMessage,
        newText,
      );
    }

    const finalText =
      decoder.decode();

    if (finalText) {
      completeMessage =
        (
          completeMessage +
          finalText
        ).slice(
          0,
          MAX_STREAMED_MESSAGE_CHARACTERS,
        );

      onText(
        completeMessage,
        finalText,
      );
    }
  } finally {
    reader.releaseLock();
  }

  const message =
    completeMessage.trim();

  if (!message) {
    throw new Error(
      "Kimi returned an empty response.",
    );
  }

  return {
    completed:
      true,

    requiresAction:
      false,

    message,
  };
}