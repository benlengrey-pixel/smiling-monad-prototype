import type {
  SecureCircleScheduleEvent,
} from "@/lib/circle/secure-circle-calendar-client";

export type CircleCalendarOccurrence =
  SecureCircleScheduleEvent & {
    occurrence_id: string;
    source_event_id: string;
    occurrence_start_at: string;
    occurrence_end_at: string;
    is_recurring_occurrence: boolean;
  };

type ExpandCircleCalendarEventsOptions = {
  rangeStart: string;
  rangeEnd: string;
  maximumOccurrences?: number;
};

type ParsedRecurrenceRule = {
  frequency:
    | "DAILY"
    | "WEEKLY"
    | "MONTHLY"
    | "YEARLY";
  interval: number;
};

function parseDate(
  value: string,
  label: string,
): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${label} is not a valid date and time.`,
    );
  }

  return date;
}

function parseRecurrenceRule(
  value: string,
): ParsedRecurrenceRule | null {
  const clean = value.trim();

  if (!clean) {
    return null;
  }

  const parts = Object.fromEntries(
    clean
      .split(";")
      .map((part) => {
        const [key, rawValue] =
          part.split("=");

        return [
          key?.trim().toUpperCase(),
          rawValue?.trim().toUpperCase(),
        ];
      })
      .filter(
        ([key, rawValue]) =>
          Boolean(key) &&
          Boolean(rawValue),
      ),
  );

  const frequency =
    parts.FREQ;

  if (
    frequency !== "DAILY" &&
    frequency !== "WEEKLY" &&
    frequency !== "MONTHLY" &&
    frequency !== "YEARLY"
  ) {
    return null;
  }

  const parsedInterval =
    Number(parts.INTERVAL ?? "1");

  const interval =
    Number.isInteger(parsedInterval) &&
    parsedInterval > 0
      ? parsedInterval
      : 1;

  return {
    frequency,
    interval,
  };
}

function addRecurrenceInterval(
  value: Date,
  rule: ParsedRecurrenceRule,
): Date {
  const next = new Date(value);

  if (rule.frequency === "DAILY") {
    next.setDate(
      next.getDate() +
        rule.interval,
    );

    return next;
  }

  if (rule.frequency === "WEEKLY") {
    next.setDate(
      next.getDate() +
        7 * rule.interval,
    );

    return next;
  }

  if (rule.frequency === "MONTHLY") {
    const originalDay =
      next.getDate();

    next.setDate(1);
    next.setMonth(
      next.getMonth() +
        rule.interval,
    );

    const lastDayOfMonth =
      new Date(
        next.getFullYear(),
        next.getMonth() + 1,
        0,
      ).getDate();

    next.setDate(
      Math.min(
        originalDay,
        lastDayOfMonth,
      ),
    );

    return next;
  }

  const originalMonth =
    next.getMonth();

  next.setFullYear(
    next.getFullYear() +
      rule.interval,
  );

  if (
    next.getMonth() !==
    originalMonth
  ) {
    next.setDate(0);
  }

  return next;
}

function overlapsRange(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  return (
    start.getTime() <
      rangeEnd.getTime() &&
    end.getTime() >
      rangeStart.getTime()
  );
}

function createOccurrence(
  event:
    SecureCircleScheduleEvent,
  occurrenceStart: Date,
  occurrenceEnd: Date,
  isRecurringOccurrence: boolean,
): CircleCalendarOccurrence {
  const occurrenceStartAt =
    occurrenceStart.toISOString();

  const occurrenceEndAt =
    occurrenceEnd.toISOString();

  const occurrenceId =
    isRecurringOccurrence
      ? `${event.id}::${occurrenceStartAt}`
      : event.id;

  return {
    ...event,
    id: occurrenceId,
    start_at: occurrenceStartAt,
    end_at: occurrenceEndAt,
    occurrence_id: occurrenceId,
    source_event_id: event.id,
    occurrence_start_at:
      occurrenceStartAt,
    occurrence_end_at:
      occurrenceEndAt,
    is_recurring_occurrence:
      isRecurringOccurrence,
  };
}

function expandRecurringEvent(
  event:
    SecureCircleScheduleEvent,
  rangeStart: Date,
  rangeEnd: Date,
  maximumOccurrences: number,
): CircleCalendarOccurrence[] {
  const rule =
    parseRecurrenceRule(
      event.recurrence_rule,
    );

  if (!rule) {
    const start =
      parseDate(
        event.start_at,
        "Event start",
      );

    const end =
      parseDate(
        event.end_at,
        "Event end",
      );

    return overlapsRange(
      start,
      end,
      rangeStart,
      rangeEnd,
    )
      ? [
          createOccurrence(
            event,
            start,
            end,
            false,
          ),
        ]
      : [];
  }

  const seriesStart =
    parseDate(
      event.start_at,
      "Event start",
    );

  const seriesEnd =
    parseDate(
      event.end_at,
      "Event end",
    );

  const duration =
    seriesEnd.getTime() -
    seriesStart.getTime();

  if (duration <= 0) {
    return [];
  }

  const recurrenceEnd =
    event.recurrence_end_at
      ? parseDate(
          event.recurrence_end_at,
          "Recurrence end",
        )
      : rangeEnd;

  const finalOccurrenceStart =
    recurrenceEnd.getTime() <
    rangeEnd.getTime()
      ? recurrenceEnd
      : rangeEnd;

  const occurrences:
    CircleCalendarOccurrence[] = [];

  let occurrenceStart =
    new Date(seriesStart);

  let safetyCounter = 0;

  while (
    occurrenceStart.getTime() <=
      finalOccurrenceStart.getTime() &&
    occurrences.length <
      maximumOccurrences &&
    safetyCounter <
      maximumOccurrences * 4
  ) {
    const occurrenceEnd =
      new Date(
        occurrenceStart.getTime() +
          duration,
      );

    if (
      overlapsRange(
        occurrenceStart,
        occurrenceEnd,
        rangeStart,
        rangeEnd,
      )
    ) {
      occurrences.push(
        createOccurrence(
          event,
          occurrenceStart,
          occurrenceEnd,
          occurrenceStart.getTime() !==
            seriesStart.getTime(),
        ),
      );
    }

    occurrenceStart =
      addRecurrenceInterval(
        occurrenceStart,
        rule,
      );

    safetyCounter += 1;
  }

  return occurrences;
}

export function expandCircleCalendarEvents(
  events:
    SecureCircleScheduleEvent[],
  {
    rangeStart,
    rangeEnd,
    maximumOccurrences = 500,
  }:
    ExpandCircleCalendarEventsOptions,
): CircleCalendarOccurrence[] {
  const start =
    parseDate(
      rangeStart,
      "Calendar range start",
    );

  const end =
    parseDate(
      rangeEnd,
      "Calendar range end",
    );

  if (
    end.getTime() <=
    start.getTime()
  ) {
    throw new Error(
      "The calendar range must end after it starts.",
    );
  }

  const safeMaximum =
    Math.max(
      1,
      Math.min(
        Math.floor(
          maximumOccurrences,
        ),
        2000,
      ),
    );

  return events
    .flatMap((event) =>
      expandRecurringEvent(
        event,
        start,
        end,
        safeMaximum,
      ),
    )
    .sort(
      (left, right) =>
        new Date(
          left.occurrence_start_at,
        ).getTime() -
        new Date(
          right.occurrence_start_at,
        ).getTime(),
    )
    .slice(0, safeMaximum);
}

export function getSourceCalendarEventId(
  event:
    Pick<
      CircleCalendarOccurrence,
      | "source_event_id"
      | "id"
    >,
): string {
  return (
    event.source_event_id ||
    event.id
  );
}