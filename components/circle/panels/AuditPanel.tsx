"use client";

import type { DisplayAuditEvent } from "@/lib/circle/secure-audit-actors";

type AuditPanelProps = {
  events: DisplayAuditEvent[];
  loading: boolean;
  message: string;
};

export default function AuditPanel({
  events,
  loading,
  message,
}: AuditPanelProps) {
  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        Security and accountability
      </p>

      <h1 className="mt-3 font-serif text-3xl">
        Audit history
      </h1>

      <p className="mt-3 max-w-2xl leading-7 text-[#6b5d50]">
        A secure, append-only record of changes to this Circle, including consent, membership, permissions and participant information.
      </p>

      {loading ? (
        <div className="mt-6 rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
          Loading secure audit history…
        </div>
      ) : message ? (
        <p className="mt-6 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
          {message}
        </p>
      ) : events.length === 0 ? (
        <div className="mt-6 rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
          No audit events are available for this Circle yet.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-[18px] border border-[#decfba] bg-[#f7efe4] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#4c3728]">
                    {event.event_summary ||
                      event.entity_type}
                  </p>

                  <p className="mt-1 text-sm text-[#756151]">
                    {event.actor_name}
                    {" · "}
                    {event.action
                      .split("_")
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1),
                      )
                      .join(" ")}
                    {" · "}
                    {event.entity_type}
                  </p>
                </div>

                <time className="text-xs text-[#8b745d]">
                  {new Date(
                    event.created_at,
                  ).toLocaleString()}
                </time>
              </div>

              {event.changed_fields.length > 0 ? (
                <p className="mt-3 text-sm leading-6 text-[#6d5e50]">
                  Changed:{" "}
                  {event.changed_fields
                    .map((field) =>
                      field.replaceAll("_", " "),
                    )
                    .join(", ")}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </>
  );
}