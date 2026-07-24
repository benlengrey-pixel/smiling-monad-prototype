import {
  createHash,
} from "node:crypto";

import {
  buildKimiBehaviourInstructions,
} from "@/lib/companion/kimi-behaviour";

import {
  isApiAuthenticationError,
  requireAuthenticatedApiUser,
} from "@/lib/security/api-user-auth";

import {
  apiSecurityErrorResponse,
  assertTrustedRequestOrigin,
  enforceApiRateLimit,
  privateApiJson,
} from "@/lib/security/api-request-security";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const maxDuration =
  30;

const OPENAI_REALTIME_CALL_URL =
  "https://api.openai.com/v1/realtime/calls";

const MAXIMUM_SDP_BYTES =
  64 * 1024;

function readRealtimeModelName():
  string {
  return (
    process.env
      .OPENAI_REALTIME_MODEL
      ?.trim() ||
    "gpt-realtime-2.1"
  );
}

function readRealtimeVoice():
  string {
  return (
    process.env
      .OPENAI_REALTIME_VOICE
      ?.trim() ||
    "marin"
  );
}

function buildRealtimeInstructions():
  string {
  return [
    buildKimiBehaviourInstructions(
      "conversation",
    ),
    `
LIVE COMPANION ROLE

You are the persistent live Companion. The Smiling Monad application does not
control your conversation or decide what you are allowed to think about.

Talk directly with the user when they are conversing, asking questions,
thinking aloud, seeking perspective or exploring an idea.

Use the use_smiling_monad_app tool only when the user wants you to operate the
application: navigate, open, create, change, organise, save, send, share,
schedule, manage access or work with a Circle, document, task or desk object.

Do not call the application tool for ordinary conversation.

When a tool is needed, pass the user's intended outcome in plain language.
Wait for the tool result before claiming that anything happened.

Keep spoken replies natural and concise. Begin with the substance. Do not
narrate internal reasoning, tool selection or routing.
`.trim(),
  ].join("\n\n");
}

function buildRealtimeSession() {
  return {
    type:
      "realtime",

    model:
      readRealtimeModelName(),

    instructions:
      buildRealtimeInstructions(),

    output_modalities: [
      "audio",
    ],

    audio: {
      input: {
        turn_detection: {
          type:
            "semantic_vad",

          eagerness:
            "high",

          create_response:
            true,

          interrupt_response:
            true,
        },
      },

      output: {
        voice:
          readRealtimeVoice(),
      },
    },

    tools: [
      {
        type:
          "function",

        name:
          "use_smiling_monad_app",

        description:
          "Operate the Smiling Monad application only when the user wants navigation, app state, persistent work, documents, tasks, Circles, sharing, scheduling, permissions or another application action.",

        parameters: {
          type:
            "object",

          additionalProperties:
            false,

          properties: {
            request: {
              type:
                "string",

              description:
                "The user's intended application outcome in clear plain language.",
            },
          },

          required: [
            "request",
          ],
        },
      },
    ],

    tool_choice:
      "auto",
  };
}

function createSafetyIdentifier(
  userId: string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      `smiling-monad:${userId}`,
    )
    .digest("hex");
}

function isSdpContentType(
  request: Request,
): boolean {
  const contentType =
    request.headers
      .get("content-type")
      ?.toLowerCase() ?? "";

  return (
    contentType.startsWith(
      "application/sdp",
    ) ||
    contentType.startsWith(
      "text/plain",
    )
  );
}

async function readSdpOffer(
  request: Request,
): Promise<string | null> {
  if (
    !isSdpContentType(
      request,
    )
  ) {
    return null;
  }

  const contentLength =
    Number(
      request.headers.get(
        "content-length",
      ),
    );

  if (
    Number.isFinite(
      contentLength,
    ) &&
    contentLength >
      MAXIMUM_SDP_BYTES
  ) {
    return null;
  }

  const offer =
    await request.text();

  const offerBytes =
    new TextEncoder()
      .encode(offer)
      .byteLength;

  if (
    !offer.trim() ||
    offerBytes >
      MAXIMUM_SDP_BYTES
  ) {
    return null;
  }

  return offer;
}

export async function POST(
  request: Request,
) {
  try {
    assertTrustedRequestOrigin(
      request,
      true,
    );

    const authenticated =
      await requireAuthenticatedApiUser(
        request,
      );

    enforceApiRateLimit(
      request,
      {
        namespace:
          "companion-realtime-session",

        limit:
          12,

        windowMs:
          60_000,

        identity:
          `user:${authenticated.user.id}`,
      },
    );

    const offer =
      await readSdpOffer(
        request,
      );

    if (!offer) {
      return privateApiJson(
        {
          error:
            "A valid WebRTC session offer is required.",
        },
        400,
      );
    }

    const apiKey =
      process.env.OPENAI_API_KEY
        ?.trim();

    if (!apiKey) {
      return privateApiJson(
        {
          error:
            "The live Companion service is unavailable.",
        },
        503,
      );
    }

    const formData =
      new FormData();

    formData.set(
      "sdp",
      offer,
    );

    formData.set(
      "session",
      JSON.stringify(
        buildRealtimeSession(),
      ),
    );

    const openAIResponse =
      await fetch(
        OPENAI_REALTIME_CALL_URL,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            "OpenAI-Safety-Identifier":
              createSafetyIdentifier(
                authenticated.user.id,
              ),
          },

          body:
            formData,

          signal:
            request.signal,
        },
      );

    const responseBody =
      await openAIResponse.text();

    if (
      !openAIResponse.ok ||
      !responseBody.trim()
    ) {
      console.error(
        "Kimi realtime session error:",
        openAIResponse.status,
      );

      return privateApiJson(
        {
          error:
            "Kimi could not start a live session.",
        },
        502,
      );
    }

    const headers =
      new Headers({
        "Content-Type":
          "application/sdp",

        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        Pragma:
          "no-cache",

        "X-Content-Type-Options":
          "nosniff",
      });

    const location =
      openAIResponse.headers.get(
        "location",
      );

    if (location) {
      headers.set(
        "Location",
        location,
      );
    }

    return new Response(
      responseBody,
      {
        status:
          200,

        headers,
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
      "Kimi realtime gateway error:",
      error,
    );

    return privateApiJson(
      {
        error:
          "Kimi could not start a live session.",
      },
      500,
    );
  }
}