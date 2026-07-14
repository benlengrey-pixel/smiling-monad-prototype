"use client";

import {
  type FormEvent,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import CompanionControls from "@/components/companion/CompanionControls";
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

function getFolderLabel(
  intent: SmilingMonadIntent
): string {
  switch (intent.kind) {
    case "report":
      return "Report ready to begin";

    case "correspondence":
      return "Correspondence ready";

    case "document":
      return "Document task ready";

    case "planning":
      return "Planning task ready";

    case "meeting":
      return "Meeting task ready";

    case "research":
      return "Research task ready";

    case "files":
      return "File task ready";

    case "wellbeing":
      return "Wellbeing session ready";

    default:
      return "Task ready";
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
  const [voiceMessage, setVoiceMessage] =
    useState("");
  const [attachments, setAttachments] =
    useState<WorkspaceAttachment[]>([]);
  const [pendingIntent, setPendingIntent] =
    useState<SmilingMonadIntent | null>(
      null
    );

  function prepareTask(message?: string) {
    const currentRequest = (
      message ?? request
    ).trim();

    if (!currentRequest) {
      return;
    }

    stopCompanionSpeech();

    const intent =
      createSmilingMonadIntent(
        currentRequest
      );

    setPendingIntent(intent);
    setRequest("");
    setVoiceMessage("");
    setListening(false);
  }

  function submitText(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    prepareTask();
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
        prepareTask(transcript);
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
  }

  return (
    <OfficeEnvironment>
      {pendingIntent && (
        <div className="pointer-events-auto absolute left-1/2 top-[47%] z-30 w-[min(19rem,72vw)] -translate-x-1/2 sm:left-auto sm:right-[9%] sm:top-[49%] sm:w-72 sm:translate-x-0">
          <button
            type="button"
            onClick={openPendingTask}
            className="group relative block w-full text-left focus:outline-none focus:ring-4 focus:ring-[#6d513a]/25"
            aria-label={`Open ${pendingIntent.title}`}
          >
            <div className="absolute left-4 top-0 h-6 w-28 rounded-t-xl border border-[#c49a63]/45 border-b-0 bg-[#e8c790]/95 shadow-sm" />

            <div className="relative mt-5 rounded-2xl border border-[#bd8f55]/45 bg-[linear-gradient(145deg,rgba(244,216,166,0.98),rgba(211,166,101,0.98))] px-5 py-5 shadow-[0_18px_35px_rgba(70,45,24,0.28)] transition group-hover:-translate-y-1 group-hover:shadow-[0_24px_44px_rgba(70,45,24,0.34)]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#76552f]">
                {getFolderLabel(
                  pendingIntent
                )}
              </p>

              <h2 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 text-[#3b2818]">
                {pendingIntent.title}
              </h2>

              <p className="mt-3 text-sm text-[#745537]">
                Open in Workspace
              </p>

              {attachments.length > 0 && (
                <p className="mt-2 text-xs text-[#806342]">
                  {attachments.length} temporary{" "}
                  {attachments.length === 1
                    ? "file"
                    : "files"}{" "}
                  selected
                </p>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={dismissPendingTask}
            className="mx-auto mt-2 block rounded-full bg-white/80 px-4 py-2 text-xs text-[#665647] shadow-md backdrop-blur-md"
          >
            Dismiss
          </button>
        </div>
      )}

      {!pendingIntent && (
        <div className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-1rem)] -translate-x-1/2 sm:bottom-auto sm:top-[63%] sm:w-auto">
          <CompanionControls
            mode={interactionMode}
            inputRef={textInputRef}
            request={request}
            working={false}
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
      )}
    </OfficeEnvironment>
  );
}