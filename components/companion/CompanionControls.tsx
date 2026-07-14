"use client";

import type {
  ChangeEvent,
  FormEvent,
  RefObject,
} from "react";

import type { WorkspaceAttachment } from "@/lib/workspace/types";

type InteractionMode = "voice" | "text";

type CompanionControlsProps = {
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

    return name.length > 24
      ? `${name.slice(0, 21)}…`
      : name;
  }

  return `${attachments.length} files`;
}

export default function CompanionControls({
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
}: CompanionControlsProps) {
  const attachmentLabel = getAttachmentLabel(attachments);
  const hasAttachments = attachments.length > 0;

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      onChooseFiles(files);
    }

    event.target.value = "";
  }

  return (
    <div className="w-full sm:w-auto">
      {hasAttachments && (
        <div className="mb-2 flex justify-center sm:justify-start">
          <div className="max-w-[calc(100vw-2rem)] truncate rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-xs text-[#5f544b] shadow-lg backdrop-blur-md">
            <span aria-hidden="true">📎 </span>
            {attachmentLabel}
            <span className="ml-1 text-[#8b7d72]">
              · use once
            </span>
          </div>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="flex w-full items-center gap-1.5 rounded-[1.35rem] bg-white/95 p-1.5 shadow-2xl backdrop-blur-md sm:w-auto sm:gap-2 sm:rounded-2xl sm:p-2"
      >
        {mode === "text" ? (
          <input
            ref={inputRef}
            value={request}
            onChange={(event) =>
              onRequestChange(event.target.value)
            }
            placeholder={
              hasAttachments
                ? "What should I do with this?"
                : "What would you like to do?"
            }
            aria-label="Type a request for Kimi"
            enterKeyHint="send"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-base outline-none focus:ring-4 focus:ring-[#6d513a]/25 sm:w-[380px] sm:flex-none sm:px-5 sm:py-4 sm:text-lg"
          />
        ) : (
          <div
            aria-live="polite"
            className="min-w-0 flex-1 px-3 py-2 text-sm text-[#5f544b] sm:w-[380px] sm:flex-none sm:text-base"
          >
            {working
              ? "Kimi is working…"
              : voiceMessage ||
                "Press the microphone and speak to Kimi."}
          </div>
        )}

        <label
          title="Add files"
          className={`touch-manipulation flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-xl transition focus-within:ring-4 focus-within:ring-[#6d513a]/35 sm:h-14 sm:w-14 sm:text-2xl ${
            hasAttachments
              ? "bg-[#6d513a] text-white"
              : "bg-[#efe8df] text-[#6d513a]"
          }`}
        >
          <span aria-hidden="true">📎</span>

          <span className="sr-only">
            {hasAttachments
              ? `Add more files. ${attachmentLabel} selected.`
              : "Add files"}
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
            listening ? "Kimi is listening" : "Talk to Kimi"
          }
          aria-pressed={mode === "voice"}
          title="Talk to Kimi"
          className={`touch-manipulation flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl transition focus:outline-none focus:ring-4 focus:ring-[#6d513a]/35 sm:h-14 sm:w-14 sm:text-2xl ${
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
          className={`touch-manipulation flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl transition focus:outline-none focus:ring-4 focus:ring-[#6d513a]/35 sm:h-14 sm:w-14 sm:text-2xl ${
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
            className="touch-manipulation flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6d513a] text-xl text-white transition focus:outline-none focus:ring-4 focus:ring-[#6d513a]/35 disabled:cursor-not-allowed disabled:opacity-40 sm:h-14 sm:w-14 sm:text-2xl"
          >
            <span aria-hidden="true">➜</span>
          </button>
        )}
      </form>
    </div>
  );
}