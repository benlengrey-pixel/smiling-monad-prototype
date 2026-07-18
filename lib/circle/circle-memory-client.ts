export type CircleProfileMemory = {
  personName: string;
  preferredName: string;
  whatMatters: string;
  communication: string;
};

export type CircleMemberMemory = {
  id: string;
  name: string;
  role: string;
  relationship: string;
};

export type CircleGoalMemory = {
  id: string;
  title: string;
  owner: string;
  status: "Planning" | "Active" | "Complete";
};

export type CircleDocumentMemory = {
  id: string;
  title: string;
  category:
    | "Plan"
    | "Agreement"
    | "Report"
    | "Meeting"
    | "Other";
  status: "Draft" | "Current" | "Review needed";
};

export type CircleMeetingMemory = {
  id: string;
  title: string;
  date: string;
  purpose: string;
};

export type CircleResponsibilityMemory = {
  id: string;
  title: string;
  owner: string;
  status: "Open" | "In progress" | "Complete";
};

export type CircleCentreMemory = {
  profile: CircleProfileMemory;
  members: CircleMemberMemory[];
  goals: CircleGoalMemory[];
  documents: CircleDocumentMemory[];
  meetings: CircleMeetingMemory[];
  responsibilities: CircleResponsibilityMemory[];
};

const CIRCLE_STORAGE_KEY =
  "smiling-monad-circle-centre-v2";

function createEmptyCircleMemory(): CircleCentreMemory {
  return {
    profile: {
      personName: "",
      preferredName: "",
      whatMatters: "",
      communication: "",
    },
    members: [],
    goals: [],
    documents: [],
    meetings: [],
    responsibilities: [],
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function readCircleCentreMemory(): CircleCentreMemory {
  if (typeof window === "undefined") {
    return createEmptyCircleMemory();
  }

  try {
    const storedValue =
      window.localStorage.getItem(
        CIRCLE_STORAGE_KEY,
      );

    if (!storedValue) {
      return createEmptyCircleMemory();
    }

    const parsedValue =
      JSON.parse(storedValue) as unknown;

    if (!isRecord(parsedValue)) {
      return createEmptyCircleMemory();
    }

    const profileValue = isRecord(
      parsedValue.profile,
    )
      ? parsedValue.profile
      : {};

    return {
      profile: {
        personName:
          typeof profileValue.personName ===
          "string"
            ? profileValue.personName
            : "",
        preferredName:
          typeof profileValue.preferredName ===
          "string"
            ? profileValue.preferredName
            : "",
        whatMatters:
          typeof profileValue.whatMatters ===
          "string"
            ? profileValue.whatMatters
            : "",
        communication:
          typeof profileValue.communication ===
          "string"
            ? profileValue.communication
            : "",
      },

      members: Array.isArray(
        parsedValue.members,
      )
        ? (parsedValue.members as CircleMemberMemory[])
        : [],

      goals: Array.isArray(
        parsedValue.goals,
      )
        ? (parsedValue.goals as CircleGoalMemory[])
        : [],

      documents: Array.isArray(
        parsedValue.documents,
      )
        ? (parsedValue.documents as CircleDocumentMemory[])
        : [],

      meetings: Array.isArray(
        parsedValue.meetings,
      )
        ? (parsedValue.meetings as CircleMeetingMemory[])
        : [],

      responsibilities: Array.isArray(
        parsedValue.responsibilities,
      )
        ? (parsedValue.responsibilities as CircleResponsibilityMemory[])
        : [],
    };
  } catch {
    return createEmptyCircleMemory();
  }
}

export function createCircleMemoryPrompt(
  memory: CircleCentreMemory,
): string {
  const personName =
    memory.profile.preferredName.trim() ||
    memory.profile.personName.trim() ||
    "The person";

  const sections: string[] = [
    "CIRCLE OF SUPPORT CONTEXT",
    "",
    `Person at the centre: ${personName}`,
  ];

  if (memory.profile.whatMatters.trim()) {
    sections.push(
      "",
      "What matters to the person:",
      memory.profile.whatMatters.trim(),
    );
  }

  if (memory.profile.communication.trim()) {
    sections.push(
      "",
      "Communication and decision support:",
      memory.profile.communication.trim(),
    );
  }

  if (memory.members.length > 0) {
    sections.push(
      "",
      "Circle members:",
      ...memory.members.map(
        (member) =>
          `- ${member.name}: ${member.role}; ${member.relationship}`,
      ),
    );
  }

  if (memory.goals.length > 0) {
    sections.push(
      "",
      "Goals and projects:",
      ...memory.goals.map(
        (goal) =>
          `- ${goal.title}; lead: ${goal.owner}; status: ${goal.status}`,
      ),
    );
  }

  if (memory.documents.length > 0) {
    sections.push(
      "",
      "Shared documents:",
      ...memory.documents.map(
        (document) =>
          `- ${document.title}; category: ${document.category}; status: ${document.status}`,
      ),
    );
  }

  if (memory.meetings.length > 0) {
    sections.push(
      "",
      "Meetings:",
      ...memory.meetings.map(
        (meeting) =>
          `- ${meeting.title}; date: ${
            meeting.date || "not set"
          }; purpose: ${meeting.purpose}`,
      ),
    );
  }

  if (memory.responsibilities.length > 0) {
    sections.push(
      "",
      "Responsibilities:",
      ...memory.responsibilities.map(
        (responsibility) =>
          `- ${responsibility.title}; owner: ${responsibility.owner}; status: ${responsibility.status}`,
      ),
    );
  }

  sections.push(
    "",
    "GUIDANCE FOR KIMI",
    "Use this information only when relevant to the current request.",
    "Keep the person at the centre of decisions.",
    "Support informed choice, consent and clear communication.",
    "Do not treat stored information as permission to make decisions for the person.",
    "Do not invent missing facts.",
    "Ask a focused question when important information is missing.",
    "Help the circle prepare, organise, communicate and follow through without taking control.",
  );

  return sections.join("\n");
}