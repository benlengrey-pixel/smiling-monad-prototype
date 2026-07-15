"use client";

import {
  type FormEvent,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import CompanionControls from "@/components/companion/CompanionControls";
import ConversationThread, {
  type ConversationMessage,
} from "@/components/companion/ConversationThread";
import OfficeEnvironment from "@/components/office/OfficeEnvironment";
import { stopCompanionSpeech } from "@/lib/companion/speech-client";
import {
  isCompanionVoiceAvailable,
  startCompanionVoiceRecognition,
} from "@/lib/companion/voice-client";
import {
  createSmilingMonadIntent,
  type SmilingMonadIntent,
} from "@/lib/intent/intent-engine";
import {
  createTemporaryWorkspaceSession,
  saveTemporaryWorkspaceSession,
} from "@/lib/workspace/session-client";
import type {
  WorkspaceAttachment,
  WorkspaceAttachmentKind,
} from "@/lib/workspace/types";

type InteractionMode = "voice" | "text";

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

function getAttachmentKind(
  file: File
): WorkspaceAttachmentKind {
  const name = file.name.toLowerCase();

  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (
    file.type === "text/plain" ||
    file.type === "text/csv" ||
    name.endsWith(".txt") ||
    name.endsWith(".csv")
  ) {
    return "text";
  }

  if (
    file.type.includes("spreadsheet") ||
    file.type.includes("excel") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx")
  ) {
    return "spreadsheet";
  }

  if (
    file.type.includes("word") ||
    file.type.includes("document") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return "document";
  }

  return "other";
}

function createTemporaryAttachment(
  file: File
): WorkspaceAttachment {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    mimeType:
      file.type || "application/octet-stream",
    size: file.size,
    kind: getAttachmentKind(file),
    status: "selected",
    storageIntent: "use-once",
  };
}

function createMessage(
  speaker: "Ben" | "Kimi",
  text: string
): ConversationMessage {
  return {
    id: crypto.randomUUID(),
    speaker,
    text,
  };
}

function getDeskObjectLabel(
  intent: SmilingMonadIntent
): string {
  switch (intent.kind) {
    case "report":
      return "Report";

    case "correspondence":
      return "Correspondence";

    case "document":
      return "Document";

    case "planning":
      return "Planner";

    case "meeting":
      return "Meeting notes";

    case "research":
      return "Research";

    case "files":
      return "Files";

    case "wellbeing":
      return "Wellbeing";

    default:
      return "Current task";
  }
}

function getPreparedMessage(
  intent: SmilingMonadIntent
): string {
  switch (intent.kind) {
    case "report":
      return "I've placed the report on the desk.";

    case "correspondence":
      return "I've placed the correspondence on the desk.";

    case "document":
      return "I've placed the document on the desk.";

    case "planning":
      return "I've placed the planner on the desk.";

    case "meeting":
      return "I've placed the meeting notes on the desk.";

    case "research":
      return "I've placed the research task on the desk.";

    case "files":
      return "I've placed the file task on the desk.";

    case "wellbeing":
      return "I've prepared the wellbeing session.";

    default:
      return "I've placed the task on the desk.";
  }
}

export default function OfficePage() {
  const router = useRouter();
  const textInputRef =
    useRef<HTMLInputElement>(null);

  const [request, setRequest] = useState("");
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>("text");
  const [listening, setListening] =
    useState(false);
  const [working, setWorking] =
    useState(false);
  const [voiceMessage, setVoiceMessage] =
    useState("");
  const [attachments, setAttachments] =
    useState<WorkspaceAttachment[]>([]);
  const [pendingIntent, setPendingIntent] =
    useState<SmilingMonadIntent | null>(
      null
    );
  const [messages, setMessages] = useState<
    ConversationMessage[]
  >([]);

  function addMessage(
    speaker: "Ben" | "Kimi",
    text: string
  ) {
    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage(speaker, text),
    ]);
  }

  async function handleRequest(
    message?: string
  ) {
    const currentRequest = (
      message ?? request
    ).trim();

    if (!currentRequest || working) {
      return;
    }

    stopCompanionSpeech();

    const intent =
      createSmilingMonadIntent(
        currentRequest
      );

    addMessage("Ben", currentRequest);

    setRequest("");
    setVoiceMessage("");
    setListening(false);

    if (intent.destination === "workspace") {
      setPendingIntent(intent);
      addMessage(
        "Kimi",
        getPreparedMessage(intent)
      );
      return;
    }

    setPendingIntent(null);
    setWorking(true);

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
            request: currentRequest,
            memory: "",
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
            : "The Companion could not respond."
        );
      }

      const result = data as GatewayResult;
      const responseText =
        result.action === "clarify"
          ? result.question
          : result.content;

      addMessage(
        "Kimi",
        responseText ||
          "I'm here with you."
      );
    } catch (caughtError) {
      addMessage(
        "Kimi",
        caughtError instanceof Error
          ? caughtError.message
          : "I could not respond just now."
      );
    } finally {
      setWorking(false);
    }
  }

  function submitText(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    void handleRequest();
  }

  function chooseText() {
    setInteractionMode("text");
    setVoiceMessage("");

    window.setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  }

  function chooseFiles(files: File[]) {
    const selectedAttachments =
      files.map(
        createTemporaryAttachment
      );

    setAttachments(
      (currentAttachments) => [
        ...currentAttachments,
        ...selectedAttachments,
      ]
    );
  }

  function startVoice() {
    stopCompanionSpeech();
    setInteractionMode("voice");
    setVoiceMessage("");

    if (!isCompanionVoiceAvailable()) {
      setVoiceMessage(
        "Voice is not available in this browser. Use the keyboard button."
      );
      return;
    }

    setListening(true);
    setVoiceMessage("Listening…");

    startCompanionVoiceRecognition({
      onTranscript: (transcript) => {
        setVoiceMessage(
          `You said: ${transcript}`
        );
        void handleRequest(transcript);
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

  function openPendingTask() {
    if (!pendingIntent) {
      return;
    }

    const session =
      createTemporaryWorkspaceSession(
        pendingIntent
      );

    saveTemporaryWorkspaceSession(
      session
    );

    router.push("/workspace");
  }

  function dismissPendingTask() {
    setPendingIntent(null);
    setAttachments([]);
    addMessage(
      "Kimi",
      "Okay. I've cleared it from the desk."
    );
  }

  return (
    <OfficeEnvironment>
      <ConversationThread
        messages={messages}
        working={working}
      />

      {pendingIntent && (
        <div className="pointer-events-auto absolute left-1/2 top-[51%] z-30 w-[min(12rem,48vw)] -translate-x-1/2 sm:left-[48%] sm:top-[58%] sm:w-44">
          <button
            type="button"
            onClick={openPendingTask}
            aria-label={`Open ${pendingIntent.title}`}
            className="group block w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-[#6d513a]/25"
          >
            <div className="relative h-20 rounded-md border border-[#8a6749]/40 bg-[linear-gradient(165deg,#8f6849,#5f4431)] shadow-[0_12px_22px_rgba(47,32,22,0.35)] transition group-hover:-translate-y-1 group-hover:shadow-[0_17px_28px_rgba(47,32,22,0.4)]">
              <div className="absolute left-2 top-2 h-[calc(100%-0.75rem)] w-[calc(100%-0.75rem)] rounded-sm border border-[#d2b28d]/25" />

              <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center">
                <p className="line-clamp-2 text-xs font-semibold tracking-wide text-[#f6eadc]">
                  {getDeskObjectLabel(
                    pendingIntent
                  )}
                </p>
              </div>

              <div className="absolute bottom-0 left-0 h-2 w-full rounded-b-md bg-[#402d20]/45" />
            </div>
          </button>

          <button
            type="button"
            onClick={dismissPendingTask}
            className="mx-auto mt-2 block rounded-full bg-white/75 px-3 py-1 text-[11px] text-[#665647] shadow-sm backdrop-blur-sm"
          >
            Clear
          </button>
        </div>
      )}

      <div className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-1rem)] -translate-x-1/2 sm:bottom-auto sm:top-[63%] sm:w-auto">
        <CompanionControls
          mode={interactionMode}
          inputRef={textInputRef}
          request={request}
          working={working}
          listening={listening}
          voiceMessage={voiceMessage}
          attachments={attachments}
          onRequestChange={setRequest}
          onSubmit={submitText}
          onChooseText={chooseText}
          onStartVoice={startVoice}
          onChooseFiles={chooseFiles}
        />
      </div>
    </OfficeEnvironment>
  );
}