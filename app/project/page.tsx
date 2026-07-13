"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProjectPage() {
  const [notes, setNotes] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [members, setMembers] = useState<string[]>([]);

  useEffect(() => {
    const savedNotes = localStorage.getItem("smiling-monad-notes");
    const savedGoals = localStorage.getItem("smiling-monad-goals");
    const savedMembers = localStorage.getItem("smiling-monad-members");

    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedMembers) setMembers(JSON.parse(savedMembers));
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f2e8] p-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Home
        </Link>

        <h1 className="mt-6 text-4xl font-bold">My First Project</h1>

        <p className="mt-2 text-gray-600">
          The beginning of your Smiling Monad workspace.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Link
            href="/notes"
            className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">📝 Notes</h2>
            <p className="mt-2 text-gray-500">{notes.length} Notes</p>
            <p className="mt-3 text-sm text-gray-500">
              {notes.length ? notes.join(", ") : "No notes yet"}
            </p>
          </Link>

          <Link
            href="/circle"
            className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">👥 Circle</h2>
            <p className="mt-2 text-gray-500">{members.length} Members</p>
            <p className="mt-3 text-sm text-gray-500">
              {members.length ? members.join(", ") : "No members yet"}
            </p>
          </Link>

          <Link
            href="/goals"
            className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">🎯 Goals</h2>
            <p className="mt-2 text-gray-500">{goals.length} Goals</p>
            <p className="mt-3 text-sm text-gray-500">
              {goals.length ? goals.join(", ") : "No goals yet"}
            </p>
          </Link>

          <Link
            href="/timeline"
            className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">🕒 Timeline</h2>
            <p className="mt-2 text-gray-500">Project history</p>
            <p className="mt-3 text-sm text-gray-500">
              View all saved information
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}