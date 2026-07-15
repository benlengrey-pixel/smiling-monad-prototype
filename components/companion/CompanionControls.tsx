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

    return name.length > 26
      ? `${name.slice(0, 23)}…`
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
        <div className="mb-1.5 flex justify-center">
          <div className="max-w-[calc(100vw-2rem)] truncate rounded-full bg-[#f4eee6]/75 px-3 py-1 text-[11px] text-[#5f544b] shadow-sm backdrop-blur-md">
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
        className="flex w-full items-center gap-1 rounded-full border border-white/35 bg-[#f6f0e8]/72 p-1.5 shadow-[0_8px_22px_rgba(57,40,27,0.14)] backdrop-blur-xl sm:w-auto"
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
                : "Talk to Kimi…"
            }
            aria-label="Type a request for Kimi"
            enterKeyHint="send"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-4 py-2 text-[15px] text-[#3f352d] outline-none placeholder:text-[#6f6257]/70 sm:w-[360px] sm:flex-none"
          />
        ) : (
          <div
            aria-live="polite"
            className="min-w-0 flex-1 px-4 py-2 text-[14px] text-[#54483f] sm:w-[360px] sm:flex-none"
          >
            {working
              ? "Kimi is thinking…"
              : voiceMessage ||
                "Press the microphone and speak."}
          </div>
        )}

        <label
          title="Add files"
          className={`touch-manipulation flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-base transition focus-within:ring-2 focus-within:ring-[#6d513a]/25 ${
            hasAttachments
              ? "bg-[#6d513a]/90 text-white"
              : "bg-white/35 text-[#6d513a]"
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
          className={`touch-manipulation flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base transition focus:outline-none focus:ring-2 focus:ring-[#6d513a]/25 ${
            mode === "voice"
              ? "bg-[#6d513a]/90 text-white"
              : "bg-white/35 text-[#6d513a]"
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
          className={`touch-manipulation flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base transition focus:outline-none focus:ring-2 focus:ring-[#6d513a]/25 ${
            mode === "text"
              ? "bg-[#6d513a]/90 text-white"
              : "bg-white/35 text-[#6d513a]"
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
            className="touch-manipulation flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6d513a]/90 text-base text-white transition focus:outline-none focus:ring-2 focus:ring-[#6d513a]/25 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span aria-hidden="true">➜</span>
          </button>
        )}
      </form>
    </div>
  );
}