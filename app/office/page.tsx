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
      return "Shift Report";
    case "document":
      return "Document";
    case "correspondence":
      return "Correspondence";
    case "planning":
      return "Planning";
    case "research":
      return "Research";
    case "meeting":
      return "Meeting Notes";
    case "files":
      return "Files";
    case "wellbeing":
      return "Wellbeing";
    default:
      return "Task";
  }
}

function getFolderLabel(
  intent: SmilingMonadIntent
): string {
  switch (intent.kind) {
    case "report":
      return "REPORTS";
    case "document":
      return "DOCUMENTS";
    case "correspondence":
      return "MAIL";
    case "planning":
      return "PLANNING";
    case "research":
      return "RESEARCH";
    case "meeting":
      return "MEETINGS";
    case "files":
      return "FILES";
    case "wellbeing":
      return "WELLBEING";
    default:
      return "TASK";
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

  const isReport =
    pendingIntent?.kind === "report";

  return (
    <OfficeEnvironment>
      {pendingIntent &&
        folderPreviewOpen && (
          <div className="pointer-events-none absolute inset-x-0 top-[6.5%] z-30 flex justify-center px-3 sm:top-[6%] sm:px-6">
            <div className="pointer-events-auto relative w-full max-w-[35rem] sm:max-w-[39rem]">
              <div className="relative mx-auto w-[94%]">
                <div className="absolute left-[5%] right-[5%] top-[10%] h-[90%] rounded-t-[28px] rounded-b-[34px] border border-[#3c2417] bg-[linear-gradient(135deg,#70482f_0%,#3d2619_46%,#765036_100%)] shadow-[0_25px_45px_rgba(34,18,8,0.38)]">
                  <div className="absolute inset-[7px] rounded-t-[22px] rounded-b-[28px] border border-[rgba(226,180,125,0.25)]" />

                  <div className="absolute inset-x-[7%] top-[10%] h-[76%] rounded-t-[18px] bg-[linear-gradient(180deg,#d7bd91_0%,#bea174_100%)] shadow-inner" />

                  <div className="absolute left-[18%] top-[5%] h-8 w-[34%] rotate-[-2deg] rounded-t-lg bg-[#caa877]" />

                  <div className="absolute right-[15%] top-[7%] h-8 w-[31%] rotate-[2deg] rounded-t-lg bg-[#d9bd91]" />
                </div>

                <article className="relative z-10 mx-auto w-[82%] min-h-[32rem] border border-[#d8cdbb] bg-[linear-gradient(105deg,#fffdf7_0%,#f8f1e5_50%,#fffdf8_100%)] px-7 pb-8 pt-7 text-[#3d3027] shadow-[0_20px_38px_rgba(39,22,10,0.26)] sm:min-h-[37rem] sm:px-10 sm:pb-10 sm:pt-9">
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-[#75695f] sm:text-xs">
                    Preview
                  </p>

                  <h2 className="mt-3 text-center font-serif text-[2rem] leading-none sm:text-[2.5rem]">
                    {getPreviewTitle(
                      pendingIntent
                    )}
                  </h2>

                  <div className="mt-5 flex items-center justify-center gap-3 sm:mt-6">
                    <div className="h-px flex-1 bg-[#958777]" />

                    <div className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#4e4035] sm:h-12 sm:w-12">
                      <div className="absolute top-[8px] h-2 w-2 rounded-full bg-[#4e4035]" />

                      <div className="absolute bottom-[7px] h-5 w-7 rounded-b-full border-b-2 border-l-2 border-r-2 border-[#4e4035]" />

                      <div className="absolute left-[8px] top-[15px] h-2 w-2 rounded-full bg-[#4e4035]" />

                      <div className="absolute right-[8px] top-[15px] h-2 w-2 rounded-full bg-[#4e4035]" />
                    </div>

                    <div className="h-px flex-1 bg-[#958777]" />
                  </div>

                  {isReport ? (
                    <div className="mt-6 space-y-4 font-serif text-[15px] sm:mt-7 sm:text-[17px]">
                      <div className="grid grid-cols-[7.5rem_1fr] gap-2">
                        <span>Date:</span>
                        <span>
                          [Insert date]
                        </span>
                      </div>

                      <div className="grid grid-cols-[7.5rem_1fr] gap-2">
                        <span>
                          Participant:
                        </span>
                        <span>
                          [Insert participant name]
                        </span>
                      </div>

                      <div className="grid grid-cols-[7.5rem_1fr] gap-2">
                        <span>
                          Support worker:
                        </span>
                        <span>Ben</span>
                      </div>

                      <div className="grid grid-cols-[7.5rem_1fr] gap-2">
                        <span>
                          Shift time:
                        </span>
                        <span>
                          [Insert start and finish time]
                        </span>
                      </div>

                      <div className="pt-2">
                        <p>
                          Activities completed
                        </p>
                        <div className="mt-3 h-px bg-[#b7aa9b]" />
                      </div>

                      <div>
                        <p>
                          Observations and mood
                        </p>
                        <div className="mt-3 h-px bg-[#b7aa9b]" />
                      </div>

                      <div>
                        <p>
                          Outcome and next steps
                        </p>
                        <div className="mt-3 h-px bg-[#b7aa9b]" />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-7 space-y-5 font-serif text-[16px] leading-7 sm:text-[18px]">
                      {previewLines.map(
                        (line) => (
                          <div key={line}>
                            <p>{line}</p>
                            <div className="mt-3 h-px bg-[#b7aa9b]" />
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="mt-7 grid grid-cols-3 gap-3 font-serif text-sm sm:mt-8 sm:text-base">
                    <button
                      type="button"
                      onClick={() =>
                        setUseOptionsOpen(
                          (current) =>
                            !current
                        )
                      }
                      className="border border-[#63442e] bg-[#64432d] px-2 py-3 text-[#fffaf2] shadow-sm transition hover:bg-[#543824]"
                    >
                      Use
                    </button>

                    <button
                      type="button"
                      onClick={openPendingTask}
                      className="border border-[#9b8d7c] bg-[rgba(255,255,255,0.35)] px-2 py-3 transition hover:bg-[#f5ecdf]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFolderPreviewOpen(
                          false
                        );
                        setUseOptionsOpen(
                          false
                        );
                      }}
                      className="border border-[#9b8d7c] bg-[rgba(255,255,255,0.35)] px-2 py-3 transition hover:bg-[#f5ecdf]"
                    >
                      Cancel
                    </button>
                  </div>

                  {useOptionsOpen && (
                    <div className="mt-4 border border-[#cbbca8] bg-[#f1e7d7] p-3">
                      <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-[#77695d]">
                        Use report
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={copyPreview}
                          className="border border-[#aa9b89] bg-[#fffaf2] px-3 py-2 text-sm transition hover:bg-white"
                        >
                          Copy
                        </button>

                        <button
                          type="button"
                          onClick={sharePreview}
                          className="border border-[#aa9b89] bg-[#fffaf2] px-3 py-2 text-sm transition hover:bg-white"
                        >
                          Share
                        </button>
                      </div>
                    </div>
                  )}
                </article>

                <div className="relative z-20 mx-auto -mt-7 h-[8.5rem] w-full rounded-b-[34px] border border-[#3c2417] bg-[linear-gradient(165deg,#795238_0%,#41291c_50%,#6a452f_100%)] shadow-[0_18px_35px_rgba(35,18,8,0.4)] sm:-mt-9 sm:h-[10rem]">
                  <div className="absolute inset-[7px] rounded-b-[27px] border border-[rgba(229,183,129,0.24)]" />

                  <div className="absolute left-1/2 top-3 h-7 w-7 -translate-x-1/2 rounded-full border-2 border-[#382319] bg-[radial-gradient(circle,#c3924c_0%,#7b4f24_45%,#3f2819_100%)] shadow-md">
                    <div className="absolute inset-[7px] rounded-full bg-[#21140e]" />
                  </div>

                  <div className="absolute left-[13%] top-[-1.4rem] rounded-t-lg border border-[#9b774f] bg-[#c8a372] px-5 py-2 font-serif text-sm tracking-[0.1em] text-[#4a3424] shadow-sm">
                    {getFolderLabel(
                      pendingIntent
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      <Desk>
        {pendingIntent &&
          !folderPreviewOpen && (
            <div className="pointer-events-auto absolute bottom-[4%] left-[34%] -translate-x-1/2 sm:bottom-[6%] sm:left-[33%]">
              <DeskTaskObject
                intent={pendingIntent}
                previewOpen={
                  folderPreviewOpen
                }
                onTogglePreview={
                  toggleFolderPreview
                }
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
        onExpandedChange={
          setConversationExpanded
        }
        onRequestChange={setRequest}
        onSubmit={submitText}
        onChooseText={chooseText}
        onStartVoice={startVoice}
        onChooseFiles={chooseFiles}
      />
    </OfficeEnvironment>
  );
}