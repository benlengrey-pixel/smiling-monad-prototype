"use client";

import {
  type FormEvent,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import ConversationDock from "@/components/companion/ConversationDock";
import type { ConversationMessage } from "@/components/companion/ConversationThread";
import Desk from "@/components/office/Desk";
import DeskTaskObject from "@/components/office/DeskTaskObject";
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

  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";

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
      return intent.originalRequest
        .toLowerCase()
        .includes("music")
        ? "I've placed the headphones on the desk."
        : "I've prepared the wellbeing activity.";
    default:
      return "I've placed the task on the desk.";
  }
}

function isExpandRequest(text: string): boolean {
  const value = text.toLowerCase();

  return [
    "expand chat",
    "expand conversation",
    "open chat",
    "show conversation",
    "show chat",
  ].some((command) => value.includes(command));
}

function isCollapseRequest(text: string): boolean {
  const value = text.toLowerCase();

  return [
    "collapse chat",
    "collapse conversation",
    "close chat",
    "hide conversation",
    "minimise chat",
    "minimize chat",
  ].some((command) => value.includes(command));
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
  const [conversationExpanded, setConversationExpanded] =
    useState(false);

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

    if (isExpandRequest(currentRequest)) {
      setConversationExpanded(true);
      setRequest("");
      setVoiceMessage("");
      return;
    }

    if (isCollapseRequest(currentRequest)) {
      setConversationExpanded(false);
      setRequest("");
      setVoiceMessage("");
      return;
    }

    stopCompanionSpeech();

    const intent =
      createSmilingMonadIntent(
        currentRequest
      );

    addMessage("Ben", currentRequest);
    setConversationExpanded(true);
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
    setConversationExpanded(true);

    window.setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  }

  function chooseFiles(files: File[]) {
    setConversationExpanded(true);
    setAttachments(
      (currentAttachments) => [
        ...currentAttachments,
        ...files.map(
          createTemporaryAttachment
        ),
      ]
    );
  }

  function startVoice() {
    stopCompanionSpeech();
    setInteractionMode("voice");
    setConversationExpanded(true);
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
    if (!pendingIntent) return;

    const session =
      createTemporaryWorkspaceSession(
        pendingIntent
      );

    saveTemporaryWorkspaceSession(
      session
    );

    router.push("/workspace");
  }

  return (
    <OfficeEnvironment>
      <Desk>
        {pendingIntent && (
          <div className="pointer-events-auto absolute bottom-0 left-[34%] -translate-x-1/2">
            <DeskTaskObject
              intent={pendingIntent}
              onOpen={openPendingTask}
            />
          </div>
        )}
      </Desk>

      <ConversationDock
        messages={messages}
        mode={interactionMode}
        inputRef={textInputRef}
        request={request}
        working={working}
        listening={listening}
        voiceMessage={voiceMessage}
        expanded={conversationExpanded}
        attachments={attachments}
        onExpandedChange={setConversationExpanded}
        onRequestChange={setRequest}
        onSubmit={submitText}
        onChooseText={chooseText}
        onStartVoice={startVoice}
        onChooseFiles={chooseFiles}
      />
    </OfficeEnvironment>
  );
}