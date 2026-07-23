"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  archiveSecureCircleScheduleEvent,
  createSecureCircleScheduleAssignment,
  createSecureCircleScheduleEvent,
  readSecureCircleCalendar,
  updateSecureCircleScheduleAssignment,
  updateSecureCircleScheduleEvent,
  type SecureCircleCalendar,
  type SecureCircleScheduleAssignment,
  type SecureCircleScheduleAssignmentRole,
  type SecureCircleScheduleEvent,
  type SecureCircleScheduleEventStatus,
  type SecureCircleScheduleEventType,
  type SecureCircleScheduleResponseStatus,
} from "@/lib/circle/secure-circle-calendar-client";

export type CircleCalendarView =
  | "month"
  | "week"
  | "agenda";

type UseCircleCalendarOptions = {
  circleId: string;
  participantId: string;
  enabled?: boolean;
  defaultTimezone?: string;
};

type CircleCalendarRange = {
  start: Date;
  end: Date;
};

type CircleCalendarEventForm = {
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

function describeError(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

function startOfDay(
  value: Date,
): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(
  value: Date,
): Date {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDays(
  value: Date,
  amount: number,
): Date {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function addMonths(
  value: Date,
  amount: number,
): Date {
  const date = new Date(value);
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return date;
}

function startOfWeek(
  value: Date,
): Date {
  const date = startOfDay(value);
  const day = date.getDay();
  const daysSinceMonday =
    day === 0 ? 6 : day - 1;

  return addDays(
    date,
    -daysSinceMonday,
  );
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

function toLocalDateTimeInput(
  value: Date,
): string {
  const local = new Date(
    value.getTime() -
      value.getTimezoneOffset() *
        60_000,
  );

  return local
    .toISOString()
    .slice(0, 16);
}

function toDateKey(
  value: Date | string,
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseReminderMinutes(
  value: string,
): number[] {
  const reminders = value
    .split(",")
    .map((item) =>
      Number(item.trim()),
    )
    .filter(
      (item) =>
        Number.isInteger(item) &&
        item >= 0 &&
        item <= 525600,
    )
    .filter(
      (item, index, allItems) =>
        allItems.indexOf(item) ===
        index,
    )
    .sort((left, right) =>
      left - right,
    );

  return reminders.length > 0
    ? reminders
    : [60];
}

function createInitialForm(
  timezone: string,
): CircleCalendarEventForm {
  const start = new Date();
  start.setSeconds(0, 0);

  const minutes =
    start.getMinutes();

  start.setMinutes(
    minutes < 30 ? 30 : 60,
  );

  const end = new Date(
    start.getTime() + 60 * 60_000,
  );

  return {
    title: "",
    eventType: "activity",
    startAt:
      toLocalDateTimeInput(start),
    endAt:
      toLocalDateTimeInput(end),
    allDay: false,
    timezone,
    location: "",
    notes: "",
    recurrenceRule: "",
    recurrenceEndAt: "",
    reminderMinutes: "60",
  };
}

function getRange(
  view: CircleCalendarView,
  cursor: Date,
): CircleCalendarRange {
  if (view === "week") {
    const start =
      startOfWeek(cursor);

    return {
      start,
      end: endOfDay(
        addDays(start, 6),
      ),
    };
  }

  if (view === "agenda") {
    const start =
      startOfDay(cursor);

    return {
      start,
      end: endOfDay(
        addDays(start, 89),
      ),
    };
  }

  const start =
    startOfMonthGrid(cursor);

  return {
    start,
    end: endOfDay(
      addDays(start, 41),
    ),
  };
}

export default function useCircleCalendar({
  circleId,
  participantId,
  enabled = true,
  defaultTimezone =
    "Australia/Sydney",
}: UseCircleCalendarOptions) {
  const [view, setView] =
    useState<CircleCalendarView>(
      "month",
    );

  const [cursor, setCursor] =
    useState(() => new Date());

  const [selectedDate, setSelectedDate] =
    useState(() =>
      toDateKey(new Date()),
    );

  const [calendar, setCalendar] =
    useState<SecureCircleCalendar>({
      events: [],
      assignments: [],
    });

  const [loading, setLoading] =
    useState(false);

  const [workingId, setWorkingId] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    selectedEventId,
    setSelectedEventId,
  ] = useState("");

  const [form, setForm] = useState(
    () =>
      createInitialForm(
        defaultTimezone,
      ),
  );

  const range = useMemo(
    () => getRange(view, cursor),
    [cursor, view],
  );

  const rangeStart =
    range.start.toISOString();

  const rangeEnd =
    range.end.toISOString();

  const refresh = useCallback(
    async () => {
      if (
        !enabled ||
        !circleId ||
        !participantId
      ) {
        setCalendar({
          events: [],
          assignments: [],
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        const secureCalendar =
          await readSecureCircleCalendar(
            circleId,
            rangeStart,
            rangeEnd,
          );

        setCalendar(
          secureCalendar,
        );
      } catch (error) {
        setMessage(
          describeError(
            error,
            "The Circle calendar could not be loaded.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [
      circleId,
      enabled,
      participantId,
      rangeEnd,
      rangeStart,
    ],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      timezone:
        current.timezone ||
        defaultTimezone,
    }));
  }, [defaultTimezone]);

  const events = useMemo(
    () =>
      [...calendar.events].sort(
        (left, right) =>
          new Date(
            left.start_at,
          ).getTime() -
          new Date(
            right.start_at,
          ).getTime(),
      ),
    [calendar.events],
  );

  const assignmentsByEvent =
    useMemo(() => {
      const result: Record<
        string,
        SecureCircleScheduleAssignment[]
      > = {};

      for (
        const assignment
        of calendar.assignments
      ) {
        result[
          assignment.event_id
        ] ??= [];

        result[
          assignment.event_id
        ].push(assignment);
      }

      return result;
    }, [calendar.assignments]);

  const eventsByDate = useMemo(() => {
    const result: Record<
      string,
      SecureCircleScheduleEvent[]
    > = {};

    for (const event of events) {
      const key = toDateKey(
        event.start_at,
      );

      if (!key) {
        continue;
      }

      result[key] ??= [];
      result[key].push(event);
    }

    return result;
  }, [events]);

  const selectedDateEvents =
    useMemo(
      () =>
        eventsByDate[
          selectedDate
        ] ?? [],
      [
        eventsByDate,
        selectedDate,
      ],
    );

  const selectedEvent = useMemo(
    () =>
      events.find(
        (event) =>
          event.id ===
          selectedEventId,
      ) ?? null,
    [
      events,
      selectedEventId,
    ],
  );

  const upcomingEvents = useMemo(
    () => {
      const now = Date.now();

      return events.filter(
        (event) =>
          new Date(
            event.end_at,
          ).getTime() >= now &&
          event.event_status !==
            "cancelled",
      );
    },
    [events],
  );

  const todayEvents = useMemo(
    () =>
      eventsByDate[
        toDateKey(new Date())
      ] ?? [],
    [eventsByDate],
  );

  const movePrevious =
    useCallback(() => {
      setCursor((current) => {
        if (view === "month") {
          return addMonths(
            current,
            -1,
          );
        }

        if (view === "week") {
          return addDays(
            current,
            -7,
          );
        }

        return addDays(
          current,
          -30,
        );
      });
    }, [view]);

  const moveNext =
    useCallback(() => {
      setCursor((current) => {
        if (view === "month") {
          return addMonths(
            current,
            1,
          );
        }

        if (view === "week") {
          return addDays(
            current,
            7,
          );
        }

        return addDays(
          current,
          30,
        );
      });
    }, [view]);

  const moveToday =
    useCallback(() => {
      const today = new Date();

      setCursor(today);
      setSelectedDate(
        toDateKey(today),
      );
    }, []);

  const chooseDate = useCallback(
    (date: Date | string) => {
      const key =
        toDateKey(date);

      if (!key) {
        return;
      }

      setSelectedDate(key);
      setCursor(
        date instanceof Date
          ? new Date(date)
          : new Date(
              `${key}T12:00:00`,
            ),
      );
    },
    [],
  );

  const startNewEvent =
    useCallback(
      (date?: Date | string) => {
        const nextForm =
          createInitialForm(
            defaultTimezone,
          );

        if (date) {
          const key =
            toDateKey(date);

          if (key) {
            const start =
              new Date(
                `${key}T09:00:00`,
              );

            const end =
              new Date(
                start.getTime() +
                  60 * 60_000,
              );

            nextForm.startAt =
              toLocalDateTimeInput(
                start,
              );

            nextForm.endAt =
              toLocalDateTimeInput(
                end,
              );

            setSelectedDate(key);
          }
        }

        setSelectedEventId("");
        setForm(nextForm);
        setMessage("");
      },
      [defaultTimezone],
    );

  const editEvent = useCallback(
    (
      event:
        SecureCircleScheduleEvent,
    ) => {
      setSelectedEventId(
        event.id,
      );

      setSelectedDate(
        toDateKey(event.start_at),
      );

      setForm({
        title: event.title,
        eventType:
          event.event_type,
        startAt:
          toLocalDateTimeInput(
            new Date(
              event.start_at,
            ),
          ),
        endAt:
          toLocalDateTimeInput(
            new Date(event.end_at),
          ),
        allDay: event.all_day,
        timezone:
          event.timezone ||
          defaultTimezone,
        location: event.location,
        notes: event.notes,
        recurrenceRule:
          event.recurrence_rule,
        recurrenceEndAt:
          event.recurrence_end_at
            ? toLocalDateTimeInput(
                new Date(
                  event.recurrence_end_at,
                ),
              )
            : "",
        reminderMinutes:
          event.reminder_minutes.join(
            ", ",
          ),
      });

      setMessage("");
    },
    [defaultTimezone],
  );

  const setFormField = useCallback(
    <
      Key extends
        keyof CircleCalendarEventForm,
    >(
      key: Key,
      value:
        CircleCalendarEventForm[Key],
    ) => {
      setForm((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const saveEvent =
    useCallback(async () => {
      if (
        !enabled ||
        !circleId ||
        !participantId ||
        workingId
      ) {
        return;
      }

      const title =
        form.title.trim();

      if (!title) {
        setMessage(
          "Event title is required.",
        );
        return;
      }

      const start =
        new Date(form.startAt);

      const end =
        new Date(form.endAt);

      if (
        Number.isNaN(
          start.getTime(),
        ) ||
        Number.isNaN(
          end.getTime(),
        )
      ) {
        setMessage(
          "Enter a valid start and end time.",
        );
        return;
      }

      if (
        end.getTime() <=
        start.getTime()
      ) {
        setMessage(
          "The calendar event must end after it starts.",
        );
        return;
      }

      const workId =
        selectedEventId ||
        "new";

      setWorkingId(workId);
      setMessage("");

      try {
        const reminderMinutes =
          parseReminderMinutes(
            form.reminderMinutes,
          );

        if (selectedEventId) {
          const updatedEvent =
            await updateSecureCircleScheduleEvent(
              selectedEventId,
              {
                title,
                event_type:
                  form.eventType,
                start_at:
                  start.toISOString(),
                end_at:
                  end.toISOString(),
                all_day:
                  form.allDay,
                timezone:
                  form.timezone.trim() ||
                  defaultTimezone,
                location:
                  form.location.trim(),
                notes:
                  form.notes.trim(),
                recurrence_rule:
                  form.recurrenceRule.trim(),
                recurrence_end_at:
                  form.recurrenceEndAt
                    ? new Date(
                        form.recurrenceEndAt,
                      ).toISOString()
                    : null,
                reminder_minutes:
                  reminderMinutes,
              },
            );

          setCalendar(
            (current) => ({
              ...current,
              events:
                current.events.map(
                  (event) =>
                    event.id ===
                    updatedEvent.id
                      ? updatedEvent
                      : event,
                ),
            }),
          );

          setMessage(
            "Calendar event updated securely.",
          );
        } else {
          const createdEvent =
            await createSecureCircleScheduleEvent(
              {
                circleId,
                participantId,
                title,
                eventType:
                  form.eventType,
                startAt:
                  start.toISOString(),
                endAt:
                  end.toISOString(),
                allDay:
                  form.allDay,
                timezone:
                  form.timezone.trim() ||
                  defaultTimezone,
                location:
                  form.location.trim(),
                notes:
                  form.notes.trim(),
                recurrenceRule:
                  form.recurrenceRule.trim(),
                recurrenceEndAt:
                  form.recurrenceEndAt
                    ? new Date(
                        form.recurrenceEndAt,
                      ).toISOString()
                    : null,
                reminderMinutes,
              },
            );

          setCalendar(
            (current) => ({
              ...current,
              events: [
                ...current.events,
                createdEvent,
              ],
            }),
          );

          setSelectedEventId(
            createdEvent.id,
          );

          setMessage(
            "Calendar event saved securely.",
          );
        }
      } catch (error) {
        setMessage(
          describeError(
            error,
            "The calendar event could not be saved.",
          ),
        );
      } finally {
        setWorkingId("");
      }
    }, [
      circleId,
      defaultTimezone,
      enabled,
      form,
      participantId,
      selectedEventId,
      workingId,
    ]);

  const setEventStatus =
    useCallback(
      async (
        eventId: string,
        status:
          SecureCircleScheduleEventStatus,
      ) => {
        if (
          !eventId ||
          workingId
        ) {
          return;
        }

        setWorkingId(eventId);
        setMessage("");

        try {
          const updatedEvent =
            await updateSecureCircleScheduleEvent(
              eventId,
              {
                event_status: status,
              },
            );

          setCalendar(
            (current) => ({
              ...current,
              events:
                current.events.map(
                  (event) =>
                    event.id ===
                    updatedEvent.id
                      ? updatedEvent
                      : event,
                ),
            }),
          );

          setMessage(
            "Calendar status updated securely.",
          );
        } catch (error) {
          setMessage(
            describeError(
              error,
              "The calendar status could not be updated.",
            ),
          );
        } finally {
          setWorkingId("");
        }
      },
      [workingId],
    );

  const archiveEvent =
    useCallback(
      async (eventId: string) => {
        if (
          !eventId ||
          workingId
        ) {
          return;
        }

        setWorkingId(eventId);
        setMessage("");

        try {
          await archiveSecureCircleScheduleEvent(
            eventId,
          );

          setCalendar(
            (current) => ({
              events:
                current.events.filter(
                  (event) =>
                    event.id !==
                    eventId,
                ),

              assignments:
                current.assignments.filter(
                  (assignment) =>
                    assignment.event_id !==
                    eventId,
                ),
            }),
          );

          if (
            selectedEventId ===
            eventId
          ) {
            setSelectedEventId("");
            setForm(
              createInitialForm(
                defaultTimezone,
              ),
            );
          }

          setMessage(
            "Calendar event archived securely.",
          );
        } catch (error) {
          setMessage(
            describeError(
              error,
              "The calendar event could not be archived.",
            ),
          );
        } finally {
          setWorkingId("");
        }
      },
      [
        defaultTimezone,
        selectedEventId,
        workingId,
      ],
    );

  const assignMember =
    useCallback(
      async ({
        eventId,
        circleMemberId,
        assignmentRole =
          "attendee",
      }: {
        eventId: string;
        circleMemberId: string;
        assignmentRole?:
          SecureCircleScheduleAssignmentRole;
      }) => {
        if (
          !enabled ||
          !circleId ||
          !participantId ||
          !eventId ||
          !circleMemberId ||
          workingId
        ) {
          return;
        }

        setWorkingId(
          `assignment-${eventId}`,
        );
        setMessage("");

        try {
          const assignment =
            await createSecureCircleScheduleAssignment(
              {
                circleId,
                participantId,
                eventId,
                circleMemberId,
                assignmentRole,
              },
            );

          setCalendar(
            (current) => ({
              ...current,
              assignments: [
                ...current.assignments,
                assignment,
              ],
            }),
          );

          setMessage(
            "Circle member assigned securely.",
          );
        } catch (error) {
          setMessage(
            describeError(
              error,
              "The Circle member could not be assigned.",
            ),
          );
        } finally {
          setWorkingId("");
        }
      },
      [
        circleId,
        enabled,
        participantId,
        workingId,
      ],
    );

  const respondToAssignment =
    useCallback(
      async (
        assignmentId: string,
        responseStatus:
          SecureCircleScheduleResponseStatus,
      ) => {
        if (
          !assignmentId ||
          workingId
        ) {
          return;
        }

        setWorkingId(
          assignmentId,
        );
        setMessage("");

        try {
          const updatedAssignment =
            await updateSecureCircleScheduleAssignment(
              assignmentId,
              {
                response_status:
                  responseStatus,
              },
            );

          setCalendar(
            (current) => ({
              ...current,
              assignments:
                current.assignments.map(
                  (assignment) =>
                    assignment.id ===
                    updatedAssignment.id
                      ? updatedAssignment
                      : assignment,
                ),
            }),
          );

          setMessage(
            "Calendar response updated securely.",
          );
        } catch (error) {
          setMessage(
            describeError(
              error,
              "The calendar response could not be updated.",
            ),
          );
        } finally {
          setWorkingId("");
        }
      },
      [workingId],
    );

  return {
    view,
    setView,

    cursor,
    selectedDate,
    selectDate: chooseDate,

    range: {
      start: rangeStart,
      end: rangeEnd,
    },

    movePrevious,
    moveNext,
    moveToday,

    events,
    eventsByDate,
    selectedDateEvents,
    upcomingEvents,
    todayEvents,

    assignments:
      calendar.assignments,
    assignmentsByEvent,

    loading,
    workingId,
    message,
    refresh,

    selectedEvent,
    selectedEventId,
    selectEvent: editEvent,
    startNewEvent,

    form,
    setFormField,
    saveEvent,

    setEventStatus,
    archiveEvent,
    assignMember,
    respondToAssignment,
  };
}