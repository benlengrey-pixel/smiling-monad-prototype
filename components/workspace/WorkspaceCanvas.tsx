"use client";

import type { ReactNode } from "react";

import WorkspaceDesk from "@/components/workspace/WorkspaceDesk";

type WorkspaceCanvasProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export default function WorkspaceCanvas({
  title,
  description,
  children,
}: WorkspaceCanvasProps) {
  return (
    <WorkspaceDesk>
      <header className="shrink-0 border-b border-white/40 pb-5 sm:pb-6">
        <p className="text-xs uppercase tracking-[0.17em] text-[#6f6257]">
          Active work
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#332a23] sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#62564c] sm:text-base">
            {description}
          </p>
        )}
      </header>

      <div className="min-h-0 flex-1">
        {children ?? (
          <div className="flex min-h-[48dvh] items-center justify-center">
            <p className="max-w-md text-center text-base leading-7 text-[#6f6257]">
              Only the work and tools required for this task will appear here.
            </p>
          </div>
        )}
      </div>
    </WorkspaceDesk>
  );
}