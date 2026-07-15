"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { stopCompanionSpeech } from "@/lib/companion/speech-client";
import {
  isCompanionVoiceAvailable,
  startCompanionVoiceRecognition,
} from "@/lib/companion/voice-client";
import {
  clearTemporaryWorkspaceSession,
  readTemporaryWorkspaceSession,
  updateTemporaryWorkspaceSession,
  type TemporaryWorkspaceSession,
} from "@/lib/workspace/session-client";

type GatewayResult = {
  action: "draft" | "clarify" | "answer";
  application:
    | "shift-report"
    | "correspondence"
    | "notes"
    | "planning"
    | "general";
  title: string;
  question: string;
  content: string;
};

type WorkspaceMessage = {
  id: string;
  speaker: "Ben" | "Kimi";
  text: string;
};

function createMessage(
  speaker: WorkspaceMessage["speaker"],
  text: string
): WorkspaceMessage {
  return {
    id: crypto.randomUUID(),
    speaker,
    text,
  };
}

function buildMemory(
  messages: WorkspaceMessage[]
): string {
  return messages
    .map(
      (message) =>
        `${message.speaker}: ${message.text}`
    )
    .join("\n");
}

function speakText(text: string) {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    !text.trim()
  ) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.rate = 0.96;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(
    utterance
  );
}

export default function WorkspacePage() {
  const hasStarted = useRef(false);
  const inputRef =
    useRef<HTMLTextAreaElement>(null);

  const [session, setSession] =
    useState<TemporaryWorkspaceSession | null>(
      null
    );

  const [result, setResult] =
    useState<GatewayResult | null>(null);

  const [messages, setMessages] = useState<
    WorkspaceMessage[]
  >([]);

  const [reply, setReply] = useState("");
  const [working, setWorking] =
    useState(false);
  const [listening, setListening] =
    useState(false);
  const [voiceMessage, setVoiceMessage] =
    useState("");
  const [error, setError] = useState("");

  async function runCompanion(
    request: string,
    memoryMessages: WorkspaceMessage[]
  ) {
    setWorking(true);
    setError("");
    stopCompanionSpeech();

    try {
      const response = await fetch(
        "/api/gateway",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            request,
            memory:
              buildMemory(memoryMessages),
          }),
        }
      );

      const data =
        (await response.json()) as
          | GatewayResult
          | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "The Companion could not complete the task."
        );
      }

      const nextResult =
        data as GatewayResult;

      setResult(nextResult);

      const kimiText =
        nextResult.action === "clarify"
          ? nextResult.question
          : nextResult.content;

      if (kimiText) {
        setMessages((current) => [
          ...current,
          createMessage("Kimi", kimiText),
        ]);

        speakText(kimiText);
      }

      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The Companion could not complete the task."
      );
    } finally {
      setWorking(false);
    }
  }

  useEffect(() => {
    const currentSession =
      readTemporaryWorkspaceSession();

    if (!currentSession) {
      return;
    }

    const activeSession =
      updateTemporaryWorkspaceSession({
        status: "active",
      }) ?? currentSession;

    setSession(activeSession);

    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    const openingMessage = createMessage(
      "Ben",
      activeSession.intent.originalRequest
    );

    setMessages([openingMessage]);

    void runCompanion(
      activeSession.intent.originalRequest,
      [openingMessage]
    );
  }, []);

  function continueTask(
    answer: string
  ) {
    const currentAnswer = answer.trim();

    if (
      !currentAnswer ||
      working ||
      !session
    ) {
      return;
    }

    const benMessage = createMessage(
      "Ben",
      currentAnswer
    );

    const nextMessages = [
      ...messages,
      benMessage,
    ];

    setMessages(nextMessages);
    setReply("");
    setVoiceMessage("");

    const continuedRequest = [
      session.intent.originalRequest,
      "",
      "The user is answering your most recent question.",
      `Their answer is: ${currentAnswer}`,
      "",
      "Use this answer as task information.",
      "Do not ask them to repeat or restate it.",
      "Ask only the next necessary question.",
      "When there is enough information, produce the complete draft.",
    ].join("\n");

    void runCompanion(
      continuedRequest,
      nextMessages
    );
  }

  function submitReply(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    continueTask(reply);
  }

  function startVoice() {
    stopCompanionSpeech();
    setVoiceMessage("");

    if (!isCompanionVoiceAvailable()) {
      setVoiceMessage(
        "Voice is not available in this browser."
      );
      return;
    }

    setListening(true);
    setVoiceMessage("Listening…");

    startCompanionVoiceRecognition({
      onTranscript: (transcript) => {
        const spokenAnswer =
          transcript.trim();

        setListening(false);
        setReply(spokenAnswer);
        setVoiceMessage(
          `You said: ${spokenAnswer}`
        );

        window.setTimeout(() => {
          continueTask(spokenAnswer);
        }, 500);
      },
      onError: () => {
        setListening(false);
        setVoiceMessage(
          "I could not hear that. Press the microphone and try again."
        );
      },
      onEnd: () => {
        setListening(false);
      },
    });
  }

  function repeatKimi() {
    const text =
      result?.action === "clarify"
        ? result.question
        : result?.content || "";

    speakText(text);
  }

  function clearWorkspace() {
    stopCompanionSpeech();
    clearTemporaryWorkspaceSession();
    setSession(null);
    setResult(null);
    setMessages([]);
    setReply("");
    setVoiceMessage("");
    setError("");
  }

  const isClarifying =
    result?.action === "clarify";

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#34271f]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-black/10 bg-[#f6f1e8]/92 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
        <Link
          href="/office"
          onClick={stopCompanionSpeech}
          className="rounded-full bg-white px-4 py-2 text-sm shadow-sm"
        >
          Back to Office
        </Link>

        <button
          type="button"
          onClick={clearWorkspace}
          className="rounded-full bg-white px-4 py-2 text-sm shadow-sm"
        >
          Clear
        </button>
      </header>

      <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        {!session && (
          <div className="flex min-h-[70vh] items-center justify-center text-center">
            <div>
              <h1 className="text-3xl font-semibold">
                Workspace
              </h1>

              <p className="mt-3 text-[#75675c]">
                No current task is open.
              </p>

              <Link
                href="/office"
                className="mt-6 inline-block rounded-full bg-white px-5 py-3 shadow-sm"
              >
                Return to Office
              </Link>
            </div>
          </div>
        )}

        {session && (
          <div className="space-y-5">
            <article className="rounded-3xl bg-white p-5 shadow-xl sm:p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-[#7d6a5a]">
                Current task
              </p>

              <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
                {result?.title ||
                  session.intent.title}
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#75675c]">
                {session.intent.originalRequest}
              </p>
            </article>

            <article className="rounded-3xl bg-white p-5 shadow-xl sm:p-8">
              <div className="rounded-2xl border border-black/10 bg-[#fbf8f3] p-5 sm:p-6">
                {working && !result && (
                  <p className="text-center text-[#75675c]">
                    Kimi is preparing the task…
                  </p>
                )}

                {error && (
                  <div>
                    <p className="font-medium text-red-700">
                      Kimi could not complete the task.
                    </p>

                    <p className="mt-2 text-sm text-red-600">
                      {error}
                    </p>
                  </div>
                )}

                {isClarifying && (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#7d6a5a]">
                        Kimi needs one detail
                      </p>

                      <button
                        type="button"
                        onClick={repeatKimi}
                        aria-label="Repeat Kimi's question"
                        title="Repeat Kimi's question"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm"
                      >
                        🔊
                      </button>
                    </div>

                    <p className="mt-3 text-lg leading-7">
                      {result.question}
                    </p>
                  </div>
                )}

                {result &&
                  result.action !== "clarify" && (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-[#7d6a5a]">
                          Draft
                        </p>

                        <button
                          type="button"
                          onClick={repeatKimi}
                          aria-label="Read the draft aloud"
                          title="Read the draft aloud"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm"
                        >
                          🔊
                        </button>
                      </div>

                      <div className="mt-4 whitespace-pre-wrap text-base leading-7">
                        {result.content}
                      </div>
                    </div>
                  )}

                {working && result && (
                  <p className="mt-5 text-sm text-[#75675c]">
                    Kimi is using your answer…
                  </p>
                )}
              </div>

              <form
                onSubmit={submitReply}
                className="mt-5"
              >
                <label
                  htmlFor="workspace-reply"
                  className="text-sm font-medium text-[#5f5146]"
                >
                  {isClarifying
                    ? "Your answer"
                    : "Add or change something"}
                </label>

                <textarea
                  ref={inputRef}
                  id="workspace-reply"
                  value={reply}
                  onChange={(event) =>
                    setReply(event.target.value)
                  }
                  placeholder={
                    isClarifying
                      ? "Answer Kimi's question…"
                      : "Tell Kimi what to change…"
                  }
                  rows={3}
                  disabled={working}
                  className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-[#fbf8f3] px-4 py-3 text-base outline-none transition focus:border-[#8a6b52] disabled:opacity-60"
                />

                {voiceMessage && (
                  <p className="mt-2 text-sm text-[#75675c]">
                    {voiceMessage}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={startVoice}
                    disabled={
                      working || listening
                    }
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-sm transition ${
                      listening
                        ? "animate-pulse bg-[#5f4938] text-white"
                        : "bg-white text-[#5f4938]"
                    } disabled:opacity-50`}
                    aria-label={
                      listening
                        ? "Listening"
                        : "Answer with voice"
                    }
                    title="Answer with voice"
                  >
                    🎤
                  </button>

                  <button
                    type="submit"
                    disabled={
                      working ||
                      !reply.trim()
                    }
                    className="rounded-full bg-[#5f4938] px-5 py-2.5 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {working
                      ? "Working…"
                      : isClarifying
                        ? "Continue"
                        : "Update draft"}
                  </button>
                </div>
              </form>
            </article>
          </div>
        )}
      </section>
    </main>
  );
}