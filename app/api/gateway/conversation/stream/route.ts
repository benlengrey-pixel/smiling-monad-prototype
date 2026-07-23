import OpenAI from "openai";

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
} from "../../../../../lib/security/api-request-security";

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
  return `
You are Kimi, the intelligent Companion inside the Smiling Monad Space.

Respond directly to the user.

Be natural, warm, calm and intelligent.

Do not sound like an application, workflow, form, support bot or technical
assistant.

Do not mention tools, routing, schemas, internal state or application logic.

Do not turn ordinary conversation into a task.

Listen to what the user is actually saying and respond to that meaning.

Use relevant memory and recent conversation only when it genuinely helps.

Do not repeat information the user already knows.

Do not begin with generic phrases such as:
- "I understand";
- "Thank you for sharing";
- "It sounds like";
- "How can I assist you?"

Begin with the substance of the response.

Keep the response brief when a brief response is enough.

Use more detail only when the user asks for it or the subject genuinely needs
it.

Never claim that an application action, document change, message, booking,
navigation or external action has happened.

Requests requiring application actions are handled by the full Companion
gateway instead.
`.trim();
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
            450,

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