"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type RefObject,
  useState,
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
  if (attachments.length === 0) return "";

  if (attachments.length === 1) {
    const name = attachments[0]?.name || "1 file";
    return name.length > 20
      ? `${name.slice(0, 17)}…`
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
  const [mobileExpanded, setMobileExpanded] =
    useState(false);

  const visibleMessages = messages.slice(-4);
  const latestMessage =
    messages[messages.length - 1] ?? null;
  const attachmentLabel =
    getAttachmentLabel(attachments);
  const hasAttachments = attachments.length > 0;

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

  function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    onSubmit(event);
    setMobileExpanded(false);
  }

  return (
    <div className="pointer-events-auto absolute bottom-[max(0.65rem,env(safe-area-inset-bottom))] right-3 z-40 w-[min(18rem,46vw)] sm:bottom-[4%] sm:right-[4%] sm:w-[22rem]">
      <div className="overflow-hidden rounded-[1.2rem] border border-white/25 bg-[#8a5f3f]/55 shadow-[0_12px_30px_rgba(48,31,19,0.18)] backdrop-blur-xl">
        <form
          onSubmit={submit}
          className="flex items-center gap-1 border-b border-white/14 px-2 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2.5"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#3f4641]/75 text-[11px] font-medium text-white sm:h-9 sm:w-9 sm:text-sm">
            N
          </div>

          {mode === "text" ? (
            <input
              ref={inputRef}
              value={request}
              onFocus={() =>
                setMobileExpanded(true)
              }
              onChange={(event) =>
                onRequestChange(event.target.value)
              }
              placeholder={
                hasAttachments
                  ? "Use this file…"
                  : "Ask Kimi…"
              }
              aria-label="Type a request for Kimi"
              enterKeyHint="send"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-1 py-1 text-[11px] text-white outline-none placeholder:text-white/55 sm:py-2 sm:text-sm"
            />
          ) : (
            <div
              aria-live="polite"
              className="min-w-0 flex-1 px-1 py-1 text-[11px] text-white/75 sm:py-2 sm:text-sm"
            >
              {working
                ? "Thinking…"
                : voiceMessage || "Speak."}
            </div>
          )}

          <label
            title="Add files"
            className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[11px] transition focus-within:ring-2 focus-within:ring-white/20 sm:h-9 sm:w-9 sm:text-sm ${
              hasAttachments
                ? "bg-white/28 text-white"
                : "bg-white/14 text-white/80"
            }`}
          >
            <span aria-hidden="true">📎</span>
            <span className="sr-only">Add files</span>
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
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] transition focus:outline-none focus:ring-2 focus:ring-white/20 sm:h-9 sm:w-9 sm:text-sm ${
              mode === "voice"
                ? "bg-white/28 text-white"
                : "bg-white/14 text-white/80"
            } ${
              listening ? "animate-pulse" : ""
            }`}
          >
            <span aria-hidden="true">🎤</span>
          </button>

          <button
            type="button"
            onClick={onChooseText}
            aria-label="Type to Kimi"
            title="Type to Kimi"
            className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition focus:outline-none focus:ring-2 focus:ring-white/20 sm:flex ${
              mode === "text"
                ? "bg-white/28 text-white"
                : "bg-white/14 text-white/80"
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
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/85 text-[11px] text-[#60432f] transition focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:w-9 sm:text-sm"
            >
              <span aria-hidden="true">➜</span>
            </button>
          )}
        </form>

        {hasAttachments && (
          <div className="border-b border-white/10 px-3 py-1 text-[9px] text-white/60">
            📎 {attachmentLabel}
          </div>
        )}

        <div className="sm:hidden">
          {(latestMessage || working) && (
            <button
              type="button"
              onClick={() =>
                setMobileExpanded(
                  (current) => !current
                )
              }
              className="block w-full px-2.5 py-1.5 text-left"
            >
              <div className="flex items-start gap-1.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#314d4c]/85 text-[9px] font-semibold text-white">
                  {working
                    ? "K"
                    : latestMessage?.speaker === "Ben"
                      ? "B"
                      : "K"}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-white">
                    {working
                      ? "Kimi"
                      : latestMessage?.speaker}
                  </p>
                  <p
                    className={`text-[10px] leading-3.5 text-white/72 ${
                      mobileExpanded
                        ? "whitespace-pre-wrap"
                        : "line-clamp-2"
                    }`}
                  >
                    {working
                      ? "thinking…"
                      : latestMessage?.text}
                  </p>
                </div>
              </div>
            </button>
          )}

          {mobileExpanded &&
            visibleMessages.length > 1 && (
              <div className="max-h-28 overflow-y-auto border-t border-white/10 px-2.5 py-1">
                {visibleMessages
                  .slice(0, -1)
                  .map((message) => (
                    <div
                      key={message.id}
                      className="flex gap-1.5 border-b border-white/8 py-1.5 last:border-b-0"
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white ${
                          message.speaker === "Ben"
                            ? "bg-[#6f3e1f]/70"
                            : "bg-[#314d4c]/75"
                        }`}
                      >
                        {message.speaker === "Ben"
                          ? "B"
                          : "K"}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold text-white/85">
                          {message.speaker}
                        </p>
                        <p className="text-[9px] leading-3.5 text-white/62">
                          {message.text}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
        </div>

        <div className="hidden sm:block">
          {(visibleMessages.length > 0 || working) && (
            <div
              aria-live="polite"
              className="max-h-56 overflow-y-auto px-4 py-2.5 text-[12px] leading-4 text-white/88"
            >
              {visibleMessages.map((message) => (
                <div
                  key={message.id}
                  className="flex gap-2 border-b border-white/10 py-2.5 last:border-b-0"
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-[11px] font-semibold text-white ${
                      message.speaker === "Ben"
                        ? "bg-[#6f3e1f]/80"
                        : "bg-[#314d4c]/85"
                    }`}
                  >
                    {message.speaker === "Ben"
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
              ))}

              {working && (
                <div className="flex gap-2 py-2.5 opacity-70">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#314d4c]/85 text-[11px] font-semibold text-white">
                    K
                  </div>
                  <div>
                    <p className="font-semibold">Kimi</p>
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
    </div>
  );
}