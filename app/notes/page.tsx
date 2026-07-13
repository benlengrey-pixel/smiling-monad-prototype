"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotesPage() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("smiling-monad-notes");

    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  function addNote() {
    const cleanNote = note.trim();

    if (!cleanNote) return;

    const updatedNotes = [...notes, cleanNote];

    setNotes(updatedNotes);

    localStorage.setItem(
      "smiling-monad-notes",
      JSON.stringify(updatedNotes)
    );

    setNote("");
  }

  return (
    <main className="min-h-screen bg-[#f7f2e8] p-8">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/project"
          className="text-blue-600 hover:underline"
        >
          ← Project
        </Link>

        <h1 className="mt-6 text-4xl font-bold">
          📝 Notes
        </h1>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter a note..."
          className="mt-8 w-full rounded-xl border bg-white p-4"
        />

        <button
          onClick={addNote}
          className="mt-6 rounded-full bg-black px-6 py-3 text-white"
        >
          Add Note
        </button>

        <div className="mt-10 rounded-xl border bg-white p-6">

          <h2 className="text-xl font-semibold">
            Notes
          </h2>

          <div className="mt-4 space-y-2">

            {notes.length === 0 ? (
              <p className="text-gray-500">
                No notes yet.
              </p>
            ) : (
              notes.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-3"
                >
                  {item}
                </div>
              ))
            )}

          </div>

        </div>

      </div>
    </main>
  );
}