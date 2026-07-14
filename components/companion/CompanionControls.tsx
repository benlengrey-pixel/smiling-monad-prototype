"use client";

import type { FormEvent, RefObject } from "react";

type InteractionMode = "voice" | "text";

type CompanionControlsProps = {
  mode: InteractionMode;
  inputRef: RefObject<HTMLInputElement | null>;
  request: string;
  working: boolean;
  listening: boolean;
  voiceMessage: string;
  onRequestChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChooseText: () => void;
  onStartVoice: () => void;
};

export default function CompanionControls({
  mode,
  inputRef,
  request,
  working,
  listening,
  voiceMessage,
  onRequestChange,
  onSubmit,
  onChooseText,
  onStartVoice,
}: CompanionControlsProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full items-center gap-2 rounded-2xl bg-white/95 p-2 shadow-2xl backdrop-blur-md sm:w-auto"
    >
      {mode === "text" ? (
        <input
          ref={inputRef}
          value={request}
          onChange={(event) => onRequestChange(event.target.value)}
          placeholder="What would you like to do?"
          aria-label="Type a request for Kimi"
          enterKeyHint="send"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl px-4 py-3 text-base outline-none focus:ring-4 focus:ring-[#6d513a]/25 sm:w-[380px] sm:flex-none sm:px-5 sm:py-4 sm:text-lg"
        />
      ) : (
        <div
          aria-live="polite"
          className="min-w-0 flex-1 px-3 py-2 text-sm text-[#5f544b] sm:w-[380px] sm:flex-none sm:text-base"
        >
          {working
            ? "Kimi is working…"
            : voiceMessage || "Press the microphone and speak to Kimi."}
        </div>
      )}

      <button
        type="button"
        onClick={onStartVoice}
        aria-label={listening ? "Kimi is listening" : "Talk to Kimi"}
        aria-pressed={mode === "voice"}
        title="Talk to Kimi"
        className={`touch-manipulation flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl transition focus:outline-none focus:ring-4 focus:ring-[#6d513a]/35 ${
          mode === "voice"
            ? "bg-[#6d513a] text-white"
            : "bg-[#efe8df] text-[#6d513a]"
        } ${listening ? "animate-pulse" : ""}`}
      >
        <span aria-hidden="true">🎤</span>
      </button>

      <button
        type="button"
        onClick={onChooseText}
        aria-label="Type to Kimi"
        aria-pressed={mode === "text"}
        title="Type to Kimi"
        className={`touch-manipulation flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl transition focus:outline-none focus:ring-4 focus:ring-[#6d513a]/35 ${
          mode === "text"
            ? "bg-[#6d513a] text-white"
            : "bg-[#efe8df] text-[#6d513a]"
        }`}
      >
        <span aria-hidden="true">⌨️</span>
      </button>

      {mode === "text" && (
        <button
          type="submit"
          disabled={working || !request.trim()}
          aria-label="Send request to Kimi"
          title="Send"
          className="touch-manipulation flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#6d513a] text-2xl text-white transition focus:outline-none focus:ring-4 focus:ring-[#6d513a]/35 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span aria-hidden="true">➜</span>
        </button>
      )}
    </form>
  );
}