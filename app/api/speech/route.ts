import { NextResponse } from "next/server";

import { KIMI_VOICE } from "@/lib/companion/kimi-voice";

type SpeechRequest = {
  text?: string;
};

const KIMI_SPEECH_INSTRUCTIONS = `
${KIMI_VOICE}

Speak with a warm, natural, softly Australian character.

Sound like a capable young adult woman.

Be calm but not sleepy.
Be friendly but not overly cheerful.
Be intelligent without sounding formal or academic.
Be gentle without sounding fragile.
Be confident without sounding authoritative.
Never sound robotic, corporate, theatrical or like a radio announcer.

Use natural conversational rhythm and comfortable pauses.
Keep the pace slightly relaxed.
Use subtle warmth and emotional expression.
Do not exaggerate emotion.
Do not sound patronising.

Speak as though you have time for the listener, even when helping them move quickly.
`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const body = (await request.json()) as SpeechRequest;
    const text = body.text?.trim() ?? "";

    if (!text) {
      return NextResponse.json(
        {
          error: "Speech text is required.",
        },
        {
          status: 400,
        }
      );
    }

    const speechResponse = await fetch(
      "https://api.openai.com/v1/audio/speech",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model:
            process.env.OPENAI_SPEECH_MODEL ??
            "gpt-4o-mini-tts",
          voice:
            process.env.OPENAI_SPEECH_VOICE ??
            "marin",
          input: text.slice(0, 4096),
          instructions: KIMI_SPEECH_INSTRUCTIONS,
          response_format: "mp3",
        }),
      }
    );

    if (!speechResponse.ok) {
      let message =
        "Kimi's voice could not be generated.";

      try {
        const errorData = (await speechResponse.json()) as {
          error?: {
            message?: string;
          };
        };

        message = errorData.error?.message ?? message;
      } catch {
        // Keep the safe fallback message.
      }

      return NextResponse.json(
        {
          error: message,
        },
        {
          status: speechResponse.status,
        }
      );
    }

    const audio = await speechResponse.arrayBuffer();

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Speech route error:", error);

    return NextResponse.json(
      {
        error: "Kimi's voice could not be generated.",
      },
      {
        status: 500,
      }
    );
  }
}
