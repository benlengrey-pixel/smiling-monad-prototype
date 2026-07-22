"use client";

import type { SecureCircleResponsibility } from "@/lib/circle/secure-circle-operations-client";

type ResponsibilitiesPanelProps = {
  responsibilities: SecureCircleResponsibility[];
  title: string;
  owner: string;
  onTitleChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  onAddResponsibility: () => void;
  onAdvanceResponsibility: (
    responsibility: SecureCircleResponsibility,
  ) => void;
  onArchiveResponsibility: (
    responsibilityId: string,
  ) => void;
};

export default function ResponsibilitiesPanel({
  responsibilities,
  title,
  owner,
  onTitleChange,
  onOwnerChange,
  onAddResponsibility,
  onAdvanceResponsibility,
  onArchiveResponsibility,
}: ResponsibilitiesPanelProps) {
  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        Clear roles and follow-through
      </p>

      <h1 className="mt-3 font-serif text-3xl">
        Responsibilities
      </h1>

      <p className="mt-3 max-w-2xl leading-7 text-[#6b5d50]">
        This area can later include budgets,
        service agreements, consent, permissions,
        funding responsibilities and who is
        completing each agreed action.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_0.65fr]">
        <input
          value={title}
          onChange={(event) =>
            onTitleChange(event.target.value)
          }
          placeholder="Responsibility or action"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />

        <input
          value={owner}
          onChange={(event) =>
            onOwnerChange(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onAddResponsibility();
            }
          }}
          placeholder="Responsible person"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />
      </div>

      <button
        type="button"
        onClick={onAddResponsibility}
        className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
      >
        Add responsibility
      </button>

      <div className="mt-6 space-y-3">
        {responsibilities.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
            No responsibilities have been
            recorded yet.
          </div>
        ) : (
          responsibilities.map(
            (responsibility) => (
              <article
                key={responsibility.id}
                className="flex flex-col gap-4 rounded-[20px] border border-[#dfd2c1] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-serif text-xl">
                    {responsibility.title}
                  </p>

                  <p className="mt-1 text-sm text-[#756151]">
                    Responsible:{" "}
                    {
                      responsibility.owner_name
                    }
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onAdvanceResponsibility(
                        responsibility,
                      )
                    }
                    className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm text-[#533d2d]"
                  >
                    {
                      responsibility.responsibility_status
                    }
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onArchiveResponsibility(
                        responsibility.id,
                      )
                    }
                    className="px-2 py-2 text-sm text-[#98765e]"
                  >
                    Archive
                  </button>
                </div>
              </article>
            ),
          )
        )}
      </div>
    </>
  );
}