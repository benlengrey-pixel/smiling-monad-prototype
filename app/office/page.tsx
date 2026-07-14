"use client";

import { FormEvent, useRef, useState } from "react";

import CompanionControls from "@/components/companion/CompanionControls";
import CompanionWorkspace from "@/components/companion/CompanionWorkspace";
import OfficeEnvironment from "@/components/office/OfficeEnvironment";
import {
  sendGatewayRequest,
  type GatewayResponse,
} from "@/lib/companion/gateway-client";

type CompanionResult = GatewayResponse;

type SavedMemory = {
  request: string;
  application: string;
  title: string;
  approvedContent: string;
};

type InteractionMode = "voice" | "text";

type SpeechRecognitionResultEvent = {
  results: ArrayLike<{
    0: {
      transcript: string;
    };
  }>;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
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

  async function askCompanion(message?: string) {
    const currentRequest = (message ?? request).trim();

    if (!currentRequest || working) return;

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
    } catch (error) {
      setResult({
        action: "answer",
        application: "general",
        title: "Something went wrong",
        question: "",
        content:
          error instanceof Error
            ? error.message
            : "The Companion could not respond.",
      });
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

  function startVoice() {
    setInteractionMode("voice");
    setVoiceMessage("");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceMessage(
        "Voice is not available in this browser. Use the keyboard button."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-AU";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() || "";

      if (transcript) {
        setVoiceMessage(`You said: ${transcript}`);
        void askCompanion(transcript);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setVoiceMessage(
        "I could not hear that. Press the microphone and try again."
      );
    };

    recognition.onend = () => {
      setListening(false);
    };

    setListening(true);
    setVoiceMessage("Listening…");
    recognition.start();
  }

  function answerQuestion() {
    if (!result?.question || !request.trim()) return;

    const combinedRequest = `
Original request:
${originalRequest}

The Companion asked:
${result.question}

User's answer:
${request.trim()}
`;

    void askCompanion(combinedRequest);
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
    setResult(null);
    setRequest("");
    setOriginalRequest("");
    setApprovedContent("");
    setVoiceMessage("");
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
          />
        </div>
      )}

      {result && (
        <CompanionWorkspace
          result={result}
          request={request}
          working={working}
          approvedContent={approvedContent}
          onRequestChange={setRequest}
          onApprovedContentChange={setApprovedContent}
          onAnswerQuestion={answerQuestion}
          onApprove={approve}
          onClose={closeWork}
        />
      )}
    </OfficeEnvironment>
  );
}