"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import WorkspaceCanvas from "@/components/workspace/WorkspaceCanvas";
import WorkspaceConversation from "@/components/workspace/WorkspaceConversation";
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

export default function WorkspacePage() {
  const router = useRouter();

  const [session, setSession] =
    useState<TemporaryWorkspaceSession | null>(null);
  const [ready, setReady] = useState(false);
  const [request, setRequest] = useState("");
  const [response, setResponse] = useState("");
  const [working, setWorking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");

  useEffect(() => {
    const currentSession = readTemporaryWorkspaceSession();

    setSession(currentSession);

    if (currentSession) {
      setRequest(currentSession.request);
    }

    setReady(true);
  }, []);

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

      const gatewayRequest = response
        ? `
Active Workspace task:
${session.request}

Previous Companion response:
${response}

User's next instruction:
${currentRequest}

Continue working on the same task. Use the previous response as context.
`
        : `
Active Workspace task:
${session.request}

Begin working on this task:
${currentRequest}
`;

      const result = await sendGatewayRequest(gatewayRequest, memory);
      const responseText = getResponseText(result);

      setResponse(responseText);
      setRequest("");

      speakCompanionResponse(responseText);
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
      ) : session ? (
        <div className="min-h-[calc(100dvh-7.5rem)] p-4 sm:p-6">
          <WorkspaceCanvas
            title={session.request}
            description="This task is temporary. Only the conversation and tools needed to complete it will appear here."
          >
            <WorkspaceConversation
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