"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import WorkspaceShell from "@/components/workspace/WorkspaceShell";
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
    <WorkspaceShell
      onBackToOffice={returnToOffice}
      onDiscard={discardWorkspace}
      showDiscard={Boolean(session)}
    >
      {!ready ? (
        <div className="flex min-h-[calc(100dvh-7.5rem)] items-center justify-center px-6">
          <p className="text-base text-[#6f6257]">
            Preparing the Workspace…
          </p>
        </div>
      ) : session ? (
        <div className="grid min-h-[calc(100dvh-7.5rem)] grid-rows-[auto_1fr]">
          <header className="border-b border-white/45 px-6 py-6 sm:px-10 sm:py-8">
            <p className="text-xs uppercase tracking-[0.18em] text-[#85776b]">
              Current task
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#332a23] sm:text-4xl">
              {session.request}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6f6257] sm:text-base">
              This Workspace is temporary. Conversation, files, notes, tools and
              drafts will appear here while you complete the task.
            </p>
          </header>

          <div className="grid min-h-0 gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_320px] sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="flex min-h-[48dvh] items-center justify-center rounded-[1.75rem] border border-white/50 bg-white/25 p-6">
              <div className="max-w-md text-center">
                <p className="text-sm uppercase tracking-[0.16em] text-[#8a7b6f]">
                  Active work
                </p>

                <h2 className="mt-3 text-2xl font-semibold text-[#3b3028]">
                  The task will be completed here.
                </h2>

                <p className="mt-4 text-base leading-7 text-[#716358]">
                  The next steps will add the Companion conversation, temporary
                  files, live documents and task-specific tools to this area.
                </p>
              </div>
            </section>

            <aside className="grid content-start gap-4">
              <section className="rounded-[1.5rem] border border-white/55 bg-white/60 p-5 shadow-sm backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8a7b6f]">
                  Workspace status
                </p>

                <dl className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[#74675c]">Storage</dt>
                    <dd className="font-medium text-[#3e332b]">Use once</dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[#74675c]">Files</dt>
                    <dd className="font-medium text-[#3e332b]">None</dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[#74675c]">Saved</dt>
                    <dd className="font-medium text-[#3e332b]">No</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-[1.5rem] border border-white/55 bg-white/60 p-5 shadow-sm backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8a7b6f]">
                  Available areas
                </p>

                <div className="mt-4 grid gap-2 text-sm text-[#4d4138]">
                  <p>Conversation</p>
                  <p>Files and images</p>
                  <p>Draft document</p>
                  <p>Task tools</p>
                  <p>Save or export</p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[calc(100dvh-7.5rem)] items-center justify-center px-6">
          <div className="max-w-md text-center">
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
        </div>
      )}
    </WorkspaceShell>
  );
}