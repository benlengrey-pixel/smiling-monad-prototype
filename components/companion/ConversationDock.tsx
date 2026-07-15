"use client";

import type {
  ChangeEvent,
  FormEvent,
  RefObject,
} from "react";

import type { ConversationMessage } from "@/components/companion/ConversationThread";
import type { WorkspaceAttachment } from "@/lib/workspace/types";

type InteractionMode = "voice" | "text";

type ConversationDockProps = {
  messages: ConversationMessage[];
  mode: InteractionMode;
  inputRef: RefObject<HTMLInputElement | null>;
  request: string;
  working: boolean;
  listening: boolean;
  voiceMessage: string;
  attachments?: WorkspaceAttachment[];
  onRequestChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChooseText: () => void;
  onStartVoice: () => void;
  onChooseFiles: (files: File[]) => void;
};

function getAttachmentLabel(
  attachments: WorkspaceAttachment[]
): string {
  if (attachments.length === 0) {
    return "";
  }

  if (attachments.length === 1) {
    const name = attachments[0]?.name || "1 file";

    return name.length > 22
      ? `${name.slice(0, 19)}…`
      : name;
  }

  return `${attachments.length} files`;
}

export default function ConversationDock({
  messages,
  mode,
  inputRef,
  request,
  working,
  listening,
  voiceMessage,
  attachments = [],
  onRequestChange,
  onSubmit,
  onChooseText,
  onStartVoice,
  onChooseFiles,
}: ConversationDockProps) {
  const visibleMessages = messages.slice(-4);
  const attachmentLabel =
    getAttachmentLabel(attachments);
  const hasAttachments =
    attachments.length > 0;

  function chooseFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    if (files.length > 0) {
      onChooseFiles(files);
    }

    event.target.value = "";
  }

  return (
    <div className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 w-[min(22rem,calc(100vw-2rem))] sm:bottom-[4%] sm:right-[4%] sm:w-[22rem]">
      <div className="overflow-hidden rounded-[1.45rem] border border-white/30 bg-[#8a5f3f]/58 shadow-[0_14px_34px_rgba(48,31,19,0.2)] backdrop-blur-xl">
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-1.5 border-b border-white/18 px-3 py-2.5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-[#3f4641]/75 text-sm font-medium text-white">
            N
          </div>

          {mode === "text" ? (
            <input
              ref={inputRef}
              value={request}
              onChange={(event) =>
                onRequestChange(
                  event.target.value
                )
              }
              placeholder={
                hasAttachments
                  ? "What should I do with this?"
                  : "Ask Kimi anything…"
              }
              aria-label="Type a request for Kimi"
              enterKeyHint="send"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-white/55"
            />
          ) : (
            <div
              aria-live="polite"
              className="min-w-0 flex-1 px-1 py-2 text-sm text-white/75"
            >
              {working
                ? "Kimi is thinking…"
                : voiceMessage ||
                  "Press the microphone and speak."}
            </div>
          )}

          <label
            title="Add files"
            className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-sm transition focus-within:ring-2 focus-within:ring-white/25 ${
              hasAttachments
                ? "bg-white/28 text-white"
                : "bg-white/16 text-white/80"
            }`}
          >
            <span aria-hidden="true">
              📎
            </span>

            <span className="sr-only">
              Add files
            </span>

            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
              onChange={chooseFiles}
              disabled={working}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            onClick={onStartVoice}
            aria-label={
              listening
                ? "Kimi is listening"
                : "Talk to Kimi"
            }
            title="Talk to Kimi"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition focus:outline-none focus:ring-2 focus:ring-white/25 ${
              mode === "voice"
                ? "bg-white/30 text-white"
                : "bg-white/16 text-white/80"
            } ${
              listening
                ? "animate-pulse"
                : ""
            }`}
          >
            <span aria-hidden="true">
              🎤
            </span>
          </button>

          <button
            type="button"
            onClick={onChooseText}
            aria-label="Type to Kimi"
            title="Type to Kimi"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition focus:outline-none focus:ring-2 focus:ring-white/25 ${
              mode === "text"
                ? "bg-white/30 text-white"
                : "bg-white/16 text-white/80"
            }`}
          >
            <span aria-hidden="true">
              ⌨️
            </span>
          </button>

          {mode === "text" && (
            <button
              type="submit"
              disabled={
                working ||
                !request.trim()
              }
              aria-label="Send request to Kimi"
              title="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/85 text-sm text-[#60432f] transition focus:outline-none focus:ring-2 focus:ring-white/35 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <span aria-hidden="true">
                ➜
              </span>
            </button>
          )}
        </form>

        {hasAttachments && (
          <div className="border-b border-white/12 px-4 py-1.5 text-[11px] text-white/65">
            📎 {attachmentLabel} · use once
          </div>
        )}

        {(visibleMessages.length > 0 ||
          working) && (
          <div
            aria-live="polite"
            className="max-h-56 overflow-y-auto px-4 py-2.5 text-[12px] leading-4 text-white/88"
          >
            {visibleMessages.map(
              (message, index) => {
                const distanceFromNewest =
                  visibleMessages.length -
                  index -
                  1;

                const opacityClass =
                  distanceFromNewest >= 3
                    ? "opacity-45"
                    : distanceFromNewest === 2
                      ? "opacity-60"
                      : distanceFromNewest === 1
                        ? "opacity-78"
                        : "opacity-100";

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 border-b border-white/10 py-2.5 last:border-b-0 ${opacityClass}`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-[11px] font-semibold text-white ${
                        message.speaker ===
                        "Ben"
                          ? "bg-[#6f3e1f]/80"
                          : "bg-[#314d4c]/85"
                      }`}
                    >
                      {message.speaker ===
                      "Ben"
                        ? "B"
                        : "K"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {message.speaker}
                      </p>

                      <p className="mt-0.5 whitespace-pre-wrap text-white/80">
                        {message.text}
                      </p>
                    </div>
                  </div>
                );
              }
            )}

            {working && (
              <div className="flex gap-2 py-2.5 opacity-70">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#314d4c]/85 text-[11px] font-semibold text-white">
                  K
                </div>

                <div>
                  <p className="font-semibold">
                    Kimi
                  </p>

                  <p className="mt-0.5 text-white/75">
                    thinking…
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}