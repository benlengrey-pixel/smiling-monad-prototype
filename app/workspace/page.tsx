"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  clearTemporaryWorkspaceSession,
  readTemporaryWorkspaceSession,
  updateTemporaryWorkspaceSession,
  type TemporaryWorkspaceSession,
} from "@/lib/workspace/session-client";

export default function WorkspacePage() {
  const [session, setSession] =
    useState<TemporaryWorkspaceSession | null>(null);

  useEffect(() => {
    const currentSession =
      readTemporaryWorkspaceSession();

    if (currentSession) {
      setSession(
        updateTemporaryWorkspaceSession({
          status: "active",
        }) ?? currentSession
      );
    }
  }, []);

  function closeWorkspace() {
    clearTemporaryWorkspaceSession();
    setSession(null);
  }

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#34271f]">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4">
        <Link
          href="/office"
          className="rounded-full bg-white px-4 py-2 text-sm shadow-sm"
        >
          Back to Office
        </Link>

        <button
          type="button"
          onClick={closeWorkspace}
          className="rounded-full bg-white px-4 py-2 text-sm shadow-sm"
        >
          Clear Workspace
        </button>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center justify-center px-6 py-10">
        {session ? (
          <article className="w-full rounded-3xl bg-white p-8 shadow-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7d6a5a]">
              Current task
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              {session.intent.title}
            </h1>

            <p className="mt-5 text-base leading-7 text-[#66584d]">
              {session.intent.originalRequest}
            </p>

            <div className="mt-8 rounded-2xl border border-dashed border-black/20 bg-[#fbf8f3] p-8 text-center text-sm text-[#75675c]">
              The Companion will work on this task here.
            </div>
          </article>
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-semibold">
              Workspace
            </h1>

            <p className="mt-3 text-[#75675c]">
              No current task is open.
            </p>

            <Link
              href="/office"
              className="mt-6 inline-block rounded-full bg-white px-5 py-3 shadow-sm"
            >
              Return to Office
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}