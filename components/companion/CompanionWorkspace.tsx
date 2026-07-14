"use client";

import type { FormEvent } from "react";

import type { GatewayResponse } from "@/lib/companion/gateway-client";

type CompanionWorkspaceProps = {
  result: GatewayResponse;
  request: string;
  working: boolean;
  approvedContent: string;
  onRequestChange: (value: string) => void;
  onApprovedContentChange: (value: string) => void;
  onAnswerQuestion: () => void;
  onApprove: () => void;
  onClose: () => void;
};

export default function CompanionWorkspace({
  result,
  request,
  working,
  approvedContent,
  onRequestChange,
  onApprovedContentChange,
  onAnswerQuestion,
  onApprove,
  onClose,
}: CompanionWorkspaceProps) {
  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAnswerQuestion();
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
              onApprovedContentChange(event.target.value)
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