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

type GatewayAction =
  | "answer"
  | "draft"
  | "clarify"
  | "prepare-tool";

type GatewayApplication =
  | "shift-report"
  | "correspondence"
  | "notes"
  | "planning"
  | "general";

type GatewayPresentation =
  | "conversation"
  | "document"
  | "folder"
  | "workspace"
  | "tool";

type GatewayOfficeObject =
  | "none"
  | "report-folder"
  | "correspondence-folder"
  | "notebook"
  | "planner"
  | "workspace";

type GatewayTool =
  | "none"
  | "shift-report"
  | "correspondence"
  | "notes"
  | "planning";

type GatewayResult = {
  action: GatewayAction;
  application: GatewayApplication;
  presentation: GatewayPresentation;
  officeObject: GatewayOfficeObject;
  tool: GatewayTool;
  title: string;
  question: string;
  content: string;
  reason: string;
  nextStep: string;
  requiresConfirmation: boolean;
};

type StoredWorkspaceSession =
  TemporaryWorkspaceSession & {
    gatewayResult?: GatewayResult;
    result?: GatewayResult;
    generatedResult?: GatewayResult;
    title?: string;
    content?: string;
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
    "yes",
    "confirm",
    "confirmed",
    "approve",
    "approved",
    "go ahead",
    "do it",
    "send it",
    "submit it",
    "publish it",
    "share it",
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

function getStoredResult(
  session: StoredWorkspaceSession
): GatewayResult | null {
  if (session.gatewayResult) {
    return session.gatewayResult;
  }

  if (session.generatedResult) {
    return session.generatedResult;
  }

  if (session.result) {
    return session.result;
  }

  if (
    typeof session.content === "string" &&
    session.content.trim()
  ) {
    return {
      action: "draft",
      application: "general",
      presentation: "workspace",
      officeObject: "workspace",
      tool: "none",
      title:
        session.title ||
        session.intent.title ||
        "Current document",
      question: "",
      content: session.content,
      reason:
        "The completed document was passed into the Workspace.",
      nextStep:
        "Review or edit the document.",
      requiresConfirmation: false,
    };
  }

  return null;
}

function getResultText(
  result: GatewayResult
): string {
  if (result.action === "clarify") {
    return result.question;
  }

  if (result.action === "prepare-tool") {
    return (
      result.content ||
      result.nextStep ||
      "The tool is ready."
    );
  }

  return result.content;
}

function getToolName(
  tool: GatewayTool
): string {
  switch (tool) {
    case "shift-report":
      return "Shift Report";

    case "correspondence":
      return "Correspondence";

    case "notes":
      return "Notes";

    case "planning":
      return "Planning";

    case "none":
    default:
      return "Workspace";
  }
}

export default function WorkspacePage() {
  const router = useRouter();

  const hasStarted = useRef(false);

  const textInputRef =
    useRef<HTMLTextAreaElement>(null);

  const [session, setSession] =
    useState<StoredWorkspaceSession | null>(
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

  const [
    confirmationPending,
    setConfirmationPending,
  ] = useState(false);

  async function runCompanion(
    request: string,
    memoryMessages: WorkspaceMessage[],
    currentDocument?: string
  ) {
    setWorking(true);
    setError("");
    setStatusMessage("");
    setConfirmationPending(false);

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
            memory: [
              buildMemory(memoryMessages),
              currentDocument?.trim()
                ? [
                    "",
                    "=== CURRENT WORKSPACE DOCUMENT ===",
                    currentDocument,
                  ].join("\n")
                : "",
            ]
              .filter(Boolean)
              .join("\n"),
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

      const persistedSession =
        updateTemporaryWorkspaceSession({
          status: "active",
          gatewayResult: nextResult,
        });

      if (persistedSession) {
        setSession(
          persistedSession as StoredWorkspaceSession
        );
      }

      if (
        nextResult.requiresConfirmation
      ) {
        setConfirmationPending(true);
      }

      const kimiText =
        getResultText(nextResult);

      if (kimiText) {
        setMessages((current) => [
          ...current,
          createMessage("Kimi", kimiText),
        ]);

        if (
          nextResult.action === "clarify" ||
          nextResult.action ===
            "prepare-tool"
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
      readTemporaryWorkspaceSession() as
        | StoredWorkspaceSession
        | null;

    if (!currentSession) {
      return;
    }

    const updatedSession =
      updateTemporaryWorkspaceSession({
        status: "active",
      });

    const activeSession =
      (updatedSession as StoredWorkspaceSession | null) ??
      currentSession;

    setSession(activeSession);

    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    const storedResult =
      getStoredResult(activeSession);

    const openingMessage = createMessage(
      "Ben",
      activeSession.intent.originalRequest
    );

    setMessages([openingMessage]);

    if (storedResult) {
      setResult(storedResult);

      if (
        storedResult.requiresConfirmation
      ) {
        setConfirmationPending(true);
      }

      const kimiText =
        getResultText(storedResult);

      if (kimiText) {
        setMessages([
          openingMessage,
          createMessage("Kimi", kimiText),
        ]);
      }

      return;
    }

    void runCompanion(
      activeSession.intent.originalRequest,
      [openingMessage]
    );
  }, []);

  function updateDocument(
    content: string
  ) {
    if (!result) {
      return;
    }

    const updatedResult: GatewayResult = {
      ...result,
      content,
    };

    setResult(updatedResult);

    const persistedSession =
      updateTemporaryWorkspaceSession({
        status: "active",
        gatewayResult: updatedResult,
      });

    if (persistedSession) {
      setSession(
        persistedSession as StoredWorkspaceSession
      );
    }

    setStatusMessage(
      "Changes saved automatically."
    );
  }

  function continueTask(answer: string) {
    const currentAnswer =
      answer.trim();

    if (
      !currentAnswer ||
      working ||
      !session
    ) {
      return;
    }

    if (
      confirmationPending &&
      isApproval(currentAnswer)
    ) {
      confirmNextStep();
      return;
    }

    if (
      result?.action !== "clarify" &&
      !result?.requiresConfirmation &&
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

    const currentDocument =
      result?.content ?? "";

    const continuedRequest = [
      session.intent.originalRequest,
      "",
      result?.action === "clarify"
        ? "The user is answering your most recent question."
        : result?.action ===
            "prepare-tool"
          ? "The user is continuing the prepared tool workflow."
          : "The user is requesting a change to the current document.",
      "",
      `The user's response is: ${currentAnswer}`,
      "",
      currentDocument
        ? "Update the existing document rather than starting again."
        : "Create the document using the available information.",
      "Use the response directly.",
      "Do not ask the user to repeat information already provided.",
      "Ask only one essential question at a time.",
      "When enough information is available, return the complete updated document.",
      "Keep conversational comments brief.",
    ].join("\n");

    void runCompanion(
      continuedRequest,
      nextMessages,
      currentDocument
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
    if (!result) {
      return;
    }

    speakText(getResultText(result));
  }

  function confirmNextStep() {
    if (
      !result ||
      !session ||
      working
    ) {
      return;
    }

    const confirmationMessage =
      createMessage(
        "Ben",
        "I confirm. Continue with the proposed next step."
      );

    const nextMessages = [
      ...messages,
      confirmationMessage,
    ];

    setMessages(nextMessages);
    setConfirmationPending(false);
    setReply("");
    setShowKeyboard(false);

    const confirmationRequest = [
      session.intent.originalRequest,
      "",
      "The user has explicitly confirmed the proposed consequential next step.",
      "",
      `Proposed next step: ${result.nextStep}`,
      "",
      "Proceed only as far as the available application capabilities allow.",
      "Do not claim that an external action was completed unless it was actually completed.",
      "Return the updated document or a clear description of what is now ready.",
    ].join("\n");

    void runCompanion(
      confirmationRequest,
      nextMessages,
      result.content
    );
  }

  function cancelConfirmation() {
    setConfirmationPending(false);

    setStatusMessage(
      "The proposed action was not confirmed. Nothing was sent, published, submitted, deleted or shared."
    );

    speakText(
      "Nothing was changed or sent."
    );
  }

  function returnToOffice() {
    stopAllSpeech();

    const persistedSession =
      updateTemporaryWorkspaceSession({
        status: "ready",
        ...(result
          ? { gatewayResult: result }
          : {}),
      });

    if (persistedSession) {
      setSession(
        persistedSession as StoredWorkspaceSession
      );
    }

    router.push("/office");
  }

  function saveForLater() {
    stopAllSpeech();

    const persistedSession =
      updateTemporaryWorkspaceSession({
        status: "ready",
        ...(result
          ? { gatewayResult: result }
          : {}),
      });

    if (persistedSession) {
      setSession(
        persistedSession as StoredWorkspaceSession
      );
    }

    router.push("/office");
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

  function discardWorkspace() {
    stopAllSpeech();
    clearTemporaryWorkspaceSession();

    setSession(null);
    setResult(null);
    setMessages([]);
    setReply("");
    setStatusMessage("");
    setError("");
    setConfirmationPending(false);

    router.push("/office");
  }

  const isClarifying =
    result?.action === "clarify";

  const isPreparingTool =
    result?.action === "prepare-tool";

  const hasEditableDocument =
    Boolean(
      result?.content &&
        result.action !== "clarify" &&
        result.action !==
          "prepare-tool"
    );

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
        <button
          type="button"
          onClick={returnToOffice}
          className="rounded-full border border-white/50 bg-white/72 px-4 py-2 text-sm shadow-sm backdrop-blur-md"
        >
          Back to Office
        </button>

        <button
          type="button"
          onClick={discardWorkspace}
          className="rounded-full border border-white/50 bg-white/72 px-4 py-2 text-sm shadow-sm backdrop-blur-md"
        >
          Discard
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
                    {isClarifying
                      ? "Working together"
                      : isPreparingTool
                        ? `${getToolName(
                            result.tool
                          )} tool`
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
                  Kimi is preparing the Workspace…
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

              {hasEditableDocument && (
                <textarea
                  value={result?.content ?? ""}
                  onChange={(event) =>
                    updateDocument(
                      event.target.value
                    )
                  }
                  aria-label="Working document"
                  className="min-h-[45vh] w-full resize-y rounded-2xl border border-black/10 bg-white/45 px-5 py-5 text-[1.05rem] leading-8 text-[#3e332c] outline-none transition focus:border-[#8a6b52]/50 focus:bg-white/65 focus:ring-4 focus:ring-[#8a6b52]/10 sm:px-7 sm:py-6"
                />
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

              {isPreparingTool && (
                <div className="mx-auto mt-8 max-w-2xl rounded-[1.75rem] border border-white/60 bg-[#f5eee3]/88 p-6 shadow-[0_16px_34px_rgba(73,53,36,0.12)] backdrop-blur-md sm:p-8">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8a7767]">
                    {getToolName(
                      result.tool
                    )}
                  </p>

                  <p className="mt-4 text-xl leading-8">
                    {result.content ||
                      result.nextStep ||
                      "The tool is ready."}
                  </p>

                  <button
                    type="button"
                    onClick={showTextInput}
                    className="mt-6 rounded-full bg-[#5f4938] px-5 py-3 text-sm font-medium text-white shadow-sm"
                  >
                    Continue
                  </button>
                </div>
              )}

              {confirmationPending &&
                result && (
                  <div className="mx-auto mt-8 max-w-2xl rounded-[1.75rem] border border-[#b4936f]/35 bg-[#f3e7d5] p-6 shadow-[0_16px_34px_rgba(73,53,36,0.12)] sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#80664f]">
                      Confirmation required
                    </p>

                    <p className="mt-4 text-lg leading-8">
                      {result.nextStep ||
                        "Kimi needs your confirmation before continuing."}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-[#77675a]">
                      Nothing consequential will happen until you confirm.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={
                          confirmNextStep
                        }
                        disabled={working}
                        className="rounded-full bg-[#5f4938] px-5 py-3 text-sm font-medium text-white shadow-sm disabled:opacity-50"
                      >
                        Confirm
                      </button>

                      <button
                        type="button"
                        onClick={
                          cancelConfirmation
                        }
                        disabled={working}
                        className="rounded-full border border-[#8b735f]/30 bg-white/70 px-5 py-3 text-sm font-medium text-[#5f4938] disabled:opacity-50"
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                )}

              {working && result && (
                <p className="mt-8 text-center text-sm text-[#75675c]">
                  Kimi is updating the Workspace…
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
                      : isPreparingTool
                        ? "Continue the task…"
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
                  Download
                </button>
              )}

              <button
                type="button"
                onClick={saveForLater}
                className="rounded-full bg-white/18 px-4 py-3 text-sm font-medium text-white shadow-sm"
              >
                Save for later
              </button>

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