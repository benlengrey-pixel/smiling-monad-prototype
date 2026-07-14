"use client";

import type { ReactNode } from "react";

import type { WorkspacePanelType } from "@/lib/workspace/composer";

type WorkspacePanelProps = {
  type: WorkspacePanelType;
  title: string;
  purpose?: string;
  primary?: boolean;
  children?: ReactNode;
};

function getPanelLabel(type: WorkspacePanelType): string {
  switch (type) {
    case "conversation":
      return "Companion";

    case "document":
      return "Document";

    case "attachments":
      return "Files";

    case "checklist":
      return "Actions";

    case "calendar":
      return "Schedule";

    case "meeting":
      return "Meeting";

    case "notes":
      return "Notes";
  }
}

export default function WorkspacePanel({
  type,
  title,
  purpose,
  primary = false,
  children,
}: WorkspacePanelProps) {
  return (
    <section
      data-workspace-panel={type}
      className={`flex min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-white/55 bg-white/55 shadow-sm backdrop-blur-md ${
        primary
          ? "min-h-[46dvh]"
          : "min-h-[12rem]"
      }`}
    >
      <header className="shrink-0 border-b border-black/5 px-5 py-4 sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a7b6f]">
          {getPanelLabel(type)}
        </p>

        <h3 className="mt-1.5 text-lg font-semibold text-[#3b3028] sm:text-xl">
          {title}
        </h3>

        {purpose && (
          <p className="mt-2 text-sm leading-6 text-[#74675c]">
            {purpose}
          </p>
        )}
      </header>

      <div className="min-h-0 flex-1 p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}