"use client";

import ParticipantPrivacyGate from "@/components/circle/ParticipantPrivacyGate";
import type { SecureConsentSummary } from "@/lib/circle/secure-consent-status-client";

export type PersonProfileValues = {
  personName: string;
  preferredName: string;
  whatMatters: string;
  communication: string;
};

type PersonProfilePanelProps = {
  participantId: string;
  circleId: string;
  profile: PersonProfileValues;
  consentSummary: SecureConsentSummary | null;
  loaded: boolean;
  saving: boolean;
  message: string;
  onProfileChange: (
    field: keyof PersonProfileValues,
    value: string,
  ) => void;
  onSaveProfile: () => void;
};

export default function PersonProfilePanel({
  participantId,
  circleId,
  profile,
  consentSummary,
  loaded,
  saving,
  message,
  onProfileChange,
  onSaveProfile,
}: PersonProfilePanelProps) {
  const participantName =
    profile.preferredName ||
    profile.personName ||
    "this person";

  const consentLabel =
    consentSummary?.health === "current"
      ? "Current"
      : consentSummary?.health ===
          "review_due"
        ? "Review due"
        : consentSummary?.health ===
            "expired"
          ? "Expired"
          : consentSummary?.health ===
              "withdrawn"
            ? "Withdrawn"
            : "Not recorded";

  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        The person at the centre
      </p>

      <h1 className="mt-3 font-serif text-3xl">
        Person profile
      </h1>

      <p className="mt-3 max-w-2xl leading-7 text-[#6b5d50]">
        Begin with who the person is, what
        matters to them and how they
        communicate—not with services or
        paperwork.
      </p>

      <div className="mt-6 rounded-[18px] border border-[#d8c7b1] bg-[#f7efe4] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
              Privacy consent
            </p>

            <p className="mt-2 font-semibold text-[#4c3728]">
              {consentSummary?.message ??
                "Checking privacy consent…"}
            </p>
          </div>

          <span className="rounded-full border border-[#d0bea7] bg-white px-3 py-1 text-xs font-semibold text-[#6d5e50]">
            {consentLabel}
          </span>
        </div>

        {consentSummary?.health &&
        consentSummary.health !== "current" ? (
          <p className="mt-3 text-sm leading-6 text-[#6d5e50]">
            Personal information should not be relied on until consent is current. Use the consent controls below to review or record consent.
          </p>
        ) : null}
      </div>

      <ParticipantPrivacyGate
        participantId={participantId}
        circleId={circleId}
        participantName={participantName}
      >
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">
              Full name
            </span>

            <input
              value={profile.personName}
              onChange={(event) =>
                onProfileChange(
                  "personName",
                  event.target.value,
                )
              }
              onBlur={onSaveProfile}
              className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Preferred name
            </span>

            <input
              value={profile.preferredName}
              onChange={(event) =>
                onProfileChange(
                  "preferredName",
                  event.target.value,
                )
              }
              onBlur={onSaveProfile}
              className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium">
            What matters to this person?
          </span>

          <textarea
            value={profile.whatMatters}
            onChange={(event) =>
              onProfileChange(
                "whatMatters",
                event.target.value,
              )
            }
            onBlur={onSaveProfile}
            placeholder="Important relationships, routines, interests, hopes, preferences and things that help life feel right."
            className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 leading-7 outline-none focus:border-[#71523b]"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium">
            Communication and decision support
          </span>

          <textarea
            value={profile.communication}
            onChange={(event) =>
              onProfileChange(
                "communication",
                event.target.value,
              )
            }
            onBlur={onSaveProfile}
            placeholder="How the person communicates, understands information, expresses consent, makes choices and shows when something is wrong."
            className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 leading-7 outline-none focus:border-[#71523b]"
          />
        </label>

        <p className="mt-5 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
          {!loaded
            ? "Opening your secure Circle profile…"
            : saving
              ? "Saving securely…"
              : message ||
                "Changes save securely when you leave a field."}
        </p>
      </ParticipantPrivacyGate>
    </>
  );
}