import OpenAI from "openai";

import {
  buildKimiBehaviourInstructions,
} from "@/lib/companion/kimi-behaviour";

import {
  buildFastConversationInput,
  chooseCompanionInteractionMode,
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
} from "@/lib/security/api-request-security";

type StreamingConversationRequest = {
  request: string;
  memory?: string;
  conversation?: FastConversationMessage[];
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

function buildStreamingInstructions():
  string {
  return [
    buildKimiBehaviourInstructions(
      "conversation",
    ),
    `
STREAMING CONVERSATION BOUNDARY

This route is for conversation only.

Application actions, document changes, messages, bookings, navigation and
other tool use are handled by the full Companion gateway.

Never claim that one of those actions happened in this conversation response.

Most replies should be no more than 60 words.
Use more only when the user asks for detail or the subject genuinely needs it.
`.trim(),
  ].join("\n\n");
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
          "companion-streaming-conversation",

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
        StreamingConversationRequest
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
      return privateApiJson(
        {
          requiresAction:
            true,
        },
        409,
      );
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

    if (!fastInput.request) {
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

    const openAIStream =
      await openai.responses.create(
        {
          model:
            readFastModelName(),

          store:
            false,

          instructions:
            buildStreamingInstructions(),

          input:
            JSON.stringify(
              fastInput,
            ),

          max_output_tokens:
            240,

          stream:
            true,
        },
        {
          signal:
            request.signal,
        },
      );

    const encoder =
      new TextEncoder();

    const responseStream =
      new ReadableStream<
        Uint8Array
      >({
        async start(
          controller,
        ) {
          try {
            for await (
              const event of
              openAIStream
            ) {
              if (
                event.type ===
                "response.output_text.delta"
              ) {
                const text =
                  event.delta;

                if (text) {
                  controller.enqueue(
                    encoder.encode(
                      text,
                    ),
                  );
                }
              }
            }

            controller.close();
          } catch (error) {
            console.error(
              "Kimi streaming response error:",
              error,
            );

            controller.error(
              error,
            );
          }
        },
      });

    return new Response(
      responseStream,
      {
        status:
          200,

        headers: {
          "Content-Type":
            "text/plain; charset=utf-8",

          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          Pragma:
            "no-cache",

          "X-Content-Type-Options":
            "nosniff",

          "X-Accel-Buffering":
            "no",
        },
      },
    );
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
      "Kimi streaming gateway error:",
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