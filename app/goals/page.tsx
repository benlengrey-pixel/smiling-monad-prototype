"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function GoalsPage() {
  const [goal, setGoal] = useState("");
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("smiling-monad-goals");

    if (saved) {
      setGoals(JSON.parse(saved));
    }
  }, []);

  function addGoal() {
    const cleanGoal = goal.trim();

    if (!cleanGoal) return;

    const updatedGoals = [...goals, cleanGoal];

    setGoals(updatedGoals);

    localStorage.setItem(
      "smiling-monad-goals",
      JSON.stringify(updatedGoals)
    );

    setGoal("");
  }

  return (
    <main className="min-h-screen bg-[#f7f2e8] p-8">
      <div className="mx-auto max-w-3xl">

        <Link href="/project" className="text-blue-600 hover:underline">
          ← Project
        </Link>

        <h1 className="mt-6 text-4xl font-bold">
          🎯 Goals
        </h1>

        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Enter a goal..."
          className="mt-8 w-full rounded-xl border bg-white p-4"
        />

        <button
          onClick={addGoal}
          className="mt-6 rounded-full bg-black px-6 py-3 text-white"
        >
          Add Goal
        </button>

        <div className="mt-10 rounded-xl border bg-white p-6">

          <h2 className="text-xl font-semibold">
            Goals
          </h2>

          <div className="mt-4 space-y-2">

            {goals.length === 0 ? (
              <p className="text-gray-500">
                No goals yet.
              </p>
            ) : (
              goals.map((item, index) => (
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