"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

function stopAllSpeech() {
  stopCompanionSpeech();

  if (
    typeof window !== "undefined" &&
    "speechSynthesis" in window
  ) {
    window.speechSynthesis.cancel();
  }
}

function speakText(text: string) {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    !text.trim()
  ) {
    return;
  }

  stopAllSpeech();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.rate = 0.98;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(
    utterance
  );
}

function isApproval(text: string): boolean {
  const value = text
    .trim()
    .toLowerCase();

  return [
    "that's good",
    "thats good",
    "that's pretty good",
    "thats pretty good",
    "looks good",
    "that looks good",
    "good",
    "perfect",
    "great",
    "done",
    "finished",
    "leave it",
    "leave it as it is",
    "keep it",
    "keep it as it is",
    "i'm happy with it",
    "im happy with it",
  ].some(
    (phrase) =>
      value === phrase ||
      value.includes(phrase)
  );
}

function safeFilename(title: string): string {
  const cleaned = title
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return (
    cleaned ||
    "smiling-monad-document"
  );
}

export default function WorkspacePage() {
  const router = useRouter();
  const hasStarted = useRef(false);
  const textInputRef =
    useRef<HTMLTextAreaElement>(null);

  const [session, setSession] =
    useState<TemporaryWorkspaceSession | null>(
      null
    );

  const [result, setResult] =
    useState<GatewayResult | null>(null);

  const [messages, setMessages] =
    useState<WorkspaceMessage[]>([]);

  const [reply, setReply] = useState("");
  const [working, setWorking] =
    useState(false);
  const [listening, setListening] =
    useState(false);
  const [showKeyboard, setShowKeyboard] =
    useState(false);
  const [statusMessage, setStatusMessage] =
    useState("");
  const [error, setError] = useState("");

  async function runCompanion(
    request: string,
    memoryMessages: WorkspaceMessage[]
  ) {
    setWorking(true);
    setError("");
    setStatusMessage("");
    stopAllSpeech();

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
            : "Kimi could not complete the task."
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

        if (
          nextResult.action === "clarify"
        ) {
          speakText(kimiText);
        }
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Kimi could not complete the task."
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

  function continueTask(answer: string) {
    const currentAnswer = answer.trim();

    if (
      !currentAnswer ||
      working ||
      !session
    ) {
      return;
    }

    if (
      result?.action !== "clarify" &&
      isApproval(currentAnswer)
    ) {
      const confirmation =
        "Good. I’ll leave it as it is.";

      setReply("");
      setShowKeyboard(false);
      setStatusMessage(confirmation);
      speakText(confirmation);
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
    setShowKeyboard(false);

    const continuedRequest = [
      session.intent.originalRequest,
      "",
      result?.action === "clarify"
        ? "The user is answering your most recent question."
        : "The user is requesting a change to the current draft.",
      `Their response is: ${currentAnswer}`,
      "",
      "Use the response directly.",
      "Do not ask them to repeat it.",
      "Ask only one necessary question at a time.",
      "When there is enough information, produce the complete updated draft.",
      "Keep conversational comments brief.",
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
    stopAllSpeech();
    setStatusMessage("");

    if (!isCompanionVoiceAvailable()) {
      setStatusMessage(
        "Voice is not available in this browser."
      );
      return;
    }

    setListening(true);
    setStatusMessage("Listening…");

    startCompanionVoiceRecognition({
      onTranscript: (transcript) => {
        const spokenAnswer =
          transcript.trim();

        setListening(false);
        setStatusMessage(
          `You said: ${spokenAnswer}`
        );

        window.setTimeout(() => {
          continueTask(spokenAnswer);
        }, 350);
      },
      onError: () => {
        setListening(false);
        setStatusMessage(
          "I could not hear that. Press the microphone and try again."
        );
      },
      onEnd: () => {
        setListening(false);
      },
    });
  }

  function showTextInput() {
    setShowKeyboard(true);

    window.setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  }

  function repeatKimi() {
    const text =
      result?.action === "clarify"
        ? result.question
        : result?.content || "";

    speakText(text);
  }

  function saveDocument() {
    if (!result?.content) {
      setStatusMessage(
        "There is no finished document to save yet."
      );
      return;
    }

    const title =
      result.title ||
      session?.intent.title ||
      "Smiling Monad Document";

    const blob = new Blob(
      [result.content],
      {
        type: "text/plain;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `${safeFilename(title)}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    setStatusMessage("Saved.");
    speakText("Saved.");
  }

  function finishTask() {
    stopAllSpeech();
    clearTemporaryWorkspaceSession();
    router.push("/office");
  }

  function clearWorkspace() {
    stopAllSpeech();
    clearTemporaryWorkspaceSession();
    setSession(null);
    setResult(null);
    setMessages([]);
    setReply("");
    setStatusMessage("");
    setError("");
  }

  const isClarifying =
    result?.action === "clarify";

  const documentTitle =
    result?.title ||
    session?.intent.title ||
    "Current task";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#dfe8df] text-[#34271f]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.92),rgba(232,239,228,0.82)_34%,rgba(179,196,177,0.78)_100%)]" />

        <div className="absolute left-[-8%] top-[10%] h-72 w-72 rounded-full bg-[#7f9b79]/18 blur-3xl" />

        <div className="absolute right-[-10%] top-[18%] h-80 w-80 rounded-full bg-[#d8c29f]/24 blur-3xl" />

        <div className="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(to_top,rgba(91,65,43,0.34),rgba(155,118,78,0.18),transparent)]" />
      </div>

      <header className="relative z-30 flex items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/office"
          onClick={stopAllSpeech}
          className="rounded-full border border-white/50 bg-white/72 px-4 py-2 text-sm shadow-sm backdrop-blur-md"
        >
          Back to Office
        </Link>

        <button
          type="button"
          onClick={clearWorkspace}
          className="rounded-full border border-white/50 bg-white/72 px-4 py-2 text-sm shadow-sm backdrop-blur-md"
        >
          Clear
        </button>
      </header>

      {!session && (
        <section className="relative z-10 flex min-h-[75vh] items-center justify-center px-5 text-center">
          <div className="rounded-[2rem] border border-white/50 bg-white/72 px-8 py-10 shadow-xl backdrop-blur-md">
            <h1 className="text-3xl font-semibold">
              Workspace
            </h1>

            <p className="mt-3 text-[#75675c]">
              No current task is open.
            </p>

            <Link
              href="/office"
              className="mt-6 inline-block rounded-full bg-[#5f4938] px-5 py-3 text-white shadow-sm"
            >
              Return to Office
            </Link>
          </div>
        </section>
      )}

      {session && (
        <section className="relative z-10 mx-auto flex w-full max-w-6xl justify-center px-4 pb-36 pt-3 sm:px-6 sm:pt-8">
          <div className="relative w-full max-w-4xl">
            <div className="absolute -inset-4 rounded-[2.4rem] bg-white/28 blur-xl" />

            <article className="relative min-h-[67vh] rounded-[2rem] border border-white/60 bg-[#fffdf8]/88 px-6 py-8 shadow-[0_28px_70px_rgba(63,48,34,0.18)] backdrop-blur-xl sm:px-12 sm:py-12">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8a7767]">
                    {result?.action ===
                    "clarify"
                      ? "Working together"
                      : "Current document"}
                  </p>

                  <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                    {documentTitle}
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-[#817267]">
                    {
                      session.intent
                        .originalRequest
                    }
                  </p>
                </div>

                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#765f4b]/20 bg-[#efe5d7] sm:flex">
                  <div className="h-5 w-5 rounded-full border border-[#765f4b]/55" />
                </div>
              </div>

              <div className="my-8 h-px bg-black/10" />

              {working && !result && (
                <div className="flex min-h-[35vh] items-center justify-center text-[#75675c]">
                  Kimi is preparing the workspace…
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50/90 p-5">
                  <p className="font-medium text-red-700">
                    Kimi could not complete the task.
                  </p>

                  <p className="mt-2 text-sm text-red-600">
                    {error}
                  </p>
                </div>
              )}

              {result?.action !==
                "clarify" &&
                result?.content && (
                  <div className="whitespace-pre-wrap text-[1.05rem] leading-8 text-[#3e332c]">
                    {result.content}
                  </div>
                )}

              {isClarifying && (
                <div className="mx-auto mt-8 max-w-2xl rounded-[1.75rem] border border-white/60 bg-[#f5eee3]/88 p-6 shadow-[0_16px_34px_rgba(73,53,36,0.12)] backdrop-blur-md sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7767]">
                        Kimi
                      </p>

                      <p className="mt-1 text-sm text-[#847469]">
                        One detail before we continue
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={repeatKimi}
                      aria-label="Repeat Kimi's question"
                      title="Repeat Kimi's question"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/85 text-lg shadow-sm"
                    >
                      🔊
                    </button>
                  </div>

                  <p className="mt-5 text-xl leading-8">
                    {result.question}
                  </p>
                </div>
              )}

              {working && result && (
                <p className="mt-8 text-center text-sm text-[#75675c]">
                  Kimi is updating the workspace…
                </p>
              )}
            </article>

            {showKeyboard && (
              <form
                onSubmit={submitReply}
                className="relative mt-5 rounded-[1.5rem] border border-white/55 bg-white/84 p-4 shadow-lg backdrop-blur-md sm:p-5"
              >
                <textarea
                  ref={textInputRef}
                  value={reply}
                  onChange={(event) =>
                    setReply(
                      event.target.value
                    )
                  }
                  placeholder={
                    isClarifying
                      ? "Answer Kimi’s question…"
                      : "Tell Kimi what to change…"
                  }
                  rows={3}
                  disabled={working}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-[#fbf8f3]/90 px-4 py-3 text-base outline-none focus:border-[#8a6b52]"
                />

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowKeyboard(false);
                      setReply("");
                    }}
                    className="rounded-full px-4 py-2 text-sm text-[#6f6157]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      working ||
                      !reply.trim()
                    }
                    className="rounded-full bg-[#5f4938] px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}

            {statusMessage && (
              <p className="mt-4 text-center text-sm text-[#5f554e]">
                {statusMessage}
              </p>
            )}
          </div>
        </section>
      )}

      {session && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-[1.5rem] border border-white/45 bg-[#6f5642]/84 px-3 py-3 shadow-[0_16px_40px_rgba(45,31,21,0.2)] backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startVoice}
                disabled={
                  working || listening
                }
                className={`flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-sm transition ${
                  listening
                    ? "animate-pulse bg-white text-[#5f4938]"
                    : "bg-white/18 text-white"
                } disabled:opacity-50`}
                aria-label={
                  listening
                    ? "Listening"
                    : "Speak to Kimi"
                }
                title="Speak to Kimi"
              >
                🎤
              </button>

              <button
                type="button"
                onClick={showTextInput}
                disabled={working}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/18 text-lg text-white shadow-sm disabled:opacity-50"
                aria-label="Type to Kimi"
                title="Type to Kimi"
              >
                ⌨️
              </button>

              {result && (
                <button
                  type="button"
                  onClick={repeatKimi}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/18 text-lg text-white shadow-sm"
                  aria-label="Read aloud"
                  title="Read aloud"
                >
                  🔊
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {result?.content && (
                <button
                  type="button"
                  onClick={saveDocument}
                  className="rounded-full bg-white/90 px-4 py-3 text-sm font-medium text-[#4e3b2d] shadow-sm"
                >
                  Save
                </button>
              )}

              <button
                type="button"
                onClick={finishTask}
                className="rounded-full bg-[#2f3f35] px-5 py-3 text-sm font-medium text-white shadow-sm"
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}