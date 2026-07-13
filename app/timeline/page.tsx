"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function TimelinePage() {
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

  const totalItems = notes.length + goals.length + members.length;

  return (
    <main className="min-h-screen bg-[#f7f2e8] p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/project" className="text-blue-600 hover:underline">
          ← Project
        </Link>

        <h1 className="mt-6 text-4xl font-bold">🕒 Timeline</h1>

        <div className="mt-8 space-y-4">
          {members.map((member, index) => (
            <div key={`member-${index}`} className="rounded-xl border bg-white p-4">
              👥 Circle member added
              <br />
              <strong>{member}</strong>
            </div>
          ))}

          {goals.map((goal, index) => (
            <div key={`goal-${index}`} className="rounded-xl border bg-white p-4">
              🎯 Goal added
              <br />
              <strong>{goal}</strong>
            </div>
          ))}

          {notes.map((note, index) => (
            <div key={`note-${index}`} className="rounded-xl border bg-white p-4">
              📝 Note added
              <br />
              <strong>{note}</strong>
            </div>
          ))}

          {totalItems === 0 && (
            <div className="rounded-xl border bg-white p-4">
              Nothing has happened yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}