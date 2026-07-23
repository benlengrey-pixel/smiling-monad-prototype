"use client";

import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

export type SecureCircleScheduleEventType =
  | "appointment"
  | "shift"
  | "meeting"
  | "activity"
  | "deadline"
  | "transport"
  | "health"
  | "personal"
  | "other";

export type SecureCircleScheduleEventStatus =
  | "planned"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "archived";

export type SecureCircleScheduleAssignmentRole =
  | "lead"
  | "attendee"
  | "support"
  | "transport"
  | "other";

export type SecureCircleScheduleResponseStatus =
  | "pending"
  | "accepted"
  | "tentative"
  | "declined";

export type SecureCircleScheduleEvent = {
  id: string;
  circle_id: string;
  participant_id: string;
  title: string;
  event_type: SecureCircleScheduleEventType;
  start_at: string;
  end_at: string;
  all_day: boolean;
  timezone: string;
  location: string;
  notes: string;
  event_status: SecureCircleScheduleEventStatus;
  recurrence_rule: string;
  recurrence_end_at: string | null;
  reminder_minutes: number[];
  related_meeting_id: string | null;
  related_responsibility_id: string | null;
  related_document_id: string | null;
  created_by: string;
  updated_by: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SecureCircleScheduleAssignment = {
  id: string;
  circle_id: string;
  participant_id: string;
  event_id: string;
  circle_member_id: string;
  assignment_role:
    SecureCircleScheduleAssignmentRole;
  response_status:
    SecureCircleScheduleResponseStatus;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SecureCircleCalendar = {
  events: SecureCircleScheduleEvent[];
  assignments:
    SecureCircleScheduleAssignment[];
};

export type CreateSecureCircleScheduleEventInput = {
  circleId: string;
  participantId: string;
  title: string;
  eventType:
    SecureCircleScheduleEventType;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  timezone?: string;
  location?: string;
  notes?: string;
  recurrenceRule?: string;
  recurrenceEndAt?: string | null;
  reminderMinutes?: number[];
  relatedMeetingId?: string | null;
  relatedResponsibilityId?: string | null;
  relatedDocumentId?: string | null;
};

export type UpdateSecureCircleScheduleEventInput =
  Partial<
    Pick<
      SecureCircleScheduleEvent,
      | "title"
      | "event_type"
      | "start_at"
      | "end_at"
      | "all_day"
      | "timezone"
      | "location"
      | "notes"
      | "event_status"
      | "recurrence_rule"
      | "recurrence_end_at"
      | "reminder_minutes"
      | "related_meeting_id"
      | "related_responsibility_id"
      | "related_document_id"
    >
  >;

export type CreateSecureCircleScheduleAssignmentInput =
  {
    circleId: string;
    participantId: string;
    eventId: string;
    circleMemberId: string;
    assignmentRole?:
      SecureCircleScheduleAssignmentRole;
  };

function getClient(): SupabaseClient {
  return getSupabaseBrowserClient();
}

function requiredText(
  value: string,
  label: string,
): string {
  const clean = value.trim();

  if (!clean) {
    throw new Error(
      `${label} is required.`,
    );
  }

  return clean;
}

function requiredDateTime(
  value: string,
  label: string,
): string {
  const clean = requiredText(
    value,
    label,
  );

  const date = new Date(clean);

  if (
    Number.isNaN(date.getTime())
  ) {
    throw new Error(
      `${label} is not a valid date and time.`,
    );
  }

  return date.toISOString();
}

function optionalDateTime(
  value: string | null | undefined,
  label: string,
): string | null {
  if (!value?.trim()) {
    return null;
  }

  return requiredDateTime(
    value,
    label,
  );
}

function cleanReminderMinutes(
  values: number[] | undefined,
): number[] {
  const cleanValues = (
    values ?? [60]
  )
    .filter(
      (value) =>
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 525600,
    )
    .filter(
      (value, index, allValues) =>
        allValues.indexOf(value) ===
        index,
    )
    .sort((left, right) =>
      left - right,
    );

  return cleanValues.length > 0
    ? cleanValues
    : [60];
}

async function requireUser(
  supabase: SupabaseClient,
): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "Please sign in to continue.",
    );
  }

  return user;
}

function friendlyCalendarError(
  error: unknown,
  fallback: string,
): Error {
  if (error instanceof Error) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null
  ) {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const message =
      typeof candidate.message ===
        "string"
        ? candidate.message
        : "";

    const details =
      typeof candidate.details ===
        "string"
        ? candidate.details
        : "";

    const hint =
      typeof candidate.hint ===
        "string"
        ? candidate.hint
        : "";

    const lowerMessage = [
      message,
      details,
      hint,
    ]
      .join(" ")
      .toLowerCase();

    if (
      lowerMessage.includes(
        "row-level security",
      ) ||
      lowerMessage.includes(
        "permission denied",
      ) ||
      candidate.code === "42501"
    ) {
      return new Error(
        "You do not have permission to change this Circle calendar.",
      );
    }

    if (
      lowerMessage.includes(
        "end after it starts",
      ) ||
      lowerMessage.includes(
        "event_times_valid",
      )
    ) {
      return new Error(
        "The calendar event must end after it starts.",
      );
    }

    if (
      lowerMessage.includes(
        "duplicate key",
      ) ||
      lowerMessage.includes(
        "unique constraint",
      )
    ) {
      return new Error(
        "This Circle member is already assigned to the event.",
      );
    }

    const parts = [
      message,
      details,
      hint,
      candidate.code
        ? `Code: ${String(
            candidate.code,
          )}`
        : "",
    ].filter(Boolean);

    if (parts.length > 0) {
      return new Error(
        parts.join(" "),
      );
    }
  }

  return new Error(fallback);
}

export async function readSecureCircleCalendar(
  circleId: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<SecureCircleCalendar> {
  const cleanCircleId =
    requiredText(
      circleId,
      "Circle",
    );

  const cleanRangeStart =
    requiredDateTime(
      rangeStart,
      "Calendar range start",
    );

  const cleanRangeEnd =
    requiredDateTime(
      rangeEnd,
      "Calendar range end",
    );

  if (
    new Date(
      cleanRangeEnd,
    ).getTime() <=
    new Date(
      cleanRangeStart,
    ).getTime()
  ) {
    throw new Error(
      "The calendar range must end after it starts.",
    );
  }

  const supabase = getClient();

  await requireUser(supabase);

  const [
    directEventsResult,
    recurringEventsResult,
  ] = await Promise.all([
    supabase
      .from(
        "circle_schedule_events",
      )
      .select("*")
      .eq(
        "circle_id",
        cleanCircleId,
      )
      .neq(
        "event_status",
        "archived",
      )
      .lt(
        "start_at",
        cleanRangeEnd,
      )
      .gt(
        "end_at",
        cleanRangeStart,
      )
      .order("start_at", {
        ascending: true,
      }),

    supabase
      .from(
        "circle_schedule_events",
      )
      .select("*")
      .eq(
        "circle_id",
        cleanCircleId,
      )
      .neq(
        "event_status",
        "archived",
      )
      .neq(
        "recurrence_rule",
        "",
      )
      .lt(
        "start_at",
        cleanRangeEnd,
      )
      .order("start_at", {
        ascending: true,
      }),
  ]);

  if (directEventsResult.error) {
    throw friendlyCalendarError(
      directEventsResult.error,
      "The Circle calendar could not be loaded.",
    );
  }

  if (recurringEventsResult.error) {
    throw friendlyCalendarError(
      recurringEventsResult.error,
      "The recurring Circle schedule could not be loaded.",
    );
  }

  const directEvents =
    (directEventsResult.data ??
      []) as unknown as SecureCircleScheduleEvent[];

  const recurringEvents =
    (recurringEventsResult.data ??
      []) as unknown as SecureCircleScheduleEvent[];

  const rangeStartTime =
    new Date(
      cleanRangeStart,
    ).getTime();

  const events = Array.from(
    new Map(
      [
        ...directEvents,

        ...recurringEvents.filter(
          (event) =>
            !event.recurrence_end_at ||
            new Date(
              event.recurrence_end_at,
            ).getTime() >=
              rangeStartTime,
        ),
      ].map((event) => [
        event.id,
        event,
      ]),
    ).values(),
  ).sort(
    (left, right) =>
      new Date(
        left.start_at,
      ).getTime() -
      new Date(
        right.start_at,
      ).getTime(),
  );

  if (events.length === 0) {
    return {
      events: [],
      assignments: [],
    };
  }

  const eventIds = events.map(
    (event) => event.id,
  );

  const assignmentsResult =
    await supabase
      .from(
        "circle_schedule_assignments",
      )
      .select("*")
      .eq(
        "circle_id",
        cleanCircleId,
      )
      .in("event_id", eventIds)
      .order("created_at", {
        ascending: true,
      });

  if (assignmentsResult.error) {
    throw friendlyCalendarError(
      assignmentsResult.error,
      "The Circle calendar assignments could not be loaded.",
    );
  }

  return {
    events,

    assignments:
      (assignmentsResult.data ??
        []) as unknown as SecureCircleScheduleAssignment[],
  };
}

export async function createSecureCircleScheduleEvent(
  input:
    CreateSecureCircleScheduleEventInput,
): Promise<SecureCircleScheduleEvent> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const startAt =
    requiredDateTime(
      input.startAt,
      "Start",
    );

  const endAt =
    requiredDateTime(
      input.endAt,
      "End",
    );

  if (
    new Date(endAt).getTime() <=
    new Date(startAt).getTime()
  ) {
    throw new Error(
      "The calendar event must end after it starts.",
    );
  }

  const { data, error } =
    await supabase
      .from(
        "circle_schedule_events",
      )
      .insert({
        circle_id: requiredText(
          input.circleId,
          "Circle",
        ),

        participant_id:
          requiredText(
            input.participantId,
            "Participant",
          ),

        title: requiredText(
          input.title,
          "Event title",
        ),

        event_type:
          input.eventType,

        start_at: startAt,
        end_at: endAt,

        all_day:
          input.allDay === true,

        timezone:
          input.timezone?.trim() ||
          "Australia/Sydney",

        location:
          input.location?.trim() ??
          "",

        notes:
          input.notes?.trim() ?? "",

        recurrence_rule:
          input.recurrenceRule?.trim() ??
          "",

        recurrence_end_at:
          optionalDateTime(
            input.recurrenceEndAt,
            "Recurrence end",
          ),

        reminder_minutes:
          cleanReminderMinutes(
            input.reminderMinutes,
          ),

        related_meeting_id:
          input.relatedMeetingId ??
          null,

        related_responsibility_id:
          input.relatedResponsibilityId ??
          null,

        related_document_id:
          input.relatedDocumentId ??
          null,

        created_by: user.id,
        updated_by: user.id,
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyCalendarError(
      error,
      "The calendar event could not be created.",
    );
  }

  return data as unknown as SecureCircleScheduleEvent;
}

export async function updateSecureCircleScheduleEvent(
  eventId: string,
  update:
    UpdateSecureCircleScheduleEventInput,
): Promise<SecureCircleScheduleEvent> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const cleanUpdate:
    UpdateSecureCircleScheduleEventInput & {
      updated_by: string;
    } = {
    ...update,
    updated_by: user.id,
  };

  if (
    typeof update.title ===
    "string"
  ) {
    cleanUpdate.title =
      requiredText(
        update.title,
        "Event title",
      );
  }

  if (
    typeof update.start_at ===
    "string"
  ) {
    cleanUpdate.start_at =
      requiredDateTime(
        update.start_at,
        "Start",
      );
  }

  if (
    typeof update.end_at ===
    "string"
  ) {
    cleanUpdate.end_at =
      requiredDateTime(
        update.end_at,
        "End",
      );
  }

  if (
    update.recurrence_end_at !==
    undefined
  ) {
    cleanUpdate.recurrence_end_at =
      optionalDateTime(
        update.recurrence_end_at,
        "Recurrence end",
      );
  }

  if (
    update.reminder_minutes
  ) {
    cleanUpdate.reminder_minutes =
      cleanReminderMinutes(
        update.reminder_minutes,
      );
  }

  const { data, error } =
    await supabase
      .from(
        "circle_schedule_events",
      )
      .update(cleanUpdate)
      .eq(
        "id",
        requiredText(
          eventId,
          "Calendar event",
        ),
      )
      .select("*")
      .single();

  if (error) {
    throw friendlyCalendarError(
      error,
      "The calendar event could not be updated.",
    );
  }

  return data as unknown as SecureCircleScheduleEvent;
}

export async function archiveSecureCircleScheduleEvent(
  eventId: string,
): Promise<SecureCircleScheduleEvent> {
  return updateSecureCircleScheduleEvent(
    eventId,
    {
      event_status: "archived",
    },
  );
}

export async function createSecureCircleScheduleAssignment(
  input:
    CreateSecureCircleScheduleAssignmentInput,
): Promise<SecureCircleScheduleAssignment> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const { data, error } =
    await supabase
      .from(
        "circle_schedule_assignments",
      )
      .insert({
        circle_id: requiredText(
          input.circleId,
          "Circle",
        ),

        participant_id:
          requiredText(
            input.participantId,
            "Participant",
          ),

        event_id: requiredText(
          input.eventId,
          "Calendar event",
        ),

        circle_member_id:
          requiredText(
            input.circleMemberId,
            "Circle member",
          ),

        assignment_role:
          input.assignmentRole ??
          "attendee",

        response_status:
          "pending",

        created_by: user.id,
        updated_by: user.id,
      })
      .select("*")
      .single();

  if (error) {
    throw friendlyCalendarError(
      error,
      "The Circle member could not be assigned to this event.",
    );
  }

  return data as unknown as SecureCircleScheduleAssignment;
}

export async function updateSecureCircleScheduleAssignment(
  assignmentId: string,
  update: Partial<
    Pick<
      SecureCircleScheduleAssignment,
      | "assignment_role"
      | "response_status"
    >
  >,
): Promise<SecureCircleScheduleAssignment> {
  const supabase = getClient();
  const user = await requireUser(
    supabase,
  );

  const { data, error } =
    await supabase
      .from(
        "circle_schedule_assignments",
      )
      .update({
        ...update,
        updated_by: user.id,
      })
      .eq(
        "id",
        requiredText(
          assignmentId,
          "Calendar assignment",
        ),
      )
      .select("*")
      .single();

  if (error) {
    throw friendlyCalendarError(
      error,
      "The calendar assignment could not be updated.",
    );
  }

  return data as unknown as SecureCircleScheduleAssignment;
}