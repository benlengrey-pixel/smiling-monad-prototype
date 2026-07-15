"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  clearTemporaryWorkspaceSession,
  readTemporaryWorkspaceSession,
  updateTemporaryWorkspaceSession,
  type TemporaryWorkspaceSession,
} from "@/lib/workspace/session-client";

type GatewayResult = {
  action: "draft" | "clarify" | "answer";
  application:
    | "shift-report"
    | "correspondence"
    | "notes"
    | "planning"
    | "general";
  title: string;
  question: string;
  content: string;
};

export default function WorkspacePage() {
  const hasStarted = useRef(false);

  const [session, setSession] =
    useState<TemporaryWorkspaceSession | null>(null);

  const [result, setResult] =
    useState<GatewayResult | null>(null);

  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentSession =
      readTemporaryWorkspaceSession();

    if (!currentSession) {
      return;
    }

    const activeSession =
      updateTemporaryWorkspaceSession({
        status: "active",
      }) ?? currentSession;

    setSession(activeSession);

    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    async function runCompanion() {
      setWorking(true);
      setError("");

      try {
        const response = await fetch("/api/gateway", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            request:
              activeSession.intent.originalRequest,
            memory: "",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "The Companion could not complete the task."
          );
        }

        setResult(data as GatewayResult);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "The Companion could not complete the task."
        );
      } finally {
        setWorking(false);
      }
    }

    runCompanion();
  }, []);

  function clearWorkspace() {
    clearTemporaryWorkspaceSession();
    setSession(null);
    setResult(null);
    setError("");
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
          onClick={clearWorkspace}
          className="rounded-full bg-white px-4 py-2 text-sm shadow-sm"
        >
          Clear Workspace
        </button>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center justify-center px-6 py-10">
        {!session && (
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

        {session && (
          <article className="w-full rounded-3xl bg-white p-8 shadow-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-[#7d6a5a]">
              Current task
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              {result?.title ||
                session.intent.title}
            </h1>

            <p className="mt-4 text-sm text-[#75675c]">
              {session.intent.originalRequest}
            </p>

            <div className="mt-8 rounded-2xl border border-black/10 bg-[#fbf8f3] p-6">
              {working && (
                <p className="text-center text-[#75675c]">
                  The Companion is working…
                </p>
              )}

              {error && (
                <div>
                  <p className="font-medium text-red-700">
                    The Companion could not complete
                    the task.
                  </p>

                  <p className="mt-2 text-sm text-red-600">
                    {error}
                  </p>
                </div>
              )}

              {result?.action === "clarify" && (
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7d6a5a]">
                    One question
                  </p>

                  <p className="mt-3 text-lg leading-7">
                    {result.question}
                  </p>
                </div>
              )}

              {result &&
                result.action !== "clarify" && (
                  <div className="whitespace-pre-wrap text-base leading-7">
                    {result.content}
                  </div>
                )}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}