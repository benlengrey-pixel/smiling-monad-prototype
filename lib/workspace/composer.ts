export type WorkspacePanelType =
  | "conversation"
  | "document"
  | "attachments"
  | "checklist"
  | "calendar"
  | "meeting"
  | "notes";

export type WorkspacePanel = {
  id: string;
  type: WorkspacePanelType;
  title: string;
  purpose: string;
  primary: boolean;
};

export type WorkspaceComposition = {
  task: string;
  panels: WorkspacePanel[];
};

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

export function createWorkspaceComposition(
  task: string
): WorkspaceComposition {
  const normalizedTask = task.trim().toLowerCase();

  const panels: WorkspacePanel[] = [
    {
      id: "conversation",
      type: "conversation",
      title: "Companion",
      purpose: "Discuss and guide the active task.",
      primary: false,
    },
  ];

  const needsDocument = includesAny(normalizedTask, [
    "report",
    "letter",
    "email",
    "document",
    "draft",
    "write",
    "rewrite",
    "summary",
    "summarise",
    "plan",
  ]);

  const needsAttachments = includesAny(normalizedTask, [
    "file",
    "files",
    "photo",
    "photos",
    "image",
    "images",
    "pdf",
    "document",
    "attachment",
    "upload",
  ]);

  const needsChecklist = includesAny(normalizedTask, [
    "checklist",
    "to do",
    "todo",
    "tasks",
    "steps",
    "action items",
  ]);

  const needsCalendar = includesAny(normalizedTask, [
    "calendar",
    "schedule",
    "appointment",
    "availability",
    "week",
  ]);

  const needsMeeting = includesAny(normalizedTask, [
    "meeting",
    "zoom",
    "teams",
    "google meet",
    "video call",
  ]);

  const needsNotes = includesAny(normalizedTask, [
    "notes",
    "case notes",
    "meeting notes",
    "record",
  ]);

  if (needsDocument) {
    panels.unshift({
      id: "document",
      type: "document",
      title: "Working document",
      purpose: "Create and refine the task’s main document.",
      primary: true,
    });
  }

  if (needsAttachments) {
    panels.push({
      id: "attachments",
      type: "attachments",
      title: "Files",
      purpose: "Use temporary files relevant to the active task.",
      primary: !needsDocument,
    });
  }

  if (needsChecklist) {
    panels.push({
      id: "checklist",
      type: "checklist",
      title: "Actions",
      purpose: "Track only the actions required for this task.",
      primary: !needsDocument && !needsAttachments,
    });
  }

  if (needsCalendar) {
    panels.push({
      id: "calendar",
      type: "calendar",
      title: "Schedule",
      purpose: "Work with dates and times relevant to this task.",
      primary: false,
    });
  }

  if (needsMeeting) {
    panels.push({
      id: "meeting",
      type: "meeting",
      title: "Meeting",
      purpose: "Facilitate the active meeting and its required materials.",
      primary: true,
    });
  }

  if (needsNotes) {
    panels.push({
      id: "notes",
      type: "notes",
      title: "Notes",
      purpose: "Capture information relevant to this task.",
      primary: !needsDocument && !needsMeeting,
    });
  }

  return {
    task: task.trim(),
    panels,
  };
}