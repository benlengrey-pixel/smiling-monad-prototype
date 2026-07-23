"use client";

import type { SecureCircleBudgetItem } from "@/lib/circle/secure-circle-operations-client";

type BudgetPanelProps = {
  budgets: SecureCircleBudgetItem[];
  totalAllocated: number;
  totalSpent: number;
  title: string;
  category: SecureCircleBudgetItem["category"];
  allocated: string;
  spent: string;
  owner: string;
  onTitleChange: (value: string) => void;
  onCategoryChange: (
    value: SecureCircleBudgetItem["category"],
  ) => void;
  onAllocatedChange: (
    value: string,
  ) => void;
  onSpentChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
  onAddBudgetItem: () => void;
  onAdvanceBudgetStatus: (
    item: SecureCircleBudgetItem,
  ) => void;
  onArchiveBudgetItem: (
    itemId: string,
  ) => void;
};

export default function BudgetPanel({
  budgets,
  totalAllocated,
  totalSpent,
  title,
  category,
  allocated,
  spent,
  owner,
  onTitleChange,
  onCategoryChange,
  onAllocatedChange,
  onSpentChange,
  onOwnerChange,
  onAddBudgetItem,
  onAdvanceBudgetStatus,
  onArchiveBudgetItem,
}: BudgetPanelProps) {
  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        Funding and shared oversight
      </p>

      <h1 className="mt-3 font-serif text-3xl">
        Budget and funding
      </h1>

      <p className="mt-3 max-w-3xl leading-7 text-[#6b5d50]">
        Record broad funding allocations,
        spending and responsibility so the
        Circle can see what is available and
        what may need review. This is a
        coordination tool, not formal financial
        advice or plan-manager accounting.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-[#decfba] bg-[#f4eadc] p-5">
          <p className="text-sm text-[#6c594a]">
            Allocated
          </p>
          <p className="mt-2 text-3xl font-semibold">
            ${totalAllocated.toLocaleString()}
          </p>
        </div>

        <div className="rounded-[18px] border border-[#decfba] bg-[#f4eadc] p-5">
          <p className="text-sm text-[#6c594a]">
            Spent
          </p>
          <p className="mt-2 text-3xl font-semibold">
            ${totalSpent.toLocaleString()}
          </p>
        </div>

        <div className="rounded-[18px] border border-[#decfba] bg-[#f4eadc] p-5">
          <p className="text-sm text-[#6c594a]">
            Remaining
          </p>
          <p className="mt-2 text-3xl font-semibold">
            ${Math.max(
              0,
              totalAllocated - totalSpent,
            ).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <input
          value={title}
          onChange={(event) =>
            onTitleChange(event.target.value)
          }
          placeholder="Budget or funding area"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />

        <select
          value={category}
          onChange={(event) =>
            onCategoryChange(
              event.target
                .value as SecureCircleBudgetItem["category"],
            )
          }
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        >
          <option value="core">Core</option>
          <option value="capacity_building">
            Capacity Building
          </option>
          <option value="capital">
            Capital
          </option>
          <option value="Other">
            Other
          </option>
        </select>

        <input
          type="number"
          min="0"
          step="0.01"
          value={allocated}
          onChange={(event) =>
            onAllocatedChange(
              event.target.value,
            )
          }
          placeholder="Allocated amount"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />

        <input
          type="number"
          min="0"
          step="0.01"
          value={spent}
          onChange={(event) =>
            onSpentChange(event.target.value)
          }
          placeholder="Spent so far"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />

        <input
          value={owner}
          onChange={(event) =>
            onOwnerChange(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onAddBudgetItem();
            }
          }}
          placeholder="Responsible person"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b] md:col-span-2"
        />
      </div>

      <button
        type="button"
        onClick={onAddBudgetItem}
        className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
      >
        Add budget item
      </button>

      <div className="mt-6 space-y-3">
        {budgets.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
            No budget items have been
            recorded yet.
          </div>
        ) : (
          budgets.map((item) => {
            const remaining =
              item.allocated - item.spent;

            const percentage =
              item.allocated > 0
                ? Math.min(
                    100,
                    Math.round(
                      (item.spent /
                        item.allocated) *
                        100,
                    ),
                  )
                : 0;

            return (
              <article
                key={item.id}
                className="rounded-[20px] border border-[#dfd2c1] bg-white p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-serif text-xl">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm text-[#756151]">
                      {item.category} ·
                      Responsible:{" "}
                      {item.owner_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onAdvanceBudgetStatus(
                          item,
                        )
                      }
                      className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm text-[#533d2d]"
                    >
                      {item.budget_status ===
                      "review_needed"
                        ? "Review needed"
                        : item.budget_status ===
                            "closed"
                          ? "Closed"
                          : "Active"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onArchiveBudgetItem(
                          item.id,
                        )
                      }
                      className="px-2 py-2 text-sm text-[#98765e]"
                    >
                      Archive
                    </button>
                  </div>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#eee2d2]">
                  <div
                    className="h-full rounded-full bg-[#71523b]"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <div className="mt-3 grid gap-2 text-sm text-[#6b5d50] sm:grid-cols-3">
                  <p>
                    Allocated:{" "}
                    <strong>
                      $
                      {item.allocated.toLocaleString()}
                    </strong>
                  </p>

                  <p>
                    Spent:{" "}
                    <strong>
                      $
                      {item.spent.toLocaleString()}
                    </strong>
                  </p>

                  <p>
                    Remaining:{" "}
                    <strong>
                      $
                      {remaining.toLocaleString()}
                    </strong>
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}