"use client";

import type { SecureCircleGoal } from "@/lib/circle/secure-goals-client";

type GoalsPanelProps = {
  goals: SecureCircleGoal[];
  loading: boolean;
  workingId: string;
  message: string;
  title: string;
  owner: string;
  onTitleChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  onAddGoal: () => void;
  onAdvanceGoal: (goal: SecureCircleGoal) => void;
  onArchiveGoal: (goalId: string) => void;
};

export default function GoalsPanel({
  goals,
  loading,
  workingId,
  message,
  title,
  owner,
  onTitleChange,
  onOwnerChange,
  onAddGoal,
  onAdvanceGoal,
  onArchiveGoal,
}: GoalsPanelProps) {
  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        What the circle is working toward
      </p>

      <h1 className="mt-3 font-serif text-3xl">
        Goals and projects
      </h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_0.7fr]">
        <input
          value={title}
          onChange={(event) =>
            onTitleChange(event.target.value)
          }
          placeholder="Goal or project"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />

        <input
          value={owner}
          onChange={(event) =>
            onOwnerChange(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onAddGoal();
            }
          }}
          placeholder="Lead person"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />
      </div>

      <button
        type="button"
        onClick={onAddGoal}
        disabled={
          workingId === "new" ||
          !title.trim()
        }
        className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {workingId === "new"
          ? "Saving goal…"
          : "Add goal"}
      </button>

      {message && (
        <p className="mt-3 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
          {message}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
            Loading secure goals…
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
            No goals have been added yet.
          </div>
        ) : (
          goals.map((goal) => (
            <article
              key={goal.id}
              className="flex flex-col gap-4 rounded-[20px] border border-[#dfd2c1] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-serif text-xl">
                  {goal.title}
                </p>

                <p className="mt-1 text-sm text-[#756151]">
                  Lead:{" "}
                  {goal.owner_name ||
                    "Whole circle"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onAdvanceGoal(goal)
                  }
                  disabled={
                    workingId === goal.id
                  }
                  className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm text-[#533d2d] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {workingId === goal.id
                    ? "Saving…"
                    : goal.goal_status ===
                        "planning"
                      ? "Planning"
                      : goal.goal_status ===
                          "active"
                        ? "Active"
                        : goal.goal_status ===
                            "achieved"
                          ? "Achieved"
                          : goal.goal_status}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onArchiveGoal(goal.id)
                  }
                  disabled={
                    workingId === goal.id
                  }
                  className="px-2 py-2 text-sm text-[#98765e] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Archive
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}