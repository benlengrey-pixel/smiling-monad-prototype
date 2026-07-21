"use client";

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import ConversationDock from "@/components/companion/ConversationDock";
import type { ConversationMessage } from "@/components/companion/ConversationThread";
import {
  appendConversationMessage,
  readConversationMemory,
} from "@/lib/companion/conversation-memory-client";
import {
  getCompanionReply,
  runCompanionTurn,
  type CompanionConversationMessage,
} from "@/lib/companion/gateway-client";
import {
  speakCompanionResponse,
  stopCompanionSpeech,
} from "@/lib/companion/speech-client";
import {
  createEmptyCompanionState,
  type CompanionState,
} from "@/lib/companion/tool-executor";
import {
  isCompanionVoiceAvailable,
  startCompanionVoiceRecognition,
} from "@/lib/companion/voice-client";
import type {
  WorkspaceAttachment,
  WorkspaceAttachmentKind,
} from "@/lib/workspace/types";

type InteractionMode =
  | "voice"
  | "text";

const COMPANION_STATE_STORAGE_KEY =
  "smiling-monad-companion-state-v1";

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

function createGatewayConversation(
  messages: ConversationMessage[],
): CompanionConversationMessage[] {
  return messages.map((message) => ({
    role:
      message.speaker === "Ben"
        ? "user"
        : "assistant",
    content: message.text,
  }));
}

function getAttachmentKind(
  file: File,
): WorkspaceAttachmentKind {
  const name =
    file.name.toLowerCase();

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
      file.type ||
      "application/octet-stream",
    size: file.size,
    kind: getAttachmentKind(file),
    status: "selected",
    storageIntent: "use-once",
  };
}

function readCompanionState():
  CompanionState {
  if (typeof window === "undefined") {
    return createEmptyCompanionState();
  }

  try {
    const storedValue =
      window.localStorage.getItem(
        COMPANION_STATE_STORAGE_KEY,
      );

    if (!storedValue) {
      return createEmptyCompanionState();
    }

    const parsedValue =
      JSON.parse(
        storedValue,
      ) as Partial<CompanionState>;

    if (
      !Array.isArray(
        parsedValue.deskObjects,
      ) ||
      !Array.isArray(
        parsedValue.documents,
      ) ||
      !Array.isArray(
        parsedValue.temporaryTasks,
      )
    ) {
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
        parsedValue.workspaceOpen ??
        false,
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
    // The companion can continue even if
    // local storage is unavailable.
  }
}

export default function GlobalCompanionDock() {
  const pathname = usePathname();
  const router = useRouter();

  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [messages, setMessages] =
    useState<ConversationMessage[]>([]);

  const [request, setRequest] =
    useState("");

  const [mode, setMode] =
    useState<InteractionMode>("text");

  const [working, setWorking] =
    useState(false);

  const [listening, setListening] =
    useState(false);

  const [voiceMessage, setVoiceMessage] =
    useState("");

  const [expanded, setExpanded] =
    useState(false);

  const [attachments, setAttachments] =
    useState<WorkspaceAttachment[]>([]);

  const [companionState, setCompanionState] =
    useState<CompanionState>(
      createEmptyCompanionState(),
    );

  useEffect(() => {
    setMessages(
      readConversationMemory(),
    );

    setCompanionState(
      readCompanionState(),
    );
  }, []);

  async function sendRequest(
    requestText: string,
  ) {
    const cleanRequest =
      requestText.trim();

    if (!cleanRequest || working) {
      return;
    }

    stopCompanionSpeech();

    const userMessage =
      createMessage(
        "Ben",
        cleanRequest,
      );

    const conversationBeforeReply = [
      ...messages,
      userMessage,
    ];

    const storedUserMessages =
      appendConversationMessage(
        userMessage,
      );

    setMessages(storedUserMessages);
    setRequest("");
    setWorking(true);
    setExpanded(true);

    try {
      const result =
        await runCompanionTurn({
          request: cleanRequest,
          conversation:
            createGatewayConversation(
              conversationBeforeReply,
            ),
          memory: [
            pathname
              ? `Current page: ${pathname}`
              : "",
            attachments.length > 0
              ? `Selected files: ${attachments
                  .map(
                    (attachment) =>
                      attachment.name,
                  )
                  .join(", ")}`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
          state: companionState,
        });

      const replyText =
        getCompanionReply(result);

      const kimiMessage =
        createMessage(
          "Kimi",
          replyText,
        );

      const storedMessages =
        appendConversationMessage(
          kimiMessage,
        );

      setMessages(storedMessages);
      setAttachments([]);

      setCompanionState(
        result.execution.state,
      );

      saveCompanionState(
        result.execution.state,
      );

      if (
        result.execution.navigation
      ) {
        router.push(
          result.execution.navigation,
        );
      }

      void speakCompanionResponse(
        replyText,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Kimi could not respond.";

      const kimiMessage =
        createMessage(
          "Kimi",
          errorMessage,
        );

      setMessages(
        appendConversationMessage(
          kimiMessage,
        ),
      );
    } finally {
      setWorking(false);
    }
  }

  function submitRequest(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    void sendRequest(request);
  }

  function startVoice() {
    setMode("voice");
    setExpanded(true);
    setVoiceMessage("");

    if (
      !isCompanionVoiceAvailable()
    ) {
      setVoiceMessage(
        "Voice input is not available in this browser.",
      );
      return;
    }

    setListening(true);
    setVoiceMessage(
      "Listening…",
    );

    startCompanionVoiceRecognition({
      onTranscript: (transcript) => {
        setListening(false);
        setVoiceMessage(transcript);

        void sendRequest(transcript);
      },

      onError: () => {
        setListening(false);
        setVoiceMessage(
          "Microphone access was not available.",
        );
      },

      onEnd: () => {
        setListening(false);
      },
    });
  }

  function chooseText() {
    setMode("text");
    setExpanded(true);

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  function chooseFiles(
    files: File[],
  ) {
    setAttachments(
      files.map(
        createTemporaryAttachment,
      ),
    );

    setExpanded(true);
  }

  /*
   * The Office already owns this same dock.
   * Hiding the global copy there prevents
   * two chatboxes appearing at once.
   */
  if (pathname === "/office") {
    return null;
  }

  const isCirclePage =
    pathname === "/circle" ||
    pathname?.startsWith(
      "/circle/",
    );

  return (
    <div
      className={[
        "pointer-events-none fixed inset-x-0 top-0 z-[1000]",
        isCirclePage
          ? "bottom-[5.75rem] sm:bottom-[6.5rem]"
          : "bottom-0",
      ].join(" ")}
    >
      <ConversationDock
        messages={messages}
        mode={mode}
        inputRef={inputRef}
        request={request}
        working={working}
        listening={listening}
        voiceMessage={voiceMessage}
        expanded={expanded}
        attachments={attachments}
        onExpandedChange={
          setExpanded
        }
        onRequestChange={
          setRequest
        }
        onSubmit={
          submitRequest
        }
        onChooseText={
          chooseText
        }
        onStartVoice={
          startVoice
        }
        onChooseFiles={
          chooseFiles
        }
      />
    </div>
  );
}