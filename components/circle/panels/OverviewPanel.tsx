"use client";

import type { SecureConsentSummary } from "@/lib/circle/secure-consent-status-client";

export type OverviewPanelTarget =
  | "members"
  | "goals"
  | "documents"
  | "conversation"
  | "meetings"
  | "responsibilities"
  | "budget"
  | "person"
  | "training"
  | "audit";

type OverviewPanelProps = {
  personDisplayName: string;
  memberCount: number;
  activeGoals: number;
  documentsNeedingReview: number;
  messageCount: number;
  meetingCount: number;
  openResponsibilities: number;
  totalBudgetAllocated: number;
  totalBudgetSpent: number;
  profileReady: boolean;
  pendingTrainingRequirements: number;
  consentSummary: SecureConsentSummary | null;
  auditEventCount: number;
  onOpenPanel: (
    panel: OverviewPanelTarget,
  ) => void;
};

export default function OverviewPanel({
  personDisplayName,
  memberCount,
  activeGoals,
  documentsNeedingReview,
  messageCount,
  meetingCount,
  openResponsibilities,
  totalBudgetAllocated,
  totalBudgetSpent,
  profileReady,
  pendingTrainingRequirements,
  consentSummary,
  auditEventCount,
  onOpenPanel,
}: OverviewPanelProps) {
  const privacyConsentStatus =
    consentSummary?.health === "current"
      ? "Current"
      : consentSummary?.health ===
          "review_due"
        ? "Review"
        : consentSummary?.health ===
            "expired"
          ? "Expired"
          : consentSummary?.health ===
              "withdrawn"
            ? "Withdrawn"
            : "Missing";

  const summaryItems: Array<{
    label: string;
    value: string | number;
    panel: OverviewPanelTarget;
  }> = [
    {
      label: "Circle members",
      value: memberCount,
      panel: "members",
    },
    {
      label: "Active goals",
      value: activeGoals,
      panel: "goals",
    },
    {
      label: "Documents for review",
      value: documentsNeedingReview,
      panel: "documents",
    },
    {
      label: "Circle messages",
      value: messageCount,
      panel: "conversation",
    },
    {
      label: "Upcoming meetings",
      value: meetingCount,
      panel: "meetings",
    },
    {
      label: "Open responsibilities",
      value: openResponsibilities,
      panel: "responsibilities",
    },
    {
      label: "Budget remaining",
      value: `$${Math.max(
        0,
        totalBudgetAllocated -
          totalBudgetSpent,
      ).toLocaleString()}`,
      panel: "budget",
    },
    {
      label: "Person profile",
      value: profileReady
        ? "Ready"
        : "Start",
      panel: "person",
    },
    {
      label:
        "Mandatory training pending",
      value: pendingTrainingRequirements,
      panel: "training",
    },
    {
      label: "Privacy consent",
      value: privacyConsentStatus,
      panel: "person",
    },
    {
      label: "Audit events",
      value: auditEventCount,
      panel: "audit",
    },
  ];

  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        Circle of Support Centre
      </p>

      <h1 className="mt-3 pr-12 font-serif text-3xl leading-tight sm:text-4xl">
        {personDisplayName} remains at the
        centre
      </h1>

      <p className="mt-4 max-w-3xl leading-7 text-[#68584a]">
        The Circle Centre helps people
        coordinate goals, relationships,
        meetings, documents, budgets and
        responsibilities around the life of
        the person. Kimi can help the circle
        understand, organise and prepare—but
        the person remains in control.
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {summaryItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() =>
              onOpenPanel(item.panel)
            }
            className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5 text-left transition hover:bg-[#ede0cd]"
          >
            <p className="text-3xl font-semibold">
              {item.value}
            </p>

            <p className="mt-2 text-sm text-[#6c594a]">
              {item.label}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-7 rounded-[22px] border border-[#d8c7b1] bg-[#f7efe4] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
          Privacy consent
        </p>

        <p className="mt-2 font-serif text-2xl">
          {consentSummary?.message ??
            "Checking privacy consent…"}
        </p>

        {consentSummary?.consent ? (
          <div className="mt-4 grid gap-2 text-sm leading-6 text-[#6a5b4e] sm:grid-cols-2">
            <p>
              Given by:{" "}
              <span className="font-semibold">
                {consentSummary.consent
                  .given_by_name ||
                  "Not recorded"}
              </span>
            </p>

            <p>
              Authority:{" "}
              <span className="font-semibold">
                {consentSummary.consent
                  .authority_basis.replaceAll(
                    "_",
                    " ",
                  )}
              </span>
            </p>

            <p>
              Review due:{" "}
              <span className="font-semibold">
                {consentSummary.consent
                  .review_due_at
                  ? new Date(
                      consentSummary.consent
                        .review_due_at,
                    ).toLocaleDateString()
                  : "No date set"}
              </span>
            </p>

            <p>
              Valid until:{" "}
              <span className="font-semibold">
                {consentSummary.consent
                  .valid_until
                  ? new Date(
                      consentSummary.consent
                        .valid_until,
                    ).toLocaleDateString()
                  : "No expiry set"}
              </span>
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-7 rounded-[22px] border border-[#d8c7b1] bg-[#efe3d3] p-5 sm:p-6">
        <p className="font-serif text-2xl">
          Kimi’s role
        </p>

        <p className="mt-3 leading-7 text-[#6a5b4e]">
          Kimi can prepare meeting agendas,
          identify missing information,
          summarise updates, draft plans and
          agreements, track responsibilities
          and help everyone communicate
          clearly. Kimi does not replace the
          person, family, workers or
          professionals.
        </p>
      </div>
    </>
  );
}