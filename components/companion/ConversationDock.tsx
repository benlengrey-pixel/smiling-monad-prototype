"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
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
  expanded: boolean;
  attachments?: WorkspaceAttachment[];
  onExpandedChange: (expanded: boolean) => void;
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
  expanded,
  attachments = [],
  onExpandedChange,
  onRequestChange,
  onSubmit,
  onChooseText,
  onStartVoice,
  onChooseFiles,
}: ConversationDockProps) {
  const collapseTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastSpokenMessageIdRef =
    useRef<string | null>(null);

  const visibleMessages = useMemo(
    () => messages.slice(-6),
    [messages]
  );

  const latestMessage =
    messages[messages.length - 1] ?? null;

  const latestKimiMessage = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((message) => message.speaker === "Kimi") ??
      null,
    [messages]
  );

  const attachmentLabel =
    getAttachmentLabel(attachments);

  const hasAttachments =
    attachments.length > 0;

  useEffect(() => {
    if (
      !latestKimiMessage ||
      lastSpokenMessageIdRef.current ===
        latestKimiMessage.id ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    lastSpokenMessageIdRef.current =
      latestKimiMessage.id;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      latestKimiMessage.text
    );

    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }, [latestKimiMessage]);

  useEffect(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }

    if (
      listening ||
      working ||
      request.trim().length > 0
    ) {
      onExpandedChange(true);
      return;
    }

    if (!expanded) {
      return;
    }

    collapseTimerRef.current = setTimeout(() => {
      onExpandedChange(false);
    }, 9000);

    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, [
    expanded,
    listening,
    onExpandedChange,
    request,
    working,
  ]);

  function chooseFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    );

    if (files.length > 0) {
      onChooseFiles(files);
      onExpandedChange(true);
    }

    event.target.value = "";
  }

  function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    onExpandedChange(true);
    onSubmit(event);
  }

  return (
    <div className="pointer-events-auto absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-40 sm:bottom-[4%] sm:left-auto sm:right-[4%] sm:w-[22rem]">
      <div className="overflow-hidden rounded-[1.3rem] border border-white/25 bg-[#8a5f3f]/55 shadow-[0_12px_30px_rgba(48,31,19,0.18)] backdrop-blur-xl">
        <form
          onSubmit={submit}
          className="flex items-center gap-1 border-b border-white/14 px-2 py-2 sm:gap-1.5 sm:px-3 sm:py-2.5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#3f4641]/75 text-xs font-medium text-white sm:h-9 sm:w-9 sm:text-sm">
            N
          </div>

          {mode === "text" ? (
            <input
              ref={inputRef}
              value={request}
              onFocus={() =>
                onExpandedChange(true)
              }
              onChange={(event) =>
                onRequestChange(
                  event.target.value
                )
              }
              placeholder={
                hasAttachments
                  ? "Use this file…"
                  : "Ask Kimi…"
              }
              aria-label="Type a request for Kimi"
              enterKeyHint="send"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-xs text-white outline-none placeholder:text-white/55 sm:py-2 sm:text-sm"
            />
          ) : (
            <div
              aria-live="polite"
              className="min-w-0 flex-1 px-1 py-1.5 text-xs text-white/75 sm:py-2 sm:text-sm"
            >
              {working
                ? "Thinking…"
                : voiceMessage ||
                  "Speak to Kimi."}
            </div>
          )}

          <label
            title="Add files"
            className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs transition focus-within:ring-2 focus-within:ring-white/20 sm:h-9 sm:w-9 sm:text-sm ${
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
            onClick={() => {
              onExpandedChange(true);
              onStartVoice();
            }}
            aria-label={
              listening
                ? "Kimi is listening"
                : "Talk to Kimi"
            }
            title="Talk to Kimi"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs transition focus:outline-none focus:ring-2 focus:ring-white/20 sm:h-9 sm:w-9 sm:text-sm ${
              mode === "voice"
                ? "bg-white/28 text-white"
                : "bg-white/14 text-white/80"
            } ${
              listening
                ? "animate-pulse"
                : ""
            }`}
          >
            <span aria-hidden="true">🎤</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onExpandedChange(true);
              onChooseText();
            }}
            aria-label="Type to Kimi"
            title="Type to Kimi"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs transition focus:outline-none focus:ring-2 focus:ring-white/20 sm:h-9 sm:w-9 sm:text-sm ${
              mode === "text"
                ? "bg-white/28 text-white"
                : "bg-white/14 text-white/80"
            }`}
          >
            <span aria-hidden="true">⌨️</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onExpandedChange(!expanded)
            }
            aria-label={
              expanded
                ? "Collapse conversation"
                : "Expand conversation"
            }
            title={
              expanded
                ? "Collapse conversation"
                : "Expand conversation"
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/14 text-xs text-white/80 transition focus:outline-none focus:ring-2 focus:ring-white/20 sm:h-9 sm:w-9 sm:text-sm"
          >
            <span aria-hidden="true">
              {expanded ? "⌄" : "⌃"}
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/85 text-xs text-[#60432f] transition focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:w-9 sm:text-sm"
            >
              <span aria-hidden="true">➜</span>
            </button>
          )}
        </form>

        {hasAttachments && (
          <div className="border-b border-white/10 px-3 py-1 text-[10px] text-white/60">
            📎 {attachmentLabel}
          </div>
        )}

        {!expanded &&
          (latestMessage || working) && (
            <button
              type="button"
              onClick={() =>
                onExpandedChange(true)
              }
              className="block w-full px-3 py-2 text-left"
            >
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#314d4c]/85 text-[10px] font-semibold text-white">
                  K
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white">
                    {working
                      ? "Kimi"
                      : latestMessage?.speaker}
                  </p>

                  <p className="line-clamp-2 text-[11px] leading-4 text-white/72">
                    {working
                      ? "thinking…"
                      : latestMessage?.text}
                  </p>
                </div>
              </div>
            </button>
          )}

        {expanded && (
          <div
            aria-live="polite"
            className="max-h-[42vh] overflow-y-auto px-3 py-1.5 text-[11px] leading-4 text-white/88 sm:max-h-56 sm:px-4 sm:py-2.5 sm:text-[12px]"
          >
            {visibleMessages.map(
              (message) => (
                <div
                  key={message.id}
                  className="flex gap-2 border-b border-white/10 py-2 last:border-b-0"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white sm:h-7 sm:w-7 sm:text-[11px] ${
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
              )
            )}

            {working && (
              <div className="flex gap-2 py-2 opacity-70">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#314d4c]/85 text-[10px] font-semibold text-white sm:h-7 sm:w-7 sm:text-[11px]">
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