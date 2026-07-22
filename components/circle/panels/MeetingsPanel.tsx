"use client";

import type { SecureCircleMeeting } from "@/lib/circle/secure-circle-operations-client";

type MeetingsPanelProps = {
  meetings: SecureCircleMeeting[];
  title: string;
  date: string;
  purpose: string;
  onTitleChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onAddMeeting: () => void;
  onArchiveMeeting: (
    meetingId: string,
  ) => void;
};

export default function MeetingsPanel({
  meetings,
  title,
  date,
  purpose,
  onTitleChange,
  onDateChange,
  onPurposeChange,
  onAddMeeting,
  onArchiveMeeting,
}: MeetingsPanelProps) {
  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        Shared communication
      </p>

      <h1 className="mt-3 font-serif text-3xl">
        Meetings
      </h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_0.55fr]">
        <input
          value={title}
          onChange={(event) =>
            onTitleChange(event.target.value)
          }
          placeholder="Meeting title"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />

        <input
          type="date"
          value={date}
          onChange={(event) =>
            onDateChange(event.target.value)
          }
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />
      </div>

      <input
        value={purpose}
        onChange={(event) =>
          onPurposeChange(
            event.target.value,
          )
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onAddMeeting();
          }
        }}
        placeholder="Purpose"
        className="mt-3 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
      />

      <button
        type="button"
        onClick={onAddMeeting}
        className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
      >
        Add meeting
      </button>

      <div className="mt-6 space-y-3">
        {meetings.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
            No meetings have been added yet.
          </div>
        ) : (
          meetings.map((meeting) => (
            <article
              key={meeting.id}
              className="rounded-[20px] border border-[#dfd2c1] bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-xl">
                    {meeting.title}
                  </p>

                  <p className="mt-1 text-sm text-[#756151]">
                    {meeting.meeting_date ||
                      "Date not set"}
                  </p>

                  <p className="mt-3 leading-7 text-[#6b5d50]">
                    {meeting.purpose}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onArchiveMeeting(
                      meeting.id,
                    )
                  }
                  className="text-sm text-[#98765e]"
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