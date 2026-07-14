"use client";

import type { FormEvent } from "react";

type WorkspaceConversationProps = {
  response?: string;
  request: string;
  working: boolean;
  listening: boolean;
  voiceMessage: string;
  onRequestChange: (value: string) => void;
  onSubmit: () => void;
  onStartVoice: () => void;
};

export default function WorkspaceConversation({
  response,
  request,
  working,
  listening,
  voiceMessage,
  onRequestChange,
  onSubmit,
  onStartVoice,
}: WorkspaceConversationProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="rounded-[1.5rem] border border-white/55 bg-white/55 shadow-sm backdrop-blur-md">
      {response && (
        <div className="border-b border-black/5 px-5 py-5 sm:px-6">
          <p className="whitespace-pre-wrap text-base leading-7 text-[#40352d]">
            {response}
          </p>
        </div>
      )}

      <div className="p-3 sm:p-4">
        <form
          onSubmit={submit}
          className="flex overflow-hidden rounded-2xl border border-black/10 bg-white"
        >
          <input
            value={request}
            onChange={(event) => onRequestChange(event.target.value)}
            placeholder={
              response
                ? "Continue working on this task"
                : "What should we do first?"
            }
            aria-label="Work with the Companion"
            enterKeyHint="send"
            autoComplete="off"
            className="min-w-0 flex-1 px-4 py-3 text-base outline-none focus:ring-4 focus:ring-[#6d513a]/20 sm:px-5 sm:py-4"
          />

          <button
            type="button"
            onClick={onStartVoice}
            disabled={working || listening}
            aria-label={
              listening
                ? "The Companion is listening"
                : "Speak to the Companion"
            }
            title="Speak"
            className={`touch-manipulation flex w-14 shrink-0 items-center justify-center text-xl transition disabled:opacity-50 ${
              listening
                ? "animate-pulse bg-[#6d513a] text-white"
                : "bg-[#efe8df] text-[#6d513a]"
            }`}
          >
            <span aria-hidden="true">🎤</span>
          </button>

          <button
            type="submit"
            disabled={working || !request.trim()}
            aria-label="Send"
            title="Send"
            className="touch-manipulation shrink-0 bg-[#6d513a] px-5 text-white disabled:opacity-40"
          >
            {working ? "Working…" : "Send"}
          </button>
        </form>

        {voiceMessage && (
          <p
            aria-live="polite"
            className="mt-2 px-2 text-sm text-[#74695f]"
          >
            {voiceMessage}
          </p>
        )}
      </div>
    </section>
  );
}