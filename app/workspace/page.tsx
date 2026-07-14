"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import WorkspaceCanvas from "@/components/workspace/WorkspaceCanvas";
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
        <div className="min-h-[calc(100dvh-7.5rem)] p-4 sm:p-6">
          <WorkspaceCanvas
            title={session.request}
            description="This task is temporary. Only the conversation, files, document, or tools needed to complete it will appear here."
          />
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