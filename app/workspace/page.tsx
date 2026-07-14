"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import WorkspaceAssistant from "@/components/workspace/WorkspaceAssistant";
import WorkspaceCanvas from "@/components/workspace/WorkspaceCanvas";
import WorkspaceDocument from "@/components/workspace/WorkspaceDocument";
import WorkspacePanel from "@/components/workspace/WorkspacePanel";
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
  isCompanionVoiceAvailable,
  startCompanionVoiceRecognition,
} from "@/lib/companion/voice-client";
import {
  createWorkspaceComposition,
  type WorkspacePanel as WorkspacePanelDefinition,
} from "@/lib/workspace/composer";
import {
  clearTemporaryWorkspaceSession,
  readTemporaryWorkspaceSession,
  type TemporaryWorkspaceSession,
} from "@/lib/workspace/session-client";

function getResponseText(result: GatewayResponse): string {
  if (result.action === "clarify") {
    return result.question;
  }

  return result.content;
}

function getPanelPlaceholder(panel: WorkspacePanelDefinition) {
  switch (panel.type) {
    case "attachments":
      return (
        <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-[#8f7d6e]/25 bg-white/20 p-6">
          <p className="max-w-sm text-center text-sm leading-6 text-[#77695e]">
            Only files added for this task will appear here. They remain
            temporary unless you choose to save them.
          </p>
        </div>
      );

    case "checklist":
      return (
        <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-[#8f7d6e]/25 bg-white/20 p-6">
          <p className="max-w-sm text-center text-sm leading-6 text-[#77695e]">
            Required actions will appear here as they are identified.
          </p>
        </div>
      );

    case "calendar":
      return (
        <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-[#8f7d6e]/25 bg-white/20 p-6">
          <p className="max-w-sm text-center text-sm leading-6 text-[#77695e]">
            Only dates and times relevant to this task will appear here.
          </p>
        </div>
      );

    case "meeting":
      return (
        <div className="flex min-h-[32dvh] items-center justify-center rounded-2xl border border-dashed border-[#8f7d6e]/25 bg-white/20 p-6">
          <p className="max-w-md text-center text-base leading-7 text-[#77695e]">
            Meeting access, live notes and required materials will appear here
            only while the meeting is active.
          </p>
        </div>
      );

    case "notes":
      return (
        <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-[#8f7d6e]/25 bg-white/20 p-6">
          <p className="max-w-sm text-center text-sm leading-6 text-[#77695e]">
            Notes relevant to the current task will appear here.
          </p>
        </div>
      );

    case "conversation":
    case "document":
      return null;
  }
}

export default function WorkspacePage() {
  const router = useRouter();
  const taskStartedRef = useRef(false);

  const [session, setSession] =
    useState<TemporaryWorkspaceSession | null>(null);
  const [ready, setReady] = useState(false);
  const [request, setRequest] = useState("");
  const [response, setResponse] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [working, setWorking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");

  const composition = useMemo(() => {
    if (!session) {
      return null;
    }

    return createWorkspaceComposition(session.request);
  }, [session]);

  useEffect(() => {
    const currentSession = readTemporaryWorkspaceSession();

    setSession(currentSession);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!session || taskStartedRef.current) {
      return;
    }

    taskStartedRef.current = true;
    void workWithCompanion(session.request);
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

  async function workWithCompanion(message?: string) {
    const currentRequest = (message ?? request).trim();

    if (!session || !currentRequest || working) {
      return;
    }

    stopCompanionSpeech();
    setWorking(true);
    setVoiceMessage("");

    try {
      const memory =
        window.localStorage.getItem("smiling-monad-memory") || "[]";

      const gatewayRequest = `
Active Workspace task:
${session.request}

Current working document:
${documentContent || "No working document exists yet."}

Previous Companion response:
${response || "No previous response exists yet."}

User's instruction:
${currentRequest}

Continue working on the same task. If the user is creating or revising a report,
letter, note, plan, email or other usable document, return action "draft" and put
the complete updated document in content. Otherwise respond conversationally.
`;

      const result = await sendGatewayRequest(gatewayRequest, memory);
      const responseText = getResponseText(result);

      if (result.action === "draft") {
        setDocumentContent(result.content);
        setResponse(
          result.question ||
            "I have updated the working document. You can review or edit it."
        );
      } else {
        setResponse(responseText);
      }

      setRequest("");

      speakCompanionResponse(
        result.action === "draft"
          ? "I have updated the working document."
          : responseText
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The Companion could not respond.";

      setResponse(message);
      speakCompanionResponse(message);
    } finally {
      setWorking(false);
    }
  }

  function startVoice() {
    stopCompanionSpeech();
    setVoiceMessage("");

    if (!isCompanionVoiceAvailable()) {
      setVoiceMessage(
        "Voice is not available in this browser. Use the keyboard instead."
      );
      return;
    }

    setListening(true);
    setVoiceMessage("Listening…");

    startCompanionVoiceRecognition({
      onTranscript: (transcript) => {
        setVoiceMessage(`You said: ${transcript}`);
        void workWithCompanion(transcript);
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

  function renderSupportingPanel(panel: WorkspacePanelDefinition) {
    if (panel.type === "conversation" || panel.type === "document") {
      return null;
    }

    return (
      <WorkspacePanel
        key={panel.id}
        type={panel.type}
        title={panel.title}
        purpose={panel.purpose}
        primary={panel.primary}
      >
        {getPanelPlaceholder(panel)}
      </WorkspacePanel>
    );
  }

  const hasDocument =
    composition?.panels.some((panel) => panel.type === "document") ?? false;

  const supportingPanels =
    composition?.panels.filter(
      (panel) =>
        panel.type !== "conversation" && panel.type !== "document"
    ) ?? [];

  return (
    <WorkspaceShell
      onBackToOffice={returnToOffice}
      onDiscard={discardWorkspace}
      showDiscard={Boolean(session)}
    >
      {!ready ? (
        <div className="flex min-h-[calc(100dvh-7.5rem)] items-center justify-center px-6">
          <p className="text-base text-[#6f6257]">
            Preparing the Workspace…
          </p>
        </div>
      ) : session && composition ? (
        <div className="min-h-[calc(100dvh-7.5rem)] p-4 sm:p-6">
          <WorkspaceCanvas
            title={session.request}
            description="Only the work and tools relevant to this task are visible."
          >
            <div className="grid gap-4">
              {hasDocument && (
                <WorkspacePanel
                  type="document"
                  title="Working document"
                  purpose="Review, edit and refine the current document."
                  primary
                >
                  <WorkspaceDocument
                    content={documentContent}
                    working={working}
                    onContentChange={setDocumentContent}
                  />
                </WorkspacePanel>
              )}

              {!hasDocument && supportingPanels.length === 0 && (
                <WorkspaceAssistant
                  response={response}
                  request={request}
                  working={working}
                  listening={listening}
                  voiceMessage={voiceMessage}
                  onRequestChange={setRequest}
                  onSubmit={() => {
                    void workWithCompanion();
                  }}
                  onStartVoice={startVoice}
                />
              )}

              {supportingPanels.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {supportingPanels.map(renderSupportingPanel)}
                </div>
              )}

              {hasDocument && (
                <WorkspaceAssistant
                  response={response}
                  request={request}
                  working={working}
                  listening={listening}
                  voiceMessage={voiceMessage}
                  onRequestChange={setRequest}
                  onSubmit={() => {
                    void workWithCompanion();
                  }}
                  onStartVoice={startVoice}
                />
              )}
            </div>
          </WorkspaceCanvas>
        </div>
      ) : (
        <div className="flex min-h-[calc(100dvh-7.5rem)] items-center justify-center px-6">
          <div className="max-w-md text-center">
            <p className="text-sm uppercase tracking-[0.18em] text-[#85776b]">
              Workspace
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#332a23] sm:text-4xl">
              No active task.
            </h1>

            <p className="mt-4 text-base leading-7 text-[#6f6257] sm:text-lg">
              Begin work from the Office. The current task will then appear
              here temporarily.
            </p>

            <button
              type="button"
              onClick={returnToOffice}
              className="mt-8 rounded-full bg-[#6d513a] px-6 py-3 text-base font-medium text-white shadow-lg"
            >
              Return to Office
            </button>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}