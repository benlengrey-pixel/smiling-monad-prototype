"use client";

import type { FormEvent } from "react";

import type { GatewayResponse } from "@/lib/companion/gateway-client";

type CompanionWorkspaceProps = {
  result: GatewayResponse;
  request: string;
  working: boolean;
  listening: boolean;
  voiceMessage: string;
  approvedContent: string;
  onRequestChange: (value: string) => void;
  onApprovedContentChange: (value: string) => void;
  onAnswerQuestion: () => void;
  onContinueConversation?: () => void;
  onStartVoice?: () => void;
  onApprove: () => void;
  onClose: () => void;
};

export default function CompanionWorkspace({
  result,
  request,
  working,
  listening,
  voiceMessage,
  approvedContent,
  onRequestChange,
  onApprovedContentChange,
  onAnswerQuestion,
  onContinueConversation,
  onStartVoice,
  onApprove,
  onClose,
}: CompanionWorkspaceProps) {
  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAnswerQuestion();
  }

  function submitContinuation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onContinueConversation?.();
  }

  return (
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
          onClick={onClose}
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
              onSubmit={submitAnswer}
              className="mt-6 flex overflow-hidden rounded-2xl border border-black/10 bg-white"
            >
              <input
                value={request}
                onChange={(event) => onRequestChange(event.target.value)}
                placeholder="Your answer"
                aria-label="Answer the Companion's question"
                enterKeyHint="send"
                className="min-w-0 flex-1 px-4 py-4 outline-none focus:ring-4 focus:ring-[#6d513a]/20 sm:px-5"
              />

              {onStartVoice && (
                <button
                  type="button"
                  onClick={onStartVoice}
                  disabled={working || listening}
                  aria-label={
                    listening
                      ? "The Companion is listening"
                      : "Answer using your voice"
                  }
                  title="Answer using your voice"
                  className={`touch-manipulation flex w-14 shrink-0 items-center justify-center text-xl transition disabled:opacity-50 ${
                    listening
                      ? "animate-pulse bg-[#6d513a] text-white"
                      : "bg-[#efe8df] text-[#6d513a]"
                  }`}
                >
                  <span aria-hidden="true">🎤</span>
                </button>
              )}

              <button
                type="submit"
                disabled={working || !request.trim()}
                className="touch-manipulation shrink-0 bg-[#6d513a] px-4 text-white disabled:opacity-60 sm:px-7"
              >
                {working ? "Working…" : "Continue"}
              </button>
            </form>

            {voiceMessage && (
              <p
                aria-live="polite"
                className="mt-3 text-sm text-[#74695f]"
              >
                {voiceMessage}
              </p>
            )}
          </div>
        ) : result.action === "draft" ? (
          <textarea
            value={approvedContent}
            onChange={(event) =>
              onApprovedContentChange(event.target.value)
            }
            aria-label="Generated draft"
            className="h-full min-h-[45vh] w-full resize-none bg-transparent text-base leading-7 text-[#302a25] outline-none sm:text-lg sm:leading-8"
          />
        ) : (
          <div className="whitespace-pre-wrap text-base leading-7 text-[#302a25] sm:text-lg sm:leading-8">
            {result.content}
          </div>
        )}
      </div>

      {result.action !== "clarify" && onContinueConversation && (
        <div className="mx-4 mb-3 shrink-0 sm:mx-6 lg:mx-8">
          <form
            onSubmit={submitContinuation}
            className="flex overflow-hidden rounded-2xl border border-black/10 bg-white"
          >
            <input
              value={request}
              onChange={(event) => onRequestChange(event.target.value)}
              placeholder="Continue the conversation"
              aria-label="Continue the conversation"
              enterKeyHint="send"
              className="min-w-0 flex-1 px-4 py-3 outline-none focus:ring-4 focus:ring-[#6d513a]/20 sm:px-5 sm:py-4"
            />

            {onStartVoice && (
              <button
                type="button"
                onClick={onStartVoice}
                disabled={working || listening}
                aria-label={
                  listening
                    ? "The Companion is listening"
                    : "Continue using your voice"
                }
                title="Continue using your voice"
                className={`touch-manipulation flex w-14 shrink-0 items-center justify-center text-xl transition disabled:opacity-50 ${
                  listening
                    ? "animate-pulse bg-[#6d513a] text-white"
                    : "bg-[#efe8df] text-[#6d513a]"
                }`}
              >
                <span aria-hidden="true">🎤</span>
              </button>
            )}

            <button
              type="submit"
              disabled={working || !request.trim()}
              className="touch-manipulation shrink-0 bg-[#6d513a] px-4 text-white disabled:opacity-60 sm:px-7"
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
      )}

      <footer className="flex shrink-0 justify-end gap-2 border-t border-black/10 px-4 py-4 sm:gap-3 sm:px-6 sm:py-5 lg:px-8">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm sm:px-6 sm:py-3"
        >
          Cancel
        </button>

        {result.action === "draft" && (
          <button
            type="button"
            onClick={onApprove}
            className="rounded-full bg-[#6d513a] px-4 py-2.5 text-sm text-white sm:px-6 sm:py-3"
          >
            Approve
          </button>
        )}
      </footer>
    </section>
  );
}