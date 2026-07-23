"use client";

import type { SecureCircleDirectoryEntry } from "@/lib/circle/secure-circle-directory-client";

type CircleDirectoryProps = {
  entries: SecureCircleDirectoryEntry[];
  loading: boolean;
  creating: boolean;
  openingCircleId: string;
  message: string;
  onCreateOwnCircle: () => void;
  onOpenCircle: (circleId: string) => void;
};

function roleLabel(
  role: SecureCircleDirectoryEntry["membership"]["role"],
): string {
  switch (role) {
    case "participant":
      return "Participant";
    case "nominee":
      return "Nominee";
    case "family":
      return "Family";
    case "support_worker":
      return "Support worker";
    case "support_coordinator":
      return "Support coordinator";
    case "professional":
      return "Professional";
    case "circle_manager":
      return "Circle manager";
    default:
      return "Circle member";
  }
}

function participantName(
  entry: SecureCircleDirectoryEntry,
): string {
  return (
    entry.participant.preferred_name.trim() ||
    entry.participant.full_name.trim() ||
    entry.circle.name
  );
}

function CircleCard({
  entry,
  opening,
  onOpen,
}: {
  entry: SecureCircleDirectoryEntry;
  opening: boolean;
  onOpen: () => void;
}) {
  return (
    <article className="rounded-[22px] border border-[#decfba] bg-white p-5 shadow-[0_12px_28px_rgba(71,49,32,0.08)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
            {entry.is_owned_circle
              ? "My own Circle"
              : roleLabel(entry.membership.role)}
          </p>

          <h2 className="mt-2 font-serif text-2xl text-[#3f2d20]">
            {participantName(entry)}
          </h2>

          <p className="mt-1 text-sm font-medium text-[#6c594a]">
            {entry.circle.name}
          </p>

          {entry.membership.relationship ? (
            <p className="mt-3 text-sm text-[#7a6859]">
              Relationship:{" "}
              {entry.membership.relationship}
            </p>
          ) : null}

          {entry.circle.purpose ? (
            <p className="mt-3 max-w-2xl leading-7 text-[#6b5d50]">
              {entry.circle.purpose}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onOpen}
          disabled={opening}
          className="shrink-0 rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {opening
            ? "Opening…"
            : "Open Circle"}
        </button>
      </div>
    </article>
  );
}

export default function CircleDirectory({
  entries,
  loading,
  creating,
  openingCircleId,
  message,
  onCreateOwnCircle,
  onOpenCircle,
}: CircleDirectoryProps) {
  const ownedCircles = entries.filter(
    (entry) => entry.is_owned_circle,
  );

  const supportedCircles = entries.filter(
    (entry) => !entry.is_owned_circle,
  );

  return (
    <section className="mx-auto w-full max-w-5xl rounded-[28px] border border-[#d9c7ad] bg-[rgba(255,250,241,0.98)] p-5 shadow-[0_30px_70px_rgba(25,18,12,0.32)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        Circle of Support Centre
      </p>

      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl leading-tight text-[#3f2d20] sm:text-4xl">
            My Circles
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-[#68584a]">
            Open your own Circle or choose a participant Circle where you have active access.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateOwnCircle}
          disabled={creating}
          className="shrink-0 rounded-full border border-[#bfa98d] bg-[#efe3d2] px-6 py-3 font-medium text-[#533d2d] transition hover:bg-[#e6d6c0] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {creating
            ? "Opening my Circle…"
            : ownedCircles.length > 0
              ? "Open my own Circle"
              : "Create my own Circle"}
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
          {message}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-7 rounded-[20px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-6 text-[#756151]">
          Loading your Circles…
        </div>
      ) : (
        <>
          <div className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-2xl text-[#3f2d20]">
                My own Circle
              </h2>

              <span className="text-sm text-[#8a786a]">
                {ownedCircles.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {ownedCircles.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-6 text-[#756151]">
                  You have not created your own Circle yet.
                </div>
              ) : (
                ownedCircles.map((entry) => (
                  <CircleCard
                    key={entry.circle.id}
                    entry={entry}
                    opening={
                      openingCircleId ===
                      entry.circle.id
                    }
                    onOpen={() =>
                      onOpenCircle(
                        entry.circle.id,
                      )
                    }
                  />
                ))
              )}
            </div>
          </div>

          <div className="mt-9">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-2xl text-[#3f2d20]">
                Circles I support
              </h2>

              <span className="text-sm text-[#8a786a]">
                {supportedCircles.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {supportedCircles.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-6 text-[#756151]">
                  No participant Circles are currently connected to this account.
                </div>
              ) : (
                supportedCircles.map((entry) => (
                  <CircleCard
                    key={entry.circle.id}
                    entry={entry}
                    opening={
                      openingCircleId ===
                      entry.circle.id
                    }
                    onOpen={() =>
                      onOpenCircle(
                        entry.circle.id,
                      )
                    }
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}