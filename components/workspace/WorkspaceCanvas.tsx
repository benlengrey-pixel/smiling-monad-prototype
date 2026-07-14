"use client";

import type { ReactNode } from "react";

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
    <section className="flex min-h-[48dvh] flex-col overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/30 shadow-sm backdrop-blur-sm">
      <header className="shrink-0 border-b border-white/50 px-5 py-5 sm:px-7 sm:py-6">
        <p className="text-xs uppercase tracking-[0.17em] text-[#8a7b6f]">
          Active work
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#382e27] sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#716358] sm:text-base">
            {description}
          </p>
        )}
      </header>

      <div className="min-h-0 flex-1 p-4 sm:p-6">
        {children ?? (
          <div className="flex min-h-[34dvh] items-center justify-center">
            <p className="max-w-md text-center text-base leading-7 text-[#77695e]">
              The Companion will place only the conversation, files, document,
              or tools needed for this task here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}