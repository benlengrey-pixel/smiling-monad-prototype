"use client";

import { FormEvent, useRef, useState } from "react";

import CompanionControls from "@/components/companion/CompanionControls";
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
        <section className="fixed inset-2 z-40 flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl sm:inset-y-[4%] sm:left-auto sm:right-[3%] sm:w-[72%] lg:inset-y-[6%] lg:right-[4%] lg:w-[60%]">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-black/10 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            <div className="min-w-0">
              <p className="text-xs capitalize text-[#74695f] sm:text-sm">
                {result.application.replace("-", " ")}
              </p>

              <h1 className="mt-1 text-xl font-semibold text-[#211d19] sm:text-2xl">
                {result.title || "Smiling Monad Companion"}
              </h1>
            </div>

            <button
              type="button"
              onClick={closeWork}
              className="shrink-0 rounded-full bg-black/5 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-black/10 sm:px-4"
            >
              Close
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {result.action === "clarify" ? (
              <div className="mx-auto max-w-2xl">
                <p className="text-lg font-medium text-[#211d19] sm:text-xl">
                  {result.question}
                </p>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    answerQuestion();
                  }}
                  className="mt-6 flex overflow-hidden rounded-2xl border border-black/10 bg-white"
                >
                  <input
                    value={request}
                    onChange={(event) => setRequest(event.target.value)}
                    placeholder="Your answer"
                    aria-label="Answer Kimi's question"
                    enterKeyHint="send"
                    className="min-w-0 flex-1 px-4 py-4 outline-none focus:ring-4 focus:ring-[#6d513a]/20 sm:px-5"
                  />

                  <button
                    type="submit"
                    disabled={working || !request.trim()}
                    className="touch-manipulation shrink-0 bg-[#6d513a] px-4 text-white disabled:opacity-60 sm:px-7"
                  >
                    {working ? "Working…" : "Continue"}
                  </button>
                </form>
              </div>
            ) : result.action === "draft" ? (
              <textarea
                value={approvedContent}
                onChange={(event) =>
                  setApprovedContent(event.target.value)
                }
                aria-label="Generated draft"
                className="h-full min-h-[55vh] w-full resize-none bg-transparent text-base leading-7 text-[#302a25] outline-none sm:text-lg sm:leading-8"
              />
            ) : (
              <div className="whitespace-pre-wrap text-base leading-7 text-[#302a25] sm:text-lg sm:leading-8">
                {result.content}
              </div>
            )}
          </div>

          <footer className="flex shrink-0 justify-end gap-2 border-t border-black/10 px-4 py-4 sm:gap-3 sm:px-6 sm:py-5 lg:px-8">
            <button
              type="button"
              onClick={closeWork}
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm sm:px-6 sm:py-3"
            >
              Cancel
            </button>

            {result.action === "draft" && (
              <button
                type="button"
                onClick={approve}
                className="rounded-full bg-[#6d513a] px-4 py-2.5 text-sm text-white sm:px-6 sm:py-3"
              >
                Approve
              </button>
            )}
          </footer>
        </section>
      )}
    </OfficeEnvironment>
  );
}