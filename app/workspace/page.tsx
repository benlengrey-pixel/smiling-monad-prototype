"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import {
  sendGatewayRequest,
  type GatewayResponse,
} from "@/lib/companion/gateway-client";
import {
  speakCompanionResponse,
  stopCompanionSpeech,
} from "@/lib/companion/speech-client";
import {
  clearTemporaryWorkspaceSession,
  readTemporaryWorkspaceSession,
  updateTemporaryWorkspaceSession,
  type TemporaryWorkspaceSession,
} from "@/lib/workspace/session-client";

function getResponseText(result: GatewayResponse): string {
  if (result.action === "clarify") {
    return result.question;
  }

  return result.content;
}

export default function WorkspacePage() {
  const router = useRouter();
  const startedRef = useRef(false);

  const [session, setSession] =
    useState<TemporaryWorkspaceSession | null>(null);
  const [ready, setReady] = useState(false);
  const [request, setRequest] = useState("");
  const [response, setResponse] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentSession = readTemporaryWorkspaceSession();

    setSession(currentSession);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!session || startedRef.current) {
      return;
    }

    if (!session.intent.shouldStartAutomatically) {
      return;
    }

    startedRef.current = true;

    updateTemporaryWorkspaceSession({
      status: "active",
    });

    void workWithCompanion(
      session.intent.originalRequest,
      session
    );
  }, [session]);

  function returnToOffice() {
    stopCompanionSpeech();
    router.push("/office");
  }

  function discardWorkspace() {
    stopCompanionSpeech();
    clearTemporaryWorkspaceSession();
    router.push("/office");
  }

  async function workWithCompanion(
    message: string,
    activeSession: TemporaryWorkspaceSession
  ) {
    const currentRequest = message.trim();

    if (!currentRequest || working) {
      return;
    }

    stopCompanionSpeech();
    setWorking(true);
    setError("");

    try {
      const memory =
        window.localStorage.getItem(
          "smiling-monad-memory"
        ) || "[]";

      const gatewayRequest = `
ORIGINAL TASK:
${activeSession.intent.originalRequest}

TASK TYPE:
${activeSession.intent.kind}

PREVIOUS COMPANION RESPONSE:
${response || "None yet."}

CURRENT WORKING DOCUMENT:
${documentContent || "None yet."}

CURRENT USER INSTRUCTION:
${currentRequest}

Continue the same task.

Do not ask the user to repeat the original request.

Ask only one genuinely necessary question.

If this task requires a usable document, report, note,
agreement, email, letter or plan, return action "draft"
and place the complete current draft in content.
`;

      const result = await sendGatewayRequest(
        gatewayRequest,
        memory
      );

      if (result.action === "draft") {
        setDocumentContent(result.content);
        setResponse(
          result.question ||
            "I have prepared the working draft. Review it or tell me what to change."
        );

        speakCompanionResponse(
          result.question ||
            "I have prepared the working draft."
        );
      } else {
        const responseText = getResponseText(result);

        setResponse(responseText);
        speakCompanionResponse(responseText);
      }

      setRequest("");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "The Companion could not complete the request.";

      setError(message);
    } finally {
      setWorking(false);
    }
  }

  function submitRequest(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!session || !request.trim()) {
      return;
    }

    void workWithCompanion(request, session);
  }

  const title =
    session?.intent.title ||
    session?.intent.originalRequest ||
    "Current task";

  return (
    <WorkspaceShell
      onBackToOffice={returnToOffice}
      onDiscard={discardWorkspace}
      showDiscard={Boolean(session)}
    >
      {!ready ? (
        <main className="flex min-h-[calc(100dvh-7rem)] items-center justify-center px-6">
          <p className="text-base text-[#6f6257]">
            Preparing the Workspace…
          </p>
        </main>
      ) : !session ? (
        <main className="flex min-h-[calc(100dvh-7rem)] items-center justify-center px-6">
          <div className="max-w-md text-center">
            <p className="text-sm uppercase tracking-[0.18em] text-[#85776b]">
              Workspace
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-[#332a23]">
              No active task
            </h1>

            <p className="mt-4 text-base leading-7 text-[#6f6257]">
              Begin a task from the Office.
            </p>

            <button
              type="button"
              onClick={returnToOffice}
              className="mt-8 rounded-full bg-[#6d513a] px-6 py-3 text-base font-medium text-white shadow-lg"
            >
              Return to Office
            </button>
          </div>
        </main>
      ) : (
        <main className="min-h-[calc(100dvh-7rem)] p-4 sm:p-6">
          <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-[#f7f2eb]/90 shadow-[0_24px_70px_rgba(70,50,35,0.16)] backdrop-blur-md">
            <header className="border-b border-[#9b8978]/15 px-6 py-7 sm:px-10">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8a7b6f]">
                Active work
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#362d26] sm:text-4xl">
                {title}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-[#74675c]">
                Only the conversation and tools needed for
                this task appear here.
              </p>
            </header>

            <div className="grid gap-5 p-5 sm:p-8">
              {working && !response && !documentContent && (
                <div className="rounded-[1.5rem] border border-white/80 bg-white/65 p-6 shadow-sm">
                  <p className="text-base text-[#6f6257]">
                    Kimi is preparing the task…
                  </p>
                </div>
              )}

              {documentContent && (
                <section className="rounded-[1.5rem] border border-white/80 bg-white/75 shadow-sm">
                  <div className="border-b border-[#9b8978]/15 px-6 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8a7b6f]">
                      Working document
                    </p>
                  </div>

                  <textarea
                    value={documentContent}
                    onChange={(event) =>
                      setDocumentContent(event.target.value)
                    }
                    className="min-h-[22rem] w-full resize-y bg-transparent px-6 py-5 text-base leading-7 text-[#3f352e] outline-none"
                    aria-label="Working document"
                  />
                </section>
              )}

              {response && (
                <section className="rounded-[1.5rem] border border-white/80 bg-white/75 px-6 py-5 shadow-sm">
                  <p className="whitespace-pre-wrap text-base leading-7 text-[#463b33]">
                    {response}
                  </p>
                </section>
              )}

              {error && (
                <section className="rounded-[1.5rem] border border-red-200 bg-red-50 px-6 py-5">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </section>
              )}

              <form
                onSubmit={submitRequest}
                className="flex overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/80 p-2 shadow-sm"
              >
                <input
                  value={request}
                  onChange={(event) =>
                    setRequest(event.target.value)
                  }
                  placeholder="Continue working on this task"
                  disabled={working}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-[#3f352e] outline-none placeholder:text-[#9a9088]"
                />

                <button
                  type="submit"
                  disabled={working || !request.trim()}
                  className="rounded-2xl bg-[#76583f] px-6 py-3 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {working ? "Working…" : "Send"}
                </button>
              </form>
            </div>
          </section>
        </main>
      )}
    </WorkspaceShell>
  );
}