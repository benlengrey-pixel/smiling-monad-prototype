"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CirclePage() {
  const [member, setMember] = useState("");
  const [members, setMembers] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("smiling-monad-members");

    if (saved) {
      setMembers(JSON.parse(saved));
    }
  }, []);

  function saveMember() {
    const cleanMember = member.trim();

    if (!cleanMember) return;

    const updatedMembers = [...members, cleanMember];

    setMembers(updatedMembers);

    localStorage.setItem(
      "smiling-monad-members",
      JSON.stringify(updatedMembers)
    );

    setMember("");
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
          👥 Circle
        </h1>

        <input
          type="text"
          value={member}
          onChange={(e) => setMember(e.target.value)}
          placeholder="Enter member name..."
          className="mt-8 w-full rounded-xl border bg-white p-4"
        />

        <button
          onClick={saveMember}
          className="mt-6 rounded-full bg-black px-6 py-3 text-white"
        >
          Add Member
        </button>

        <div className="mt-10 rounded-xl border bg-white p-6">

          <h2 className="text-xl font-semibold">
            Circle Members
          </h2>

          <div className="mt-4 space-y-2">

            {members.length === 0 ? (
              <p className="text-gray-500">
                No members yet.
              </p>
            ) : (
              members.map((person, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-3"
                >
                  {person}
                </div>
              ))
            )}

          </div>

        </div>

      </div>
    </main>
  );
}