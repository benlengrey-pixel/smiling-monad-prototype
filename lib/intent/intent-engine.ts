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

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function uniqueTools(tools: IntentTool[]): IntentTool[] {
  return Array.from(new Set(tools));
}

function createTitle(request: string, kind: IntentKind): string {
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
      return "Current task";
  }
}

function classifyIntent(request: string): {
  destination: IntentDestination;
  kind: IntentKind;
  tools: IntentTool[];
} {
  const text = request.trim().toLowerCase();

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
  ]);

  if (isWellbeing) {
    const tools: IntentTool[] = ["companion"];

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
      tools.push("breathing", "timer");
    }

    if (
      includesAny(text, [
        "meditation",
        "meditate",
        "relax",
        "sleep",
        "music",
        "nature sounds",
      ])
    ) {
      tools.push("timer", "audio");
    }

    if (includesAny(text, ["yoga", "stretch"])) {
      tools.push("timer");
    }

    return {
      destination: "workspace",
      kind: "wellbeing",
      tools: uniqueTools(tools),
    };
  }

  const isMeeting = includesAny(text, [
    "meeting",
    "zoom",
    "teams",
    "google meet",
    "video call",
    "agenda",
    "meeting notes",
    "minutes",
  ]);

  if (isMeeting) {
    return {
      destination: "workspace",
      kind: "meeting",
      tools: ["meeting", "notes", "companion"],
    };
  }

  const isReport = includesAny(text, [
    "shift report",
    "progress report",
    "incident report",
    "support report",
    "case report",
    "write a report",
    "prepare a report",
    "today's report",
    "todays report",
  ]);

  if (isReport) {
    return {
      destination: "workspace",
      kind: "report",
      tools: ["document", "companion"],
    };
  }

  const isCorrespondence = includesAny(text, [
    "write an email",
    "draft an email",
    "send an email",
    "write a letter",
    "draft a letter",
    "write a message",
    "reply to",
    "respond to",
    "correspondence",
  ]);

  if (isCorrespondence) {
    return {
      destination: "workspace",
      kind: "correspondence",
      tools: ["document", "companion"],
    };
  }

  const isDocument = includesAny(text, [
    "service agreement",
    "document",
    "draft",
    "write",
    "rewrite",
    "edit",
    "summary",
    "summarise",
    "form",
    "proposal",
    "plan",
    "agreement",
  ]);

  if (isDocument) {
    return {
      destination: "workspace",
      kind: "document",
      tools: ["document", "companion"],
    };
  }

  const isFileTask = includesAny(text, [
    "file",
    "files",
    "photo",
    "photos",
    "image",
    "images",
    "pdf",
    "attachment",
    "upload",
    "spreadsheet",
    "word document",
  ]);

  if (isFileTask) {
    return {
      destination: "workspace",
      kind: "files",
      tools: ["attachments", "companion"],
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
    "menu",
    "website",
  ]);

  if (isResearch) {
    return {
      destination: "workspace",
      kind: "research",
      tools: ["research", "notes", "companion"],
    };
  }

  const isPlanning = includesAny(text, [
    "help me plan",
    "make a plan",
    "planning",
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
      tools: ["checklist", "notes", "companion"],
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
      tools: ["calendar", "companion"],
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

  const isSimpleConversation = includesAny(text, [
    "hello",
    "hi",
    "how are you",
    "thank you",
    "thanks",
    "what do you think",
    "help me think",
    "explain",
  ]);

  if (isSimpleConversation) {
    return {
      destination: "office",
      kind: "conversation",
      tools: ["companion"],
    };
  }

  return {
    destination: "workspace",
    kind: "general",
    tools: ["companion"],
  };
}

export function createSmilingMonadIntent(
  request: string
): SmilingMonadIntent {
  const originalRequest = request.trim();

  if (!originalRequest) {
    throw new Error("An intention is required.");
  }

  const classification = classifyIntent(originalRequest);

  return {
    id: crypto.randomUUID(),
    originalRequest,
    destination: classification.destination,
    kind: classification.kind,
    title: createTitle(originalRequest, classification.kind),
    tools: classification.tools,
    shouldStartAutomatically:
      classification.destination === "workspace",
    createdAt: new Date().toISOString(),
  };
}