import { NextResponse } from "next/server";

import { KIMI_VOICE } from "@/lib/companion/kimi-voice";

type SpeechRequest = {
  text?: string;
};

const KIMI_SPEECH_INSTRUCTIONS = `
${KIMI_VOICE}

VOICE DELIVERY

Speak with a warm, natural, softly Australian character.

Sound like a capable young adult woman having a real conversation nearby.
Be calm without performing calmness.
Be friendly without sounding overly cheerful.
Be intelligent without sounding formal or academic.
Be gentle without sounding fragile.
Be confident without sounding authoritative.

Use a normal conversational pace.
Do not drag words out.
Do not insert long pauses between ordinary sentences.
Let punctuation create brief, natural pauses.
Vary rhythm and intonation subtly so each sentence does not follow the same
pattern.
Use gentle emphasis only on words that carry meaning.

Keep short replies light and immediate.
Let thoughtful replies breathe without becoming slow.
Do not sound robotic, corporate, theatrical, therapeutic, breathy or like a
radio announcer.
Do not over-enunciate.
Do not exaggerate emotion.
Do not sound patronising.
`.trim();

export async function POST(
  request: Request,
) {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY
        ?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is missing.",
        },
        {
          status:
            500,
        },
      );
    }

    const body =
      (await request.json()) as SpeechRequest;

    const text =
      body.text?.trim() ?? "";

    if (!text) {
      return NextResponse.json(
        {
          error:
            "Speech text is required.",
        },
        {
          status:
            400,
        },
      );
    }

    const speechResponse =
      await fetch(
        "https://api.openai.com/v1/audio/speech",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              model:
                process.env
                  .OPENAI_SPEECH_MODEL
                  ?.trim() ||
                "gpt-4o-mini-tts",

              voice:
                process.env
                  .OPENAI_SPEECH_VOICE
                  ?.trim() ||
                "marin",

              input:
                text.slice(
                  0,
                  4096,
                ),

              instructions:
                KIMI_SPEECH_INSTRUCTIONS,

              response_format:
                "mp3",
            }),

          signal:
            request.signal,
        },
      );

    if (!speechResponse.ok) {
      let message =
        "Kimi's voice could not be generated.";

      try {
        const errorData =
          (await speechResponse.json()) as {
            error?: {
              message?: string;
            };
          };

        message =
          errorData.error?.message ??
          message;
      } catch {
        // Keep the safe fallback message.
      }

      return NextResponse.json(
        {
          error:
            message,
        },
        {
          status:
            speechResponse.status,
        },
      );
    }

    if (!speechResponse.body) {
      return NextResponse.json(
        {
          error:
            "Kimi's voice stream was empty.",
        },
        {
          status:
            502,
        },
      );
    }

    return new Response(
      speechResponse.body,
      {
        status:
          200,

        headers: {
          "Content-Type":
            speechResponse.headers.get(
              "content-type",
            ) ||
            "audio/mpeg",

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
    if (request.signal.aborted) {
      return new Response(null, {
        status:
          499,
      });
    }

    console.error(
      "Speech route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Kimi's voice could not be generated.",
      },
      {
        status:
          500,
      },
    );
  }
}