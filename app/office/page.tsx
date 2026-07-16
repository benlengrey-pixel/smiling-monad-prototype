"use client";

import {
  type FormEvent,
  useMemo,
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
      return "I've placed the Reports folder on the desk.";
    case "correspondence":
      return "I've placed the mail folder on the desk.";
    case "document":
      return "I've placed the documents folder on the desk.";
    case "planning":
      return "I've placed the planner on the desk.";
    case "meeting":
      return "I've placed the meeting folder on the desk.";
    case "research":
      return "I've placed the research folder on the desk.";
    case "files":
      return "I've placed the file folder on the desk.";
    case "wellbeing":
      return "I've prepared the wellbeing activity.";
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

function getPreviewTitle(
  intent: SmilingMonadIntent
): string {
  switch (intent.kind) {
    case "report":
      return "Shift Report Preview";
    case "document":
      return "Document Preview";
    case "correspondence":
      return "Correspondence Preview";
    case "planning":
      return "Planning Preview";
    case "research":
      return "Research Preview";
    case "meeting":
      return "Meeting Preview";
    case "files":
      return "File Preview";
    case "wellbeing":
      return "Wellbeing Preview";
    default:
      return "Task Preview";
  }
}

function getPreviewBody(
  intent: SmilingMonadIntent
): string[] {
  switch (intent.kind) {
    case "report":
      return [
        "Date: [Insert date]",
        "Participant: [Insert participant name]",
        "Support worker: Ben",
        "Shift time: [Insert start and finish time]",
        "Activities completed",
        "Observations and mood",
        "Outcome and next steps",
      ];

    case "document":
      return [
        "Working draft ready for review.",
        "Main sections prepared.",
        "Open in Workspace to continue writing.",
      ];

    case "correspondence":
      return [
        "Draft correspondence prepared.",
        "Subject and main message ready.",
        "Open in Workspace to refine or send.",
      ];

    case "planning":
      return [
        "Planning structure prepared.",
        "Main steps and checklist ready.",
        "Open in Workspace to continue.",
      ];

    case "research":
      return [
        "Research notes prepared.",
        "Key findings can be reviewed.",
        "Open in Workspace for full work.",
      ];

    case "meeting":
      return [
        "Meeting notes structure prepared.",
        "Agenda and note sections ready.",
        "Open in Workspace to continue.",
      ];

    case "files":
      return [
        "Selected files are ready.",
        "Review items before continuing.",
        "Open in Workspace to work on them.",
      ];

    case "wellbeing":
      return [
        "Wellbeing activity prepared.",
        "Tools are ready in the Workspace.",
        "Open to begin the session.",
      ];

    default:
      return [
        "Task prepared and ready to review.",
      ];
  }
}

function getPreviewPlainText(
  intent: SmilingMonadIntent
): string {
  return [
    getPreviewTitle(intent),
    "",
    ...getPreviewBody(intent),
  ].join("\n");
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
  const [folderPreviewOpen, setFolderPreviewOpen] =
    useState(false);
  const [useOptionsOpen, setUseOptionsOpen] =
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
      setFolderPreviewOpen(false);
      setUseOptionsOpen(false);

      addMessage(
        "Kimi",
        getPreparedMessage(intent)
      );
      return;
    }

    setPendingIntent(null);
    setFolderPreviewOpen(false);
    setUseOptionsOpen(false);
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

  function toggleFolderPreview() {
    setFolderPreviewOpen((current) => {
      const nextValue = !current;
      if (!nextValue) {
        setUseOptionsOpen(false);
      }
      return nextValue;
    });
  }

  async function copyPreview() {
    if (!pendingIntent) return;

    try {
      await navigator.clipboard.writeText(
        getPreviewPlainText(pendingIntent)
      );
      addMessage(
        "Kimi",
        "The preview text has been copied."
      );
      setConversationExpanded(true);
    } catch {
      addMessage(
        "Kimi",
        "I could not copy that just now."
      );
      setConversationExpanded(true);
    }
  }

  async function sharePreview() {
    if (!pendingIntent) return;

    const text = getPreviewPlainText(
      pendingIntent
    );

    try {
      if (navigator.share) {
        await navigator.share({
          title: getPreviewTitle(
            pendingIntent
          ),
          text,
        });
        addMessage(
          "Kimi",
          "The preview is ready to share."
        );
      } else {
        await navigator.clipboard.writeText(
          text
        );
        addMessage(
          "Kimi",
          "Sharing is not available here, so I copied the preview instead."
        );
      }

      setConversationExpanded(true);
    } catch {
      addMessage(
        "Kimi",
        "Sharing was cancelled."
      );
      setConversationExpanded(true);
    }
  }

  const previewLines = useMemo(() => {
    if (!pendingIntent) return [];
    return getPreviewBody(pendingIntent);
  }, [pendingIntent]);

  return (
    <OfficeEnvironment>
      {pendingIntent &&
        folderPreviewOpen && (
          <div className="pointer-events-none absolute left-1/2 top-[9%] z-30 w-[calc(100%-2rem)] max-w-[34rem] -translate-x-1/2 sm:top-[8%] sm:max-w-[38rem]">
            <div className="pointer-events-auto rounded-[28px] border border-[#d9ccb8] bg-[rgba(252,247,239,0.96)] p-4 shadow-[0_24px_48px_rgba(60,36,15,0.22)] backdrop-blur-[3px] sm:p-5">
              <div className="rounded-[24px] border border-[#e1d6c4] bg-[#fffaf2] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#907963] sm:text-xs">
                      Current preview
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#49372a] sm:text-2xl">
                      {pendingIntent
                        ? getPreviewTitle(
                            pendingIntent
                          )
                        : "Preview"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFolderPreviewOpen(false);
                      setUseOptionsOpen(false);
                    }}
                    className="rounded-full bg-[#f0e5d5] px-3 py-1.5 text-sm text-[#5d4839] shadow-sm transition hover:bg-[#eadcc9]"
                  >
                    Close
                  </button>
                </div>

                <div className="rounded-[18px] border border-[#eadfce] bg-[#f8f2e9] p-4 text-[#4a392d] shadow-[0_10px_20px_rgba(60,36,15,0.06)]">
                  <div className="mb-3 border-b border-[#e6d9c5] pb-3">
                    <p className="text-sm text-[#7b6858]">
                      {pendingIntent?.originalRequest}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm leading-6 sm:text-base">
                    {previewLines.map((line) => (
                      <p
                        key={line}
                        className="whitespace-pre-wrap"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setUseOptionsOpen(
                        (current) => !current
                      )
                    }
                    className="rounded-full bg-[#6c4b32] px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_18px_rgba(60,36,15,0.18)] transition hover:bg-[#5a3f2b]"
                  >
                    Use
                  </button>

                  <button
                    type="button"
                    onClick={openPendingTask}
                    className="rounded-full bg-[#efe4d5] px-5 py-2.5 text-sm font-medium text-[#4b392d] shadow-sm transition hover:bg-[#e7d8c3]"
                  >
                    Work on
                  </button>
                </div>

                {useOptionsOpen && (
                  <div className="mt-4 rounded-[18px] border border-[#e6d9c8] bg-[#f5ede2] p-3">
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[#8d775f]">
                      Use options
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={copyPreview}
                        className="rounded-full bg-white px-4 py-2 text-sm text-[#4b392d] shadow-sm transition hover:bg-[#faf6ef]"
                      >
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={sharePreview}
                        className="rounded-full bg-white px-4 py-2 text-sm text-[#4b392d] shadow-sm transition hover:bg-[#faf6ef]"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      <Desk>
        {pendingIntent && (
          <div className="pointer-events-auto absolute bottom-[4%] left-[34%] -translate-x-1/2 sm:bottom-[6%] sm:left-[33%]">
            <DeskTaskObject
              intent={pendingIntent}
              previewOpen={folderPreviewOpen}
              onTogglePreview={toggleFolderPreview}
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