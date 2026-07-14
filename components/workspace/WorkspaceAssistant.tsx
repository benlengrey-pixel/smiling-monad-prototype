"use client";

import { useState } from "react";

import WorkspaceConversation from "@/components/workspace/WorkspaceConversation";

type WorkspaceAssistantProps = {
  response: string;
  request: string;
  working: boolean;
  listening: boolean;
  voiceMessage: string;
  onRequestChange: (value: string) => void;
  onSubmit: () => void;
  onStartVoice: () => void;
};

export default function WorkspaceAssistant({
  response,
  request,
  working,
  listening,
  voiceMessage,
  onRequestChange,
  onSubmit,
  onStartVoice,
}: WorkspaceAssistantProps) {
  const [open, setOpen] = useState(true);

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-white/55 bg-white/55 shadow-sm backdrop-blur-md">
      <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a7b6f]">
            Companion
          </p>

          <h3 className="mt-1 truncate text-lg font-semibold text-[#3b3028]">
            Help with this task
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="shrink-0 rounded-full border border-black/5 bg-white/70 px-4 py-2 text-sm text-[#5b493b] shadow-sm"
        >
          {open ? "Hide" : "Open"}
        </button>
      </header>

      {open && (
        <div className="border-t border-black/5 p-3 sm:p-4">
          <WorkspaceConversation
            response={response}
            request={request}
            working={working}
            listening={listening}
            voiceMessage={voiceMessage}
            onRequestChange={onRequestChange}
            onSubmit={onSubmit}
            onStartVoice={onStartVoice}
          />
        </div>
      )}

      {!open && response && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full border-t border-black/5 px-5 py-3 text-left text-sm text-[#74675c]"
        >
          The Companion has a response. Open to view it.
        </button>
      )}
    </section>
  );
}