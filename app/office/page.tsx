"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ConversationDock from "@/components/companion/ConversationDock";
import type { ConversationMessage } from "@/components/companion/ConversationThread";
import Desk from "@/components/office/Desk";
import DeskTaskObject from "@/components/office/DeskTaskObject";
import OfficeEnvironment from "@/components/office/OfficeEnvironment";
import {
  appendConversationMessage,
  readConversationMemory,
} from "@/lib/companion/conversation-memory-client";
import {
  getCompanionReply,
  runCompanionTurn,
  type CompanionConversationMessage,
} from "@/lib/companion/gateway-client";
import { stopCompanionSpeech } from "@/lib/companion/speech-client";
import {
  type CompanionState,
  createEmptyCompanionState,
  type DeskObject,
  type WorkspaceDocument,
} from "@/lib/companion/tool-executor";
import {
  isCompanionVoiceAvailable,
  startCompanionVoiceRecognition,
} from "@/lib/companion/voice-client";
import type {
  WorkspaceAttachment,
  WorkspaceAttachmentKind,
} from "@/lib/workspace/types";

type InteractionMode = "voice" | "text";

const COMPANION_STATE_STORAGE_KEY =
  "smiling-monad-companion-state-v1";

function getAttachmentKind(
  file: File,
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
  file: File,
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
  text: string,
): ConversationMessage {
  return {
    id: crypto.randomUUID(),
    speaker,
    text,
  };
}

function isExpandRequest(
  text: string,
): boolean {
  const value = text.toLowerCase();

  return [
    "expand chat",
    "expand conversation",
    "open chat",
    "show conversation",
    "show chat",
  ].some((command) =>
    value.includes(command),
  );
}

function isCollapseRequest(
  text: string,
): boolean {
  const value = text.toLowerCase();

  return [
    "collapse chat",
    "collapse conversation",
    "close chat",
    "hide conversation",
    "minimise chat",
    "minimize chat",
  ].some((command) =>
    value.includes(command),
  );
}

function isCompanionState(
  value: unknown,
): value is CompanionState {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const state =
    value as Partial<CompanionState>;

  return (
    Array.isArray(state.deskObjects) &&
    Array.isArray(state.documents) &&
    Array.isArray(state.temporaryTasks) &&
    typeof state.workspaceOpen === "boolean"
  );
}

function readSavedCompanionState(): CompanionState {
  if (typeof window === "undefined") {
    return createEmptyCompanionState();
  }

  try {
    const savedValue =
      window.localStorage.getItem(
        COMPANION_STATE_STORAGE_KEY,
      );

    if (!savedValue) {
      return createEmptyCompanionState();
    }

    const parsedValue =
      JSON.parse(savedValue) as unknown;

    if (!isCompanionState(parsedValue)) {
      return createEmptyCompanionState();
    }

    return {
      deskObjects:
        parsedValue.deskObjects,
      documents:
        parsedValue.documents,
      temporaryTasks:
        parsedValue.temporaryTasks,
      activeDeskObjectId:
        parsedValue.activeDeskObjectId ??
        null,
      activeDocumentId:
        parsedValue.activeDocumentId ??
        null,
      workspaceOpen:
        parsedValue.workspaceOpen,
    };
  } catch {
    return createEmptyCompanionState();
  }
}

function saveCompanionState(
  state: CompanionState,
) {
  try {
    window.localStorage.setItem(
      COMPANION_STATE_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // The Space can continue without local persistence.
  }
}

function getConversationForGateway(
  rememberedMessages: Array<{
    speaker: "Ben" | "Kimi";
    text: string;
  }>,
  currentRequest: string,
): CompanionConversationMessage[] {
  const conversation: CompanionConversationMessage[] =
    rememberedMessages.map(
      (
        rememberedMessage,
      ): CompanionConversationMessage => ({
        role:
          rememberedMessage.speaker === "Ben"
            ? "user"
            : "assistant",
        content:
          rememberedMessage.text,
      }),
    );

  conversation.push({
    role: "user",
    content: currentRequest,
  });

  return conversation.slice(-20);
}

function getFolderLabel(
  object: DeskObject,
): string {
  const value =
    `${object.kind} ${object.title}`.toLowerCase();

  if (value.includes("report")) {
    return "REPORTS";
  }

  if (
    value.includes("mail") ||
    value.includes("email") ||
    value.includes("correspondence") ||
    value.includes("letter")
  ) {
    return "MAIL";
  }

  if (
    value.includes("note") ||
    value.includes("meeting")
  ) {
    return "NOTES";
  }

  if (value.includes("plan")) {
    return "PLANNING";
  }

  if (value.includes("research")) {
    return "RESEARCH";
  }

  if (
    value.includes("wellbeing") ||
    value.includes("wellness")
  ) {
    return "WELLBEING";
  }

  if (value.includes("file")) {
    return "FILES";
  }

  if (value.includes("workspace")) {
    return "WORKSPACE";
  }

  return "DOCUMENT";
}

function getLinkedDocument(
  object: DeskObject | null,
  documents: WorkspaceDocument[],
  activeDocumentId: string | null,
): WorkspaceDocument | null {
  if (object?.documentId) {
    const linkedDocument =
      documents.find(
        (document) =>
          document.id ===
          object.documentId,
      );

    if (linkedDocument) {
      return linkedDocument;
    }
  }

  if (activeDocumentId) {
    const activeDocument =
      documents.find(
        (document) =>
          document.id ===
          activeDocumentId,
      );

    if (activeDocument) {
      return activeDocument;
    }
  }

  return documents.at(-1) ?? null;
}

function getPreviewPlainText(
  object: DeskObject,
  document: WorkspaceDocument | null,
): string {
  return [
    document?.title ||
      object.title ||
      "Smiling Monad Document",
    "",
    document?.content || "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function OfficePage() {
  const textInputRef =
    useRef<HTMLInputElement>(null);

  const stateRestoredRef =
    useRef(false);

  const [request, setRequest] =
    useState("");

  const [
    interactionMode,
    setInteractionMode,
  ] = useState<InteractionMode>("text");

  const [listening, setListening] =
    useState(false);

  const [working, setWorking] =
    useState(false);

  const [voiceMessage, setVoiceMessage] =
    useState("");

  const [attachments, setAttachments] =
    useState<WorkspaceAttachment[]>([]);

  const [messages, setMessages] = useState<
    ConversationMessage[]
  >([]);

  const [
    conversationExpanded,
    setConversationExpanded,
  ] = useState(false);

  const [
    folderPreviewOpen,
    setFolderPreviewOpen,
  ] = useState(false);

  const [
    useOptionsOpen,
    setUseOptionsOpen,
  ] = useState(false);

  const [
    companionState,
    setCompanionState,
  ] = useState<CompanionState>(
    createEmptyCompanionState,
  );

  useEffect(() => {
    if (stateRestoredRef.current) {
      return;
    }

    stateRestoredRef.current = true;

    setCompanionState(
      readSavedCompanionState(),
    );
  }, []);

  useEffect(() => {
    if (!stateRestoredRef.current) {
      return;
    }

    saveCompanionState(companionState);
  }, [companionState]);

  const visibleDeskObjects =
    useMemo(
      () =>
        companionState.deskObjects.filter(
          (object) =>
            object.status !== "archived",
        ),
      [companionState.deskObjects],
    );

  const primaryDeskObject =
    useMemo(() => {
      if (
        companionState.activeDeskObjectId
      ) {
        const activeObject =
          visibleDeskObjects.find(
            (object) =>
              object.id ===
              companionState.activeDeskObjectId,
          );

        if (activeObject) {
          return activeObject;
        }
      }

      return visibleDeskObjects.at(-1) ?? null;
    }, [
      companionState.activeDeskObjectId,
      visibleDeskObjects,
    ]);

  const previewDocument =
    useMemo(
      () =>
        getLinkedDocument(
          primaryDeskObject,
          companionState.documents,
          companionState.activeDocumentId,
        ),
      [
        primaryDeskObject,
        companionState.documents,
        companionState.activeDocumentId,
      ],
    );

  const previewParagraphs =
    useMemo(() => {
      if (!previewDocument?.content) {
        return [];
      }

      return previewDocument.content
        .split(/\n{2,}/)
        .map((paragraph) =>
          paragraph.trim(),
        )
        .filter(Boolean);
    }, [previewDocument]);

  function addMessage(
    speaker: "Ben" | "Kimi",
    text: string,
  ) {
    const message =
      createMessage(speaker, text);

    appendConversationMessage(message);

    setMessages((currentMessages) => [
      ...currentMessages,
      message,
    ]);
  }

  async function handleRequest(
    message?: string,
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

    const rememberedConversation =
      readConversationMemory();

    const conversationForGateway =
      getConversationForGateway(
        rememberedConversation,
        currentRequest,
      );

    addMessage("Ben", currentRequest);

    setConversationExpanded(true);
    setRequest("");
    setVoiceMessage("");
    setListening(false);
    setWorking(true);

    try {
      const result =
        await runCompanionTurn({
          request: currentRequest,
          memory: "",
          conversation:
            conversationForGateway,
          state: companionState,
        });

      const nextState =
        result.execution.state;

      setCompanionState(nextState);

      addMessage(
        "Kimi",
        getCompanionReply(result),
      );

      const deskChanged =
        JSON.stringify(
          nextState.deskObjects,
        ) !==
        JSON.stringify(
          companionState.deskObjects,
        );

      const documentChanged =
        JSON.stringify(
          nextState.documents,
        ) !==
        JSON.stringify(
          companionState.documents,
        );

      if (
        deskChanged ||
        documentChanged
      ) {
        setFolderPreviewOpen(false);
        setUseOptionsOpen(false);
      }

      const removedActiveObject =
        primaryDeskObject !== null &&
        !nextState.deskObjects.some(
          (object) =>
            object.id ===
            primaryDeskObject.id,
        );

      if (removedActiveObject) {
        setFolderPreviewOpen(false);
        setUseOptionsOpen(false);
      }

      const hasVisibleDeskObject =
        nextState.deskObjects.some(
          (object) =>
            object.status !== "archived",
        );

      if (
        hasVisibleDeskObject &&
        result.execution.completedActions
          .length > 0
      ) {
        setConversationExpanded(false);
      }
    } catch (caughtError) {
      addMessage(
        "Kimi",
        caughtError instanceof Error
          ? caughtError.message
          : "I could not respond just now.",
      );
    } finally {
      setWorking(false);
    }
  }

  function submitText(
    event: FormEvent<HTMLFormElement>,
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

  function chooseFiles(
    files: File[],
  ) {
    setConversationExpanded(true);

    setAttachments(
      (currentAttachments) => [
        ...currentAttachments,
        ...files.map(
          createTemporaryAttachment,
        ),
      ],
    );
  }

  function startVoice() {
    stopCompanionSpeech();

    setInteractionMode("voice");
    setConversationExpanded(true);
    setVoiceMessage("");

    if (!isCompanionVoiceAvailable()) {
      setVoiceMessage(
        "Voice is not available in this browser. Use the keyboard button.",
      );
      return;
    }

    setListening(true);
    setVoiceMessage("Listening…");

    startCompanionVoiceRecognition({
      onTranscript: (transcript) => {
        setVoiceMessage(
          `You said: ${transcript}`,
        );

        void handleRequest(transcript);
      },

      onError: () => {
        setListening(false);

        setVoiceMessage(
          "I could not hear that. Press the microphone and try again.",
        );
      },

      onEnd: () => {
        setListening(false);
      },
    });
  }

  function openPendingTask() {
    if (!primaryDeskObject) {
      return;
    }

    setCompanionState((currentState) => ({
      ...currentState,
      activeDeskObjectId:
        primaryDeskObject.id,
      activeDocumentId:
        previewDocument?.id ??
        currentState.activeDocumentId,
      workspaceOpen: true,
    }));

    setFolderPreviewOpen(true);
    setUseOptionsOpen(false);
    setConversationExpanded(false);
  }

  function toggleFolderPreview() {
    if (!primaryDeskObject) {
      return;
    }

    setConversationExpanded(false);

    setCompanionState((currentState) => ({
      ...currentState,
      activeDeskObjectId:
        primaryDeskObject.id,
      activeDocumentId:
        previewDocument?.id ??
        currentState.activeDocumentId,
    }));

    setFolderPreviewOpen(
      (currentValue) => {
        const nextValue =
          !currentValue;

        if (!nextValue) {
          setUseOptionsOpen(false);
        }

        return nextValue;
      },
    );
  }

  function closeFolderPreview() {
    setFolderPreviewOpen(false);
    setUseOptionsOpen(false);

    setCompanionState((currentState) => ({
      ...currentState,
      workspaceOpen: false,
    }));
  }

  async function copyPreview() {
    if (!primaryDeskObject) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        getPreviewPlainText(
          primaryDeskObject,
          previewDocument,
        ),
      );

      addMessage(
        "Kimi",
        "The document has been copied.",
      );

      setConversationExpanded(true);
    } catch {
      addMessage(
        "Kimi",
        "I could not copy that just now.",
      );

      setConversationExpanded(true);
    }
  }

  async function sharePreview() {
    if (!primaryDeskObject) {
      return;
    }

    const text =
      getPreviewPlainText(
        primaryDeskObject,
        previewDocument,
      );

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            previewDocument?.title ||
            primaryDeskObject.title ||
            "Smiling Monad Document",
          text,
        });

        addMessage(
          "Kimi",
          "The document is ready to share.",
        );
      } else {
        await navigator.clipboard.writeText(
          text,
        );

        addMessage(
          "Kimi",
          "Sharing is not available here, so I copied the document instead.",
        );
      }

      setConversationExpanded(true);
    } catch {
      addMessage(
        "Kimi",
        "Sharing was cancelled.",
      );

      setConversationExpanded(true);
    }
  }

  return (
    <OfficeEnvironment>
      {primaryDeskObject &&
        folderPreviewOpen && (
          <div className="pointer-events-none absolute inset-x-0 top-[3%] z-30 flex justify-center px-3 sm:top-[6%] sm:px-6">
            <div className="pointer-events-auto relative w-full max-w-[35rem] sm:max-w-[39rem]">
              <div className="relative mx-auto w-[94%]">
                <div className="absolute left-[5%] right-[5%] top-[10%] h-[90%] rounded-t-[28px] rounded-b-[34px] border border-[#3c2417] bg-[linear-gradient(135deg,#70482f_0%,#3d2619_46%,#765036_100%)] shadow-[0_25px_45px_rgba(34,18,8,0.38)]">
                  <div className="absolute inset-[7px] rounded-t-[22px] rounded-b-[28px] border border-[rgba(226,180,125,0.25)]" />

                  <div className="absolute inset-x-[7%] top-[10%] h-[76%] rounded-t-[18px] bg-[linear-gradient(180deg,#d7bd91_0%,#bea174_100%)] shadow-inner" />

                  <div className="absolute left-[18%] top-[5%] h-8 w-[34%] rotate-[-2deg] rounded-t-lg bg-[#caa877]" />

                  <div className="absolute right-[15%] top-[7%] h-8 w-[31%] rotate-[2deg] rounded-t-lg bg-[#d9bd91]" />
                </div>

                <article className="relative z-10 mx-auto max-h-[65vh] min-h-[29rem] w-[82%] overflow-y-auto border border-[#d8cdbb] bg-[linear-gradient(105deg,#fffdf7_0%,#f8f1e5_50%,#fffdf8_100%)] px-7 pb-8 pt-7 text-[#3d3027] shadow-[0_20px_38px_rgba(39,22,10,0.26)] sm:max-h-[69vh] sm:min-h-[37rem] sm:px-10 sm:pb-10 sm:pt-9">
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-[#75695f] sm:text-xs">
                    Preview
                  </p>

                  <h2 className="mt-3 text-center font-serif text-[2rem] leading-tight sm:text-[2.5rem]">
                    {previewDocument?.title ||
                      primaryDeskObject.title ||
                      "Smiling Monad Document"}
                  </h2>

                  <div className="mt-5 flex items-center justify-center gap-3 sm:mt-6">
                    <div className="h-px flex-1 bg-[#958777]" />

                    <div className="flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28">
                      <img
                        src="/branding/logo.png"
                        alt="The Smiling Monad"
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="h-px flex-1 bg-[#958777]" />
                  </div>

                  <div className="mt-7 space-y-5 font-serif text-[16px] leading-7 sm:text-[18px]">
                    {previewParagraphs.length >
                    0 ? (
                      previewParagraphs.map(
                        (paragraph, index) => (
                          <p
                            key={`${index}-${paragraph.slice(
                              0,
                              30,
                            )}`}
                            className="whitespace-pre-wrap"
                          >
                            {paragraph}
                          </p>
                        ),
                      )
                    ) : (
                      <p>
                        This document is ready
                        for review.
                      </p>
                    )}
                  </div>

                  <div className="mt-7 grid grid-cols-3 gap-3 font-serif text-sm sm:mt-8 sm:text-base">
                    <button
                      type="button"
                      onClick={openPendingTask}
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
                      onClick={closeFolderPreview}
                      className="border border-[#9b8d7c] bg-[rgba(255,255,255,0.35)] px-2 py-3 transition hover:bg-[#f5ecdf]"
                    >
                      Close
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setUseOptionsOpen(
                        (current) =>
                          !current,
                      )
                    }
                    className="mt-4 w-full border border-[#b4a592] bg-[#f3eadc] px-3 py-2 font-serif text-sm transition hover:bg-[#fffaf2]"
                  >
                    Copy or share
                  </button>

                  {useOptionsOpen && (
                    <div className="mt-3 border border-[#cbbca8] bg-[#f1e7d7] p-3">
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

                <div className="relative z-20 mx-auto -mt-7 h-[8rem] w-full rounded-b-[34px] border border-[#3c2417] bg-[linear-gradient(165deg,#795238_0%,#41291c_50%,#6a452f_100%)] shadow-[0_18px_35px_rgba(35,18,8,0.4)] sm:-mt-9 sm:h-[10rem]">
                  <div className="absolute inset-[7px] rounded-b-[27px] border border-[rgba(229,183,129,0.24)]" />

                  <div className="absolute left-1/2 top-3 h-7 w-7 -translate-x-1/2 rounded-full border-2 border-[#382319] bg-[radial-gradient(circle,#c3924c_0%,#7b4f24_45%,#3f2819_100%)] shadow-md">
                    <div className="absolute inset-[7px] rounded-full bg-[#21140e]" />
                  </div>

                  <div className="absolute left-[13%] top-[-1.4rem] rounded-t-lg border border-[#9b774f] bg-[#c8a372] px-5 py-2 font-serif text-sm tracking-[0.1em] text-[#4a3424] shadow-sm">
                    {getFolderLabel(
                      primaryDeskObject,
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      <Desk>
        {primaryDeskObject &&
          !folderPreviewOpen && (
            <div className="pointer-events-auto absolute bottom-[30%] left-[34%] -translate-x-1/2 sm:bottom-[12%] sm:left-[33%]">
              <DeskTaskObject
                object={primaryDeskObject}
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