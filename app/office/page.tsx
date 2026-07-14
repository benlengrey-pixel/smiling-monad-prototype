"use client";

import { FormEvent, useRef, useState } from "react";

import CompanionControls from "@/components/companion/CompanionControls";
import CompanionWorkspace from "@/components/companion/CompanionWorkspace";
import OfficeEnvironment from "@/components/office/OfficeEnvironment";
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
import type {
  WorkspaceAttachment,
  WorkspaceAttachmentKind,
} from "@/lib/workspace/types";

type CompanionResult = GatewayResponse;

type SavedMemory = {
  request: string;
  application: string;
  title: string;
  approvedContent: string;
};

type InteractionMode = "voice" | "text";

function getSpokenResponse(result: CompanionResult): string {
  if (result.action === "clarify") {
    return result.question;
  }

  return result.content;
}

function getAttachmentKind(file: File): WorkspaceAttachmentKind {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (
    file.type === "text/plain" ||
    file.type === "text/csv" ||
    file.name.toLowerCase().endsWith(".txt") ||
    file.name.toLowerCase().endsWith(".csv")
  ) {
    return "text";
  }

  if (
    file.type.includes("spreadsheet") ||
    file.type.includes("excel") ||
    file.name.toLowerCase().endsWith(".xls") ||
    file.name.toLowerCase().endsWith(".xlsx")
  ) {
    return "spreadsheet";
  }

  if (
    file.type.includes("word") ||
    file.type.includes("document") ||
    file.name.toLowerCase().endsWith(".doc") ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    return "document";
  }

  return "other";
}

function createTemporaryAttachment(file: File): WorkspaceAttachment {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    kind: getAttachmentKind(file),
    status: "selected",
    storageIntent: "use-once",
  };
}

export default function OfficePage() {
  const textInputRef = useRef<HTMLInputElement>(null);

  const [request, setRequest] = useState("");
  const [originalRequest, setOriginalRequest] = useState("");
  const [result, setResult] = useState<CompanionResult | null>(null);
  const [working, setWorking] = useState(false);
  const [approvedContent, setApprovedContent] = useState("");
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>("text");
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [attachments, setAttachments] = useState<WorkspaceAttachment[]>([]);

  async function askCompanion(message?: string) {
    const currentRequest = (message ?? request).trim();

    if (!currentRequest || working) return;

    stopCompanionSpeech();
    setWorking(true);
    setVoiceMessage("");

    if (!originalRequest) {
      setOriginalRequest(currentRequest);
    }

    try {
      const memory =
        window.localStorage.getItem("smiling-monad-memory") || "[]";

      const data = await sendGatewayRequest(currentRequest, memory);

      setResult(data);
      setApprovedContent(data.content || "");
      setRequest("");

      speakCompanionResponse(getSpokenResponse(data));
    } catch (error) {
      const errorResult: CompanionResult = {
        action: "answer",
        application: "general",
        title: "Something went wrong",
        question: "",
        content:
          error instanceof Error
            ? error.message
            : "The Companion could not respond.",
      };

      setResult(errorResult);
      speakCompanionResponse(errorResult.content);
    } finally {
      setWorking(false);
    }
  }

  function submitText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askCompanion();
  }

  function chooseText() {
    setInteractionMode("text");
    setVoiceMessage("");

    window.setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  }

  function chooseFiles(files: File[]) {
    const selectedAttachments = files.map(createTemporaryAttachment);

    setAttachments((currentAttachments) => [
      ...currentAttachments,
      ...selectedAttachments,
    ]);
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
        setVoiceMessage(`You said: ${transcript}`);
        void askCompanion(transcript);
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

  function answerQuestion(message?: string) {
    const currentAnswer = (message ?? request).trim();

    if (!result?.question || !currentAnswer) return;

    const combinedRequest = `
Original request:
${originalRequest}

The Companion asked:
${result.question}

User's answer:
${currentAnswer}
`;

    void askCompanion(combinedRequest);
  }

  function continueConversation(message?: string) {
    const followUp = (message ?? request).trim();

    if (!result || !followUp) return;

    const previousContent =
      result.action === "draft" ? approvedContent : result.content;

    const combinedRequest = `
Original request:
${originalRequest}

Previous Companion response:
Title: ${result.title}
${previousContent}

User's follow-up:
${followUp}

Continue the same conversation. Use the original request and previous response as context.
`;

    void askCompanion(combinedRequest);
  }

  function startWorkspaceVoice() {
    stopCompanionSpeech();
    setInteractionMode("voice");
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

        if (result?.action === "clarify") {
          answerQuestion(transcript);
          return;
        }

        continueConversation(transcript);
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

  async function approve() {
    if (!result || !approvedContent.trim()) return;

    const existingMemory = JSON.parse(
      window.localStorage.getItem("smiling-monad-memory") || "[]"
    ) as SavedMemory[];

    const updatedMemory: SavedMemory[] = [
      ...existingMemory,
      {
        request: originalRequest,
        application: result.application,
        title: result.title,
        approvedContent: approvedContent.trim(),
      },
    ].slice(-10);

    window.localStorage.setItem(
      "smiling-monad-memory",
      JSON.stringify(updatedMemory)
    );

    await fetch("/api/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memory: updatedMemory,
      }),
    });

    closeWork();
  }

  function closeWork() {
    stopCompanionSpeech();
    setResult(null);
    setRequest("");
    setOriginalRequest("");
    setApprovedContent("");
    setVoiceMessage("");
    setListening(false);
    setAttachments([]);
  }

  return (
    <OfficeEnvironment>
      {!result && (
        <div className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-1rem)] -translate-x-1/2 sm:bottom-auto sm:top-[63%] sm:w-auto">
          <CompanionControls
            mode={interactionMode}
            inputRef={textInputRef}
            request={request}
            working={working}
            listening={listening}
            voiceMessage={voiceMessage}
            onRequestChange={setRequest}
            onSubmit={submitText}
            onChooseText={chooseText}
            onStartVoice={startVoice}
            onChooseFiles={chooseFiles}
          />
        </div>
      )}

      {result && (
        <CompanionWorkspace
          result={result}
          request={request}
          working={working}
          listening={listening}
          voiceMessage={voiceMessage}
          approvedContent={approvedContent}
          onRequestChange={setRequest}
          onApprovedContentChange={setApprovedContent}
          onAnswerQuestion={answerQuestion}
          onContinueConversation={continueConversation}
          onStartVoice={startWorkspaceVoice}
          onApprove={approve}
          onClose={closeWork}
        />
      )}
    </OfficeEnvironment>
  );
}