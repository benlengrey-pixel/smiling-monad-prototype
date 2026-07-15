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
  ].some((phrase) =>
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

  return cleaned || "smiling-monad-document";
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

  const [messages, setMessages] = useState<
    WorkspaceMessage[]
  >([]);

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

        speakText(kimiText);
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
    stopCompanionSpeech();
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
    stopCompanionSpeech();
    clearTemporaryWorkspaceSession();
    router.push("/office");
  }

  function clearWorkspace() {
    stopCompanionSpeech();
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
    <main className="min-h-screen bg-[#f3eee5] text-[#34271f]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/10 bg-[#f3eee5]/92 px-4 py-3 backdrop-blur-md sm:px-6">
        <Link
          href="/office"
          onClick={stopCompanionSpeech}
          className="rounded-full bg-white px-4 py-2 text-sm shadow-sm"
        >
          Back to Office
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearWorkspace}
            className="rounded-full bg-white px-4 py-2 text-sm shadow-sm"
          >
            Clear
          </button>
        </div>
      </header>

      {!session && (
        <section className="flex min-h-[75vh] items-center justify-center px-5 text-center">
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
        </section>
      )}

      {session && (
        <section className="mx-auto w-full max-w-4xl px-4 pb-32 pt-6 sm:px-6 sm:pt-10">
          <article className="min-h-[65vh] rounded-[2rem] bg-[#fffdf9] px-6 py-8 shadow-[0_20px_50px_rgba(72,55,40,0.12)] sm:px-12 sm:py-12">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a7767]">
              {result?.action === "clarify"
                ? "In progress"
                : "Document"}
            </p>

            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              {documentTitle}
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#817267]">
              {session.intent.originalRequest}
            </p>

            <div className="my-8 h-px bg-black/10" />

            {working && !result && (
              <div className="flex min-h-[35vh] items-center justify-center text-[#75675c]">
                Kimi is preparing the document…
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-medium text-red-700">
                  Kimi could not complete the task.
                </p>

                <p className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              </div>
            )}

            {result?.action !== "clarify" &&
              result?.content && (
                <div className="whitespace-pre-wrap text-[1.05rem] leading-8 text-[#3e332c]">
                  {result.content}
                </div>
              )}

            {isClarifying && (
              <div className="mx-auto max-w-2xl rounded-3xl border border-black/10 bg-[#f8f3eb] p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8a7767]">
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

                <p className="mt-4 text-xl leading-8">
                  {result.question}
                </p>
              </div>
            )}

            {working && result && (
              <p className="mt-8 text-center text-sm text-[#75675c]">
                Kimi is updating the document…
              </p>
            )}
          </article>

          {showKeyboard && (
            <form
              onSubmit={submitReply}
              className="mt-5 rounded-3xl bg-white p-4 shadow-lg sm:p-5"
            >
              <textarea
                ref={textInputRef}
                value={reply}
                onChange={(event) =>
                  setReply(event.target.value)
                }
                placeholder={
                  isClarifying
                    ? "Answer Kimi’s question…"
                    : "Tell Kimi what to change…"
                }
                rows={3}
                disabled={working}
                className="w-full resize-none rounded-2xl border border-black/10 bg-[#fbf8f3] px-4 py-3 text-base outline-none focus:border-[#8a6b52]"
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
            <p className="mt-4 text-center text-sm text-[#75675c]">
              {statusMessage}
            </p>
          )}
        </section>
      )}

      {session && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#f3eee5]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <div className="flex items-center gap-2">
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
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg shadow-sm disabled:opacity-50"
                aria-label="Type to Kimi"
                title="Type to Kimi"
              >
                ⌨️
              </button>

              {result && (
                <button
                  type="button"
                  onClick={repeatKimi}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg shadow-sm"
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
                  className="rounded-full bg-white px-4 py-3 text-sm font-medium shadow-sm"
                >
                  Save
                </button>
              )}

              <button
                type="button"
                onClick={finishTask}
                className="rounded-full bg-[#5f4938] px-5 py-3 text-sm font-medium text-white shadow-sm"
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