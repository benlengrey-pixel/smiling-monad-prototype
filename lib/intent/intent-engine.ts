export type IntentDestination = "office" | "workspace";

export type IntentKind =
  | "conversation"
  | "document"
  | "report"
  | "correspondence"
  | "planning"
  | "research"
  | "files"
  | "meeting"
  | "wellbeing"
  | "reminder"
  | "calendar"
  | "general";

export type IntentTool =
  | "companion"
  | "document"
  | "attachments"
  | "notes"
  | "checklist"
  | "calendar"
  | "meeting"
  | "timer"
  | "breathing"
  | "audio"
  | "research";

export type SmilingMonadIntent = {
  id: string;
  originalRequest: string;
  destination: IntentDestination;
  kind: IntentKind;
  title: string;
  tools: IntentTool[];
  shouldStartAutomatically: boolean;
  createdAt: string;
};

function includesAny(
  text: string,
  terms: string[]
): boolean {
  return terms.some((term) =>
    text.includes(term)
  );
}

function uniqueTools(
  tools: IntentTool[]
): IntentTool[] {
  return Array.from(new Set(tools));
}

function createTitle(
  request: string,
  kind: IntentKind
): string {
  const trimmedRequest = request.trim();

  if (trimmedRequest.length <= 64) {
    return trimmedRequest;
  }

  switch (kind) {
    case "report":
      return "Working report";
    case "document":
      return "Working document";
    case "correspondence":
      return "Correspondence";
    case "planning":
      return "Planning task";
    case "research":
      return "Research task";
    case "files":
      return "File review";
    case "meeting":
      return "Meeting workspace";
    case "wellbeing":
      return "Wellbeing session";
    case "reminder":
      return "Reminder";
    case "calendar":
      return "Calendar task";
    case "conversation":
    case "general":
      return "Conversation";
  }
}

function classifyIntent(
  request: string
): {
  destination: IntentDestination;
  kind: IntentKind;
  tools: IntentTool[];
} {
  const text = request
    .trim()
    .toLowerCase();

  /*
   * Work requests are checked before greetings.
   * This prevents a request such as
   * "Hi Kimi, help me write a shift report"
   * from being treated as ordinary conversation.
   */

  const isReport = includesAny(text, [
    "shift report",
    "shift notes",
    "progress report",
    "incident report",
    "support report",
    "case report",
    "daily report",
    "weekly report",
    "write a report",
    "write report",
    "prepare a report",
    "prepare report",
    "complete a report",
    "complete report",
    "do a report",
    "finish a report",
    "today's report",
    "todays report",
    "yesterday's report",
    "yesterdays report",
    "yesterday report",
  ]);

  if (isReport) {
    return {
      destination: "workspace",
      kind: "report",
      tools: [
        "document",
        "companion",
      ],
    };
  }

  const isCorrespondence = includesAny(
    text,
    [
      "write an email",
      "draft an email",
      "send an email",
      "write a letter",
      "draft a letter",
      "write a message",
      "reply to",
      "respond to",
      "correspondence",
    ]
  );

  if (isCorrespondence) {
    return {
      destination: "workspace",
      kind: "correspondence",
      tools: [
        "document",
        "companion",
      ],
    };
  }

  const isMeeting = includesAny(text, [
    "meeting",
    "zoom",
    "teams meeting",
    "google meet",
    "video call",
    "agenda",
    "meeting notes",
    "meeting minutes",
  ]);

  if (isMeeting) {
    return {
      destination: "workspace",
      kind: "meeting",
      tools: [
        "meeting",
        "notes",
        "companion",
      ],
    };
  }

  const isWellbeing = includesAny(text, [
    "meditation",
    "meditate",
    "breathing",
    "breathe",
    "calm down",
    "grounding",
    "ground me",
    "relax",
    "anxiety",
    "anxious",
    "yoga",
    "stretch",
    "sleep",
    "hourglass",
    "timer",
    "music",
    "listen to music",
    "nature sounds",
    "play sounds",
  ]);

  if (isWellbeing) {
    const tools: IntentTool[] = [
      "companion",
    ];

    if (
      includesAny(text, [
        "breathing",
        "breathe",
        "anxiety",
        "anxious",
        "grounding",
        "ground me",
      ])
    ) {
      tools.push(
        "breathing",
        "timer"
      );
    }

    if (
      includesAny(text, [
        "meditation",
        "meditate",
        "relax",
        "sleep",
        "music",
        "nature sounds",
        "play sounds",
      ])
    ) {
      tools.push(
        "timer",
        "audio"
      );
    }

    if (
      includesAny(text, [
        "yoga",
        "stretch",
      ])
    ) {
      tools.push("timer");
    }

    return {
      destination: "workspace",
      kind: "wellbeing",
      tools: uniqueTools(tools),
    };
  }

  const isFileTask = includesAny(text, [
    "upload file",
    "upload files",
    "open file",
    "open files",
    "review file",
    "review files",
    "photo",
    "photos",
    "image",
    "images",
    "pdf",
    "attachment",
    "spreadsheet",
    "word document",
  ]);

  if (isFileTask) {
    return {
      destination: "workspace",
      kind: "files",
      tools: [
        "attachments",
        "companion",
      ],
    };
  }

  const isResearch = includesAny(text, [
    "research",
    "find out",
    "look up",
    "compare",
    "investigate",
    "analyse",
    "analyze",
    "review this",
    "search for",
    "website",
  ]);

  if (isResearch) {
    return {
      destination: "workspace",
      kind: "research",
      tools: [
        "research",
        "notes",
        "companion",
      ],
    };
  }

  const isPlanning = includesAny(text, [
    "help me plan",
    "make a plan",
    "create a plan",
    "planning",
    "plan my",
    "plan the",
    "steps",
    "checklist",
    "action items",
    "to do",
    "todo",
    "organise",
    "organize",
  ]);

  if (isPlanning) {
    return {
      destination: "workspace",
      kind: "planning",
      tools: [
        "checklist",
        "notes",
        "companion",
      ],
    };
  }

  const isDocument = includesAny(text, [
    "service agreement",
    "create a document",
    "make a document",
    "draft a document",
    "write a document",
    "rewrite",
    "edit this",
    "summary",
    "summarise",
    "form",
    "proposal",
    "agreement",
  ]);

  if (isDocument) {
    return {
      destination: "workspace",
      kind: "document",
      tools: [
        "document",
        "companion",
      ],
    };
  }

  const isCalendar = includesAny(text, [
    "calendar",
    "schedule",
    "appointment",
    "availability",
    "book a time",
    "what time",
  ]);

  if (isCalendar) {
    return {
      destination: "office",
      kind: "calendar",
      tools: [
        "calendar",
        "companion",
      ],
    };
  }

  const isReminder = includesAny(text, [
    "remind me",
    "reminder",
    "don't let me forget",
    "dont let me forget",
    "check later",
    "follow up later",
  ]);

  if (isReminder) {
    return {
      destination: "office",
      kind: "reminder",
      tools: ["companion"],
    };
  }

  return {
    destination: "office",
    kind: "conversation",
    tools: ["companion"],
  };
}

export function createSmilingMonadIntent(
  request: string
): SmilingMonadIntent {
  const originalRequest =
    request.trim();

  if (!originalRequest) {
    throw new Error(
      "An intention is required."
    );
  }

  const classification =
    classifyIntent(originalRequest);

  return {
    id: crypto.randomUUID(),
    originalRequest,
    destination:
      classification.destination,
    kind: classification.kind,
    title: createTitle(
      originalRequest,
      classification.kind
    ),
    tools: classification.tools,
    shouldStartAutomatically:
      classification.destination ===
      "workspace",
    createdAt:
      new Date().toISOString(),
  };
}