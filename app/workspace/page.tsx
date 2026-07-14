"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearTemporaryWorkspaceSession,
  readTemporaryWorkspaceSession,
  type TemporaryWorkspaceSession,
} from "@/lib/workspace/session-client";

export default function WorkspacePage() {
  const router = useRouter();

  const [session, setSession] =
    useState<TemporaryWorkspaceSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readTemporaryWorkspaceSession());
    setReady(true);
  }, []);

  function returnToOffice() {
    router.push("/office");
  }

  function discardWorkspace() {
    clearTemporaryWorkspaceSession();
    router.push("/office");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#e7ded2] text-[#211d19]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.92),rgba(255,255,255,0)_42%),linear-gradient(180deg,#f4efe8_0%,#e8ded1_58%,#d9c8b5_100%)]" />

      <div className="absolute inset-x-0 bottom-0 h-[43%] bg-[linear-gradient(180deg,rgba(174,135,96,0.05),rgba(128,88,54,0.18)),repeating-linear-gradient(90deg,rgba(98,67,43,0.06)_0,rgba(98,67,43,0.06)_1px,transparent_1px,transparent_110px)]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={returnToOffice}
          className="rounded-full bg-[#3b2415]/90 px-5 py-3 text-base font-medium text-white shadow-xl backdrop-blur-md transition hover:bg-[#2d1a0e] focus:outline-none focus:ring-4 focus:ring-white/50"
        >
          Back to Office
        </button>

        <div className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm text-[#64584e] shadow-lg backdrop-blur-md">
          Temporary Workspace
        </div>
      </header>

      <section className="relative z-10 flex min-h-dvh items-center justify-center px-4 pb-24 pt-24 sm:px-8">
        <div className="flex min-h-[58dvh] w-full max-w-6xl items-center justify-center rounded-[2.25rem] border border-white/50 bg-white/18 shadow-[0_30px_80px_rgba(77,52,31,0.12)] backdrop-blur-[2px]">
          {!ready ? (
            <p className="text-base text-[#6f6257]">
              Preparing the Workspace…
            </p>
          ) : session ? (
            <div className="w-full max-w-3xl px-6 py-12 sm:px-10">
              <p className="text-sm uppercase tracking-[0.18em] text-[#85776b]">
                Current task
              </p>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#332a23] sm:text-4xl">
                {session.request}
              </h1>

              <p className="mt-5 text-base leading-7 text-[#6f6257] sm:text-lg">
                Conversation, files, drafts and tools for this task will appear
                here. Nothing is saved permanently unless you choose to save it.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={returnToOffice}
                  className="rounded-full border border-[#6d513a]/20 bg-white/80 px-5 py-3 text-sm font-medium text-[#4d3929] shadow-sm"
                >
                  Return to Office
                </button>

                <button
                  type="button"
                  onClick={discardWorkspace}
                  className="rounded-full bg-[#6d513a] px-5 py-3 text-sm font-medium text-white shadow-sm"
                >
                  Discard task
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-md px-6 text-center">
              <p className="text-sm uppercase tracking-[0.18em] text-[#85776b]">
                Workspace
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#332a23] sm:text-4xl">
                No active task.
              </h1>

              <p className="mt-4 text-base leading-7 text-[#6f6257] sm:text-lg">
                Begin work from the Office. The current task will then appear
                here temporarily.
              </p>

              <button
                type="button"
                onClick={returnToOffice}
                className="mt-8 rounded-full bg-[#6d513a] px-6 py-3 text-base font-medium text-white shadow-lg"
              >
                Return to Office
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}