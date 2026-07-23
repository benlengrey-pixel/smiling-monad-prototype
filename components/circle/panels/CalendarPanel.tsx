"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  SecureCircleScheduleAssignment,
  SecureCircleScheduleAssignmentRole,
  SecureCircleScheduleEvent,
  SecureCircleScheduleEventStatus,
  SecureCircleScheduleEventType,
  SecureCircleScheduleResponseStatus,
} from "@/lib/circle/secure-circle-calendar-client";

import type {
  SecureCircleMemberRecord,
} from "@/lib/circle/secure-circle-operations-client";

import type {
  CircleCalendarView,
} from "@/hooks/circle/useCircleCalendar";

export type CircleCalendarPanelForm = {
  title: string;
  eventType:
    SecureCircleScheduleEventType;
  startAt: string;
  endAt: string;
  allDay: boolean;
  timezone: string;
  location: string;
  notes: string;
  recurrenceRule: string;
  recurrenceEndAt: string;
  reminderMinutes: string;
};

type CalendarPanelProps = {
  view: CircleCalendarView;
  cursor: Date;
  selectedDate: string;

  events:
    SecureCircleScheduleEvent[];

  eventsByDate: Record<
    string,
    SecureCircleScheduleEvent[]
  >;

  selectedDateEvents:
    SecureCircleScheduleEvent[];

  upcomingEvents:
    SecureCircleScheduleEvent[];

  assignmentsByEvent: Record<
    string,
    SecureCircleScheduleAssignment[]
  >;

  members:
    SecureCircleMemberRecord[];

  loading: boolean;
  workingId: string;
  message: string;

  selectedEventId: string;
  form: CircleCalendarPanelForm;

  onViewChange:
    (view: CircleCalendarView) => void;

  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;

  onSelectDate:
    (date: Date | string) => void;

  onStartNewEvent:
    (date?: Date | string) => void;

  onSelectEvent:
    (
      event:
        SecureCircleScheduleEvent,
    ) => void;

  onFormFieldChange: <
    Key extends
      keyof CircleCalendarPanelForm,
  >(
    key: Key,
    value:
      CircleCalendarPanelForm[Key],
  ) => void;

  onSaveEvent: () => void;

  onSetEventStatus: (
    eventId: string,
    status:
      SecureCircleScheduleEventStatus,
  ) => void;

  onArchiveEvent:
    (eventId: string) => void;

  onAssignMember: (input: {
    eventId: string;
    circleMemberId: string;
    assignmentRole?:
      SecureCircleScheduleAssignmentRole;
  }) => void;

  onRespondToAssignment: (
    assignmentId: string,
    responseStatus:
      SecureCircleScheduleResponseStatus,
  ) => void;
};

const WEEKDAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const EVENT_TYPE_LABELS:
  Record<
    SecureCircleScheduleEventType,
    string
  > = {
  appointment: "Appointment",
  shift: "Shift",
  meeting: "Meeting",
  activity: "Activity",
  deadline: "Deadline",
  transport: "Transport",
  health: "Health",
  personal: "Personal",
  other: "Other",
};

const EVENT_STATUS_LABELS:
  Record<
    SecureCircleScheduleEventStatus,
    string
  > = {
  planned: "Planned",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  archived: "Archived",
};

function startOfDay(
  value: Date,
): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(
  value: Date,
  amount: number,
): Date {
  const date = new Date(value);
  date.setDate(
    date.getDate() + amount,
  );
  return date;
}

function startOfWeek(
  value: Date,
): Date {
  const date = startOfDay(value);
  const day = date.getDay();
  const offset =
    day === 0 ? 6 : day - 1;

  return addDays(date, -offset);
}

function startOfMonthGrid(
  value: Date,
): Date {
  const firstDay = new Date(
    value.getFullYear(),
    value.getMonth(),
    1,
  );

  return startOfWeek(firstDay);
}

function toDateKey(
  value: Date,
): string {
  const year = value.getFullYear();

  const month = String(
    value.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    value.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatCursorLabel(
  view: CircleCalendarView,
  cursor: Date,
): string {
  if (view === "month") {
    return new Intl.DateTimeFormat(
      "en-AU",
      {
        month: "long",
        year: "numeric",
      },
    ).format(cursor);
  }

  if (view === "week") {
    const start =
      startOfWeek(cursor);

    const end =
      addDays(start, 6);

    const startLabel =
      new Intl.DateTimeFormat(
        "en-AU",
        {
          day: "numeric",
          month: "short",
        },
      ).format(start);

    const endLabel =
      new Intl.DateTimeFormat(
        "en-AU",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
      ).format(end);

    return `${startLabel} – ${endLabel}`;
  }

  return "Upcoming schedule";
}

function formatEventTime(
  event:
    SecureCircleScheduleEvent,
): string {
  if (event.all_day) {
    return "All day";
  }

  const start =
    new Date(event.start_at);

  const end =
    new Date(event.end_at);

  const formatter =
    new Intl.DateTimeFormat(
      "en-AU",
      {
        hour: "numeric",
        minute: "2-digit",
      },
    );

  return `${formatter.format(
    start,
  )} – ${formatter.format(end)}`;
}

function formatEventDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "en-AU",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
}

function memberLabel(
  member:
    SecureCircleMemberRecord,
): string {
  return (
    member.display_name ||
    member.invited_email ||
    "Circle member"
  );
}

export default function CalendarPanel({
  view,
  cursor,
  selectedDate,
  events,
  eventsByDate,
  selectedDateEvents,
  upcomingEvents,
  assignmentsByEvent,
  members,
  loading,
  workingId,
  message,
  selectedEventId,
  form,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onSelectDate,
  onStartNewEvent,
  onSelectEvent,
  onFormFieldChange,
  onSaveEvent,
  onSetEventStatus,
  onArchiveEvent,
  onAssignMember,
  onRespondToAssignment,
}: CalendarPanelProps) {
  const [
    assignmentMemberId,
    setAssignmentMemberId,
  ] = useState("");

  const [
    assignmentRole,
    setAssignmentRole,
  ] = useState<
    SecureCircleScheduleAssignmentRole
  >("attendee");

  const monthDays = useMemo(
    () => {
      const start =
        startOfMonthGrid(cursor);

      return Array.from(
        { length: 42 },
        (_, index) =>
          addDays(start, index),
      );
    },
    [cursor],
  );

  const weekDays = useMemo(
    () => {
      const start =
        startOfWeek(cursor);

      return Array.from(
        { length: 7 },
        (_, index) =>
          addDays(start, index),
      );
    },
    [cursor],
  );

  const memberById = useMemo(
    () =>
      Object.fromEntries(
        members.map((member) => [
          member.id,
          member,
        ]),
      ) as Record<
        string,
        SecureCircleMemberRecord
      >,
    [members],
  );

  const selectedEvent =
    events.find(
      (event) =>
        event.id ===
        selectedEventId,
    ) ?? null;

  const selectedAssignments =
    selectedEvent
      ? assignmentsByEvent[
          selectedEvent.id
        ] ?? []
      : [];

  const activeMembers =
    members.filter(
      (member) =>
        member.membership_status ===
          "active" ||
        member.membership_status ===
          "invited",
    );

  const todayKey =
    toDateKey(new Date());

  const isSaving =
    workingId === "new" ||
    workingId === selectedEventId;

  function assignSelectedMember() {
    if (
      !selectedEvent ||
      !assignmentMemberId
    ) {
      return;
    }

    onAssignMember({
      eventId: selectedEvent.id,
      circleMemberId:
        assignmentMemberId,
      assignmentRole,
    });

    setAssignmentMemberId("");
    setAssignmentRole(
      "attendee",
    );
  }

  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        Shared planning
      </p>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">
            Calendar
          </h1>

          <p className="mt-2 max-w-2xl leading-7 text-[#756151]">
            Plan shifts, appointments,
            meetings, activities and
            deadlines for this Circle.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onStartNewEvent(
              selectedDate,
            )
          }
          className="rounded-full bg-[#60432f] px-5 py-3 font-medium text-white transition hover:bg-[#4f3728]"
        >
          Add schedule item
        </button>
      </div>

      <div className="mt-6 rounded-[24px] border border-[#dfd2c1] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevious}
              aria-label="Previous calendar period"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6c6b1] text-lg text-[#60432f] transition hover:bg-[#f7efe4]"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={onToday}
              className="rounded-full border border-[#d6c6b1] px-4 py-2 text-sm font-medium text-[#60432f] transition hover:bg-[#f7efe4]"
            >
              Today
            </button>

            <button
              type="button"
              onClick={onNext}
              aria-label="Next calendar period"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6c6b1] text-lg text-[#60432f] transition hover:bg-[#f7efe4]"
            >
              ›
            </button>
          </div>

          <p className="font-serif text-xl text-[#4f3728]">
            {formatCursorLabel(
              view,
              cursor,
            )}
          </p>

          <div className="flex rounded-full bg-[#f2e8dc] p-1">
            {(
              [
                "month",
                "week",
                "agenda",
              ] as CircleCalendarView[]
            ).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onViewChange(option)
                }
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                  view === option
                    ? "bg-white text-[#60432f] shadow-sm"
                    : "text-[#806b59] hover:text-[#60432f]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-[20px] bg-[#f7efe4] p-6 text-center text-[#756151]">
            Loading the Circle
            calendar…
          </div>
        ) : null}

        {!loading &&
        view === "month" ? (
          <div className="mt-5 overflow-hidden rounded-[20px] border border-[#dfd2c1]">
            <div className="grid grid-cols-7 border-b border-[#dfd2c1] bg-[#f7efe4]">
              {WEEKDAY_LABELS.map(
                (label) => (
                  <div
                    key={label}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#8b745d]"
                  >
                    {label}
                  </div>
                ),
              )}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map(
                (date) => {
                  const key =
                    toDateKey(date);

                  const dayEvents =
                    eventsByDate[
                      key
                    ] ?? [];

                  const inMonth =
                    date.getMonth() ===
                    cursor.getMonth();

                  const isSelected =
                    key === selectedDate;

                  const isToday =
                    key === todayKey;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        onSelectDate(
                          date,
                        )
                      }
                      className={`min-h-24 border-b border-r border-[#ebe1d5] p-2 text-left align-top transition sm:min-h-32 ${
                        isSelected
                          ? "bg-[#f4e8d9]"
                          : "bg-white hover:bg-[#fbf7f1]"
                      }`}
                    >
                      <span
                        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm ${
                          isToday
                            ? "bg-[#60432f] text-white"
                            : inMonth
                              ? "text-[#49392d]"
                              : "text-[#b8a999]"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      <div className="mt-2 space-y-1">
                        {dayEvents
                          .slice(0, 3)
                          .map(
                            (
                              event,
                            ) => (
                              <div
                                key={
                                  event.id
                                }
                                className="truncate rounded-lg bg-[#efe3d4] px-2 py-1 text-xs text-[#60432f]"
                              >
                                {
                                  event.title
                                }
                              </div>
                            ),
                          )}

                        {dayEvents.length >
                        3 ? (
                          <p className="px-1 text-xs text-[#8b745d]">
                            +
                            {dayEvents.length -
                              3}{" "}
                            more
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        ) : null}

        {!loading &&
        view === "week" ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-7">
            {weekDays.map((date) => {
              const key =
                toDateKey(date);

              const dayEvents =
                eventsByDate[key] ??
                [];

              const isSelected =
                key === selectedDate;

              return (
                <section
                  key={key}
                  className={`rounded-[20px] border p-3 ${
                    isSelected
                      ? "border-[#9b775b] bg-[#f7efe4]"
                      : "border-[#dfd2c1] bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onSelectDate(date)
                    }
                    className="w-full text-left"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b745d]">
                      {
                        WEEKDAY_LABELS[
                          weekDays.indexOf(
                            date,
                          )
                        ]
                      }
                    </p>

                    <p className="mt-1 font-serif text-2xl text-[#4f3728]">
                      {date.getDate()}
                    </p>
                  </button>

                  <div className="mt-3 space-y-2">
                    {dayEvents.length ===
                    0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          onStartNewEvent(
                            date,
                          )
                        }
                        className="w-full rounded-xl border border-dashed border-[#cdbba4] px-2 py-3 text-xs text-[#8b745d]"
                      >
                        Add item
                      </button>
                    ) : (
                      dayEvents.map(
                        (event) => (
                          <button
                            key={
                              event.id
                            }
                            type="button"
                            onClick={() =>
                              onSelectEvent(
                                event,
                              )
                            }
                            className="w-full rounded-xl bg-[#efe3d4] p-2 text-left transition hover:bg-[#e6d5c2]"
                          >
                            <p className="truncate text-sm font-medium text-[#60432f]">
                              {
                                event.title
                              }
                            </p>

                            <p className="mt-1 text-xs text-[#806b59]">
                              {formatEventTime(
                                event,
                              )}
                            </p>
                          </button>
                        ),
                      )
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}

        {!loading &&
        view === "agenda" ? (
          <div className="mt-5 space-y-3">
            {upcomingEvents.length ===
            0 ? (
              <div className="rounded-[20px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-6 text-center text-[#756151]">
                No upcoming schedule
                items.
              </div>
            ) : (
              upcomingEvents.map(
                (event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() =>
                      onSelectEvent(
                        event,
                      )
                    }
                    className="flex w-full flex-col gap-3 rounded-[20px] border border-[#dfd2c1] bg-white p-4 text-left transition hover:bg-[#fbf7f1] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8b745d]">
                        {formatEventDate(
                          event.start_at,
                        )}
                      </p>

                      <p className="mt-2 font-serif text-xl text-[#4f3728]">
                        {event.title}
                      </p>

                      <p className="mt-1 text-sm text-[#756151]">
                        {formatEventTime(
                          event,
                        )}

                        {event.location
                          ? ` · ${event.location}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#f2e8dc] px-3 py-1 text-xs font-medium text-[#60432f]">
                        {
                          EVENT_TYPE_LABELS[
                            event
                              .event_type
                          ]
                        }
                      </span>

                      <span className="rounded-full border border-[#d6c6b1] px-3 py-1 text-xs text-[#756151]">
                        {
                          EVENT_STATUS_LABELS[
                            event
                              .event_status
                          ]
                        }
                      </span>
                    </div>
                  </button>
                ),
              )
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[24px] border border-[#dfd2c1] bg-[#f7efe4] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b745d]">
                Selected day
              </p>

              <h2 className="mt-2 font-serif text-2xl text-[#4f3728]">
                {selectedDate}
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                onStartNewEvent(
                  selectedDate,
                )
              }
              className="rounded-full border border-[#b99f84] bg-white px-4 py-2 text-sm font-medium text-[#60432f]"
            >
              Add
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {selectedDateEvents.length ===
            0 ? (
              <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-white p-5 text-[#756151]">
                Nothing is scheduled
                for this day.
              </div>
            ) : (
              selectedDateEvents.map(
                (event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() =>
                      onSelectEvent(
                        event,
                      )
                    }
                    className={`w-full rounded-[18px] border p-4 text-left transition ${
                      event.id ===
                      selectedEventId
                        ? "border-[#8e6a4f] bg-white shadow-sm"
                        : "border-[#dfd2c1] bg-white hover:border-[#b99f84]"
                    }`}
                  >
                    <p className="font-medium text-[#4f3728]">
                      {event.title}
                    </p>

                    <p className="mt-1 text-sm text-[#756151]">
                      {formatEventTime(
                        event,
                      )}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#efe3d4] px-3 py-1 text-xs text-[#60432f]">
                        {
                          EVENT_TYPE_LABELS[
                            event
                              .event_type
                          ]
                        }
                      </span>

                      <span className="rounded-full border border-[#d6c6b1] px-3 py-1 text-xs text-[#756151]">
                        {
                          EVENT_STATUS_LABELS[
                            event
                              .event_status
                          ]
                        }
                      </span>
                    </div>
                  </button>
                ),
              )
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dfd2c1] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b745d]">
                Schedule planner
              </p>

              <h2 className="mt-2 font-serif text-2xl text-[#4f3728]">
                {selectedEvent
                  ? "Edit schedule item"
                  : "New schedule item"}
              </h2>
            </div>

            {selectedEvent ? (
              <button
                type="button"
                onClick={() =>
                  onStartNewEvent(
                    selectedDate,
                  )
                }
                className="rounded-full border border-[#d6c6b1] px-4 py-2 text-sm text-[#60432f]"
              >
                Start new
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                Title
              </span>

              <input
                value={form.title}
                onChange={(event) =>
                  onFormFieldChange(
                    "title",
                    event.target.value,
                  )
                }
                placeholder="What is happening?"
                className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                Type
              </span>

              <select
                value={
                  form.eventType
                }
                onChange={(event) =>
                  onFormFieldChange(
                    "eventType",
                    event.target
                      .value as SecureCircleScheduleEventType,
                  )
                }
                className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              >
                {Object.entries(
                  EVENT_TYPE_LABELS,
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="flex items-end gap-3 rounded-2xl border border-[#d6c6b1] px-4 py-3">
              <input
                type="checkbox"
                checked={
                  form.allDay
                }
                onChange={(event) =>
                  onFormFieldChange(
                    "allDay",
                    event.target
                      .checked,
                  )
                }
                className="h-5 w-5"
              />

              <span className="font-medium text-[#6f5947]">
                All-day item
              </span>
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                Start
              </span>

              <input
                type="datetime-local"
                value={
                  form.startAt
                }
                onChange={(event) =>
                  onFormFieldChange(
                    "startAt",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                End
              </span>

              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(event) =>
                  onFormFieldChange(
                    "endAt",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                Location
              </span>

              <input
                value={
                  form.location
                }
                onChange={(event) =>
                  onFormFieldChange(
                    "location",
                    event.target.value,
                  )
                }
                placeholder="Address or place"
                className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                Timezone
              </span>

              <input
                value={
                  form.timezone
                }
                onChange={(event) =>
                  onFormFieldChange(
                    "timezone",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                Repeats
              </span>

              <select
                value={
                  form.recurrenceRule
                }
                onChange={(event) =>
                  onFormFieldChange(
                    "recurrenceRule",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              >
                <option value="">
                  Does not repeat
                </option>

                <option value="FREQ=DAILY">
                  Daily
                </option>

                <option value="FREQ=WEEKLY">
                  Weekly
                </option>

                <option value="FREQ=MONTHLY">
                  Monthly
                </option>

                <option value="FREQ=YEARLY">
                  Yearly
                </option>
              </select>
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                Repeat until
              </span>

              <input
                type="datetime-local"
                value={
                  form.recurrenceEndAt
                }
                disabled={
                  !form.recurrenceRule
                }
                onChange={(event) =>
                  onFormFieldChange(
                    "recurrenceEndAt",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none disabled:bg-[#f4eee7] focus:border-[#71523b]"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                Reminders in minutes
              </span>

              <input
                value={
                  form.reminderMinutes
                }
                onChange={(event) =>
                  onFormFieldChange(
                    "reminderMinutes",
                    event.target.value,
                  )
                }
                placeholder="60, 1440"
                className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              />

              <span className="mt-1 block text-xs text-[#8b745d]">
                Separate multiple
                reminders with commas.
                For example: 60, 1440.
              </span>
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                Notes
              </span>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  onFormFieldChange(
                    "notes",
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Preparation, accessibility, transport or support notes"
                className="w-full resize-y rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={onSaveEvent}
            disabled={Boolean(
              workingId,
            )}
            className="mt-4 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? "Saving…"
              : selectedEvent
                ? "Save changes"
                : "Add to calendar"}
          </button>

          {message ? (
            <p className="mt-3 rounded-2xl bg-[#f7efe4] px-4 py-3 text-sm text-[#6f5947]">
              {message}
            </p>
          ) : null}

          {selectedEvent ? (
            <div className="mt-6 border-t border-[#e7ddd2] pt-5">
              <p className="text-sm font-semibold text-[#60432f]">
                Status
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    "planned",
                    "confirmed",
                    "completed",
                    "cancelled",
                  ] as SecureCircleScheduleEventStatus[]
                ).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      onSetEventStatus(
                        selectedEvent.id,
                        status,
                      )
                    }
                    disabled={Boolean(
                      workingId,
                    )}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedEvent.event_status ===
                      status
                        ? "bg-[#60432f] text-white"
                        : "border border-[#d6c6b1] text-[#60432f]"
                    }`}
                  >
                    {
                      EVENT_STATUS_LABELS[
                        status
                      ]
                    }
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-[#60432f]">
                  Assigned Circle
                  members
                </p>

                <div className="mt-3 space-y-2">
                  {selectedAssignments.length ===
                  0 ? (
                    <p className="rounded-2xl bg-[#f7efe4] px-4 py-3 text-sm text-[#756151]">
                      Nobody has been
                      assigned yet.
                    </p>
                  ) : (
                    selectedAssignments.map(
                      (assignment) => {
                        const member =
                          memberById[
                            assignment
                              .circle_member_id
                          ];

                        return (
                          <div
                            key={
                              assignment.id
                            }
                            className="rounded-2xl border border-[#dfd2c1] p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-[#4f3728]">
                                  {member
                                    ? memberLabel(
                                        member,
                                      )
                                    : "Circle member"}
                                </p>

                                <p className="mt-1 text-xs capitalize text-[#806b59]">
                                  {assignment.assignment_role.replaceAll(
                                    "_",
                                    " ",
                                  )}{" "}
                                  ·{" "}
                                  {assignment.response_status}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {(
                                  [
                                    "accepted",
                                    "tentative",
                                    "declined",
                                  ] as SecureCircleScheduleResponseStatus[]
                                ).map(
                                  (
                                    response,
                                  ) => (
                                    <button
                                      key={
                                        response
                                      }
                                      type="button"
                                      onClick={() =>
                                        onRespondToAssignment(
                                          assignment.id,
                                          response,
                                        )
                                      }
                                      disabled={Boolean(
                                        workingId,
                                      )}
                                      className={`rounded-full px-3 py-1 text-xs capitalize ${
                                        assignment.response_status ===
                                        response
                                          ? "bg-[#60432f] text-white"
                                          : "border border-[#d6c6b1] text-[#60432f]"
                                      }`}
                                    >
                                      {
                                        response
                                      }
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )
                  )}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_0.7fr_auto]">
                  <select
                    value={
                      assignmentMemberId
                    }
                    onChange={(event) =>
                      setAssignmentMemberId(
                        event.target
                          .value,
                      )
                    }
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  >
                    <option value="">
                      Choose member
                    </option>

                    {activeMembers.map(
                      (member) => (
                        <option
                          key={member.id}
                          value={
                            member.id
                          }
                        >
                          {memberLabel(
                            member,
                          )}
                        </option>
                      ),
                    )}
                  </select>

                  <select
                    value={
                      assignmentRole
                    }
                    onChange={(event) =>
                      setAssignmentRole(
                        event.target
                          .value as SecureCircleScheduleAssignmentRole,
                      )
                    }
                    className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                  >
                    <option value="lead">
                      Lead
                    </option>

                    <option value="attendee">
                      Attendee
                    </option>

                    <option value="support">
                      Support
                    </option>

                    <option value="transport">
                      Transport
                    </option>

                    <option value="other">
                      Other
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={
                      assignSelectedMember
                    }
                    disabled={
                      !assignmentMemberId ||
                      Boolean(workingId)
                    }
                    className="rounded-full bg-[#8e6a4f] px-5 py-3 font-medium text-white disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onArchiveEvent(
                    selectedEvent.id,
                  )
                }
                disabled={Boolean(
                  workingId,
                )}
                className="mt-6 text-sm font-medium text-[#9b5c4b]"
              >
                Archive this schedule
                item
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}