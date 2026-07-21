"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import CircleConversation from "@/components/circle/CircleConversation";
import {
  openSecureCircleWorkspace,
  type SecureCircleWorkspace,
} from "@/lib/circle/secure-circle-client";

export default function CircleConversationPage() {
  const [workspace, setWorkspace] =
    useState<SecureCircleWorkspace | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const nextWorkspace =
          await openSecureCircleWorkspace();

        setWorkspace(nextWorkspace);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "The Circle conversation could not be opened.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadWorkspace();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 text-[#2c2a26]">
        <div className="rounded-3xl border border-black/10 bg-white/80 px-7 py-6 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/45">
            Circle of Support
          </p>

          <p className="mt-3 text-lg font-semibold">
            Opening conversation…
          </p>
        </div>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
        <div className="w-full max-w-xl rounded-[2rem] border border-black/10 bg-white/85 p-7 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">
            Conversation unavailable
          </h1>

          <p className="mt-4 leading-7 text-black/60">
            {message ||
              "No active Circle of Support was found for this account."}
          </p>

          <Link
            href="/circle"
            className="mt-6 inline-flex rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Circle
          </Link>
        </div>
      </main>
    );
  }

  const senderName =
    workspace.membership.display_name ||
    workspace.participant.preferred_name ||
    workspace.participant.full_name ||
    workspace.user.email ||
    "Circle member";

  return (
    <main className="min-h-screen bg-[#f4efe5] px-4 py-6 text-[#2c2a26] sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-black/10 bg-white/80 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/40">
              Circle of Support
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              {workspace.circle.name}
            </h1>

            <p className="mt-2 text-sm leading-6 text-black/55">
              Shared conversation for active
              members of this Circle.
            </p>
          </div>

          <Link
            href="/circle"
            className="rounded-full border border-black/15 bg-white px-5 py-3 text-center text-sm font-semibold"
          >
            Back to Circle
          </Link>
        </header>

        <CircleConversation
          circleId={workspace.circle.id}
          senderName={senderName}
        />
      </div>
    </main>
  );
}