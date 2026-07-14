"use client";

import type { ReactNode } from "react";

type WorkspaceShellProps = {
  children: ReactNode;
  onBackToOffice: () => void;
  onDiscard?: () => void;
  showDiscard?: boolean;
};

export default function WorkspaceShell({
  children,
  onBackToOffice,
  onDiscard,
  showDiscard = false,
}: WorkspaceShellProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#e7ded2] text-[#211d19]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.92),rgba(255,255,255,0)_42%),linear-gradient(180deg,#f4efe8_0%,#e8ded1_58%,#d9c8b5_100%)]" />

      <div className="absolute inset-x-0 bottom-0 h-[43%] bg-[linear-gradient(180deg,rgba(174,135,96,0.05),rgba(128,88,54,0.18)),repeating-linear-gradient(90deg,rgba(98,67,43,0.06)_0,rgba(98,67,43,0.06)_1px,transparent_1px,transparent_110px)]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={onBackToOffice}
          className="rounded-full bg-[#3b2415]/90 px-5 py-3 text-base font-medium text-white shadow-xl backdrop-blur-md transition hover:bg-[#2d1a0e] focus:outline-none focus:ring-4 focus:ring-white/50"
        >
          Back to Office
        </button>

        <div className="flex items-center gap-2">
          {showDiscard && onDiscard && (
            <button
              type="button"
              onClick={onDiscard}
              className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm text-[#6d513a] shadow-lg backdrop-blur-md"
            >
              Discard
            </button>
          )}

          <div className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm text-[#64584e] shadow-lg backdrop-blur-md">
            Temporary Workspace
          </div>
        </div>
      </header>

      <section className="relative z-10 min-h-dvh px-3 pb-6 pt-24 sm:px-6 sm:pb-8 sm:pt-28">
        <div className="mx-auto min-h-[calc(100dvh-7.5rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/50 bg-white/18 shadow-[0_30px_80px_rgba(77,52,31,0.12)] backdrop-blur-[2px] sm:rounded-[2.5rem]">
          {children}
        </div>
      </section>
    </main>
  );
}