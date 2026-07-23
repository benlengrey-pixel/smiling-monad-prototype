import OpenAI from "openai";

import {
  buildFastConversationInput,
  buildFastConversationInstructions,
  chooseCompanionInteractionMode,
  createFastConversationDecision,
  fastConversationResponseSchema,
  isFastConversationResponse,
  type FastConversationMessage,
  type FastInteractionState,
} from "@/lib/companion/fast-interaction";

import {
  isApiAuthenticationError,
  requireAuthenticatedApiUser,
} from "@/lib/security/api-user-auth";

import {
  apiSecurityErrorResponse,
  enforceApiRateLimit,
  privateApiJson,
  readSecureJsonBody,
} from "../../../../lib/security/api-request-security";

type FastConversationRequest = {
  request: string;
  memory?: string;
  conversation?:
    FastConversationMessage[];
  state?: FastInteractionState;
};

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const maxDuration =
  30;

let cachedOpenAIClient:
  OpenAI | null = null;

function getOpenAIClient():
  OpenAI {
  if (cachedOpenAIClient) {
    return cachedOpenAIClient;
  }

  const apiKey =
    process.env.OPENAI_API_KEY
      ?.trim();

  if (!apiKey) {
    throw new Error(
      "The Companion service is unavailable.",
    );
  }

  cachedOpenAIClient =
    new OpenAI({
      apiKey,
    });

  return cachedOpenAIClient;
}

function readFastModelName():
  string {
  return (
    process.env.OPENAI_FAST_MODEL
      ?.trim() ||
    process.env.OPENAI_MODEL
      ?.trim() ||
    "gpt-4.1-mini"
  );
}

export async function POST(
  request: Request,
) {
  try {
    const authenticated =
      await requireAuthenticatedApiUser(
        request,
      );

    enforceApiRateLimit(
      request,
      {
        namespace:
          "companion-fast-conversation",

        limit:
          60,

        windowMs:
          60_000,

        identity:
          `user:${authenticated.user.id}`,
      },
    );

    const body =
      await readSecureJsonBody<
        FastConversationRequest
      >(
        request,
        {
          maximumBytes:
            96 * 1024,

          requireSameOrigin:
            true,
        },
      );

    const interactionMode =
      chooseCompanionInteractionMode({
        request:
          body.request,

        state:
          body.state,
      });

    if (
      interactionMode ===
      "action"
    ) {
      return privateApiJson({
        requiresAction:
          true,

        decision:
          null,
      });
    }

    const fastInput =
      buildFastConversationInput({
        request:
          body.request,

        memory:
          body.memory,

        conversation:
          body.conversation,
      });

    if (
      !fastInput.request
    ) {
      return privateApiJson(
        {
          error:
            "A message is required.",
        },
        400,
      );
    }

    const openai =
      getOpenAIClient();

    const response =
      await openai.responses.create({
        model:
          readFastModelName(),

        store:
          false,

        instructions:
          buildFastConversationInstructions(),

        input:
          JSON.stringify(
            fastInput,
          ),

        max_output_tokens:
          700,

        text: {
          format: {
            type:
              "json_schema",

            name:
              "smiling_monad_fast_conversation",

            description:
              "A concise natural Kimi response that identifies whether application tools are required.",

            strict:
              true,

            schema:
              fastConversationResponseSchema,
          },
        },
      });

    const rawOutput =
      response.output_text
        ?.trim();

    if (!rawOutput) {
      throw new Error(
        "Kimi returned an empty response.",
      );
    }

    let parsedResponse:
      unknown;

    try {
      parsedResponse =
        JSON.parse(
          rawOutput,
        );
    } catch {
      throw new Error(
        "Kimi returned invalid conversation data.",
      );
    }

    if (
      !isFastConversationResponse(
        parsedResponse,
      )
    ) {
      throw new Error(
        "Kimi returned an invalid conversation response.",
      );
    }

    if (
      parsedResponse.requiresAction
    ) {
      return privateApiJson({
        requiresAction:
          true,

        decision:
          null,
      });
    }

    const decision =
      createFastConversationDecision(
        parsedResponse,
      );

    return privateApiJson({
      requiresAction:
        false,

      decision,
    });
  } catch (error) {
    const securityResponse =
      apiSecurityErrorResponse(
        error,
      );

    if (securityResponse) {
      return securityResponse;
    }

    if (
      isApiAuthenticationError(
        error,
      )
    ) {
      return privateApiJson(
        {
          error:
            error.message,

          code:
            error.code,
        },
        error.status,
      );
    }

    console.error(
      "Kimi fast conversation error:",
      error,
    );

    return privateApiJson(
      {
        error:
          "Kimi could not respond. Please try again.",
      },
      500,
    );
  }
}