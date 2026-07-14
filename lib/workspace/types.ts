export type WorkspaceCardType =
  | "conversation"
  | "report"
  | "document"
  | "image"
  | "calendar"
  | "checklist"
  | "task";

export type WorkspaceAttachmentKind =
  | "image"
  | "pdf"
  | "document"
  | "text"
  | "spreadsheet"
  | "other";

export type WorkspaceAttachmentStatus =
  | "selected"
  | "reading"
  | "ready"
  | "unsupported"
  | "error";

export type WorkspaceAttachmentStorageIntent =
  | "use-once"
  | "save"
  | "export";

export type WorkspaceAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: WorkspaceAttachmentKind;
  status: WorkspaceAttachmentStatus;
  storageIntent: WorkspaceAttachmentStorageIntent;
  previewUrl?: string;
  extractedText?: string;
  error?: string;
};

export type WorkspaceCard = {
  id: string;
  type: WorkspaceCardType;
  title: string;
  content?: string;
  status: "draft" | "ready" | "active" | "complete";
  visible: boolean;
  attachments?: WorkspaceAttachment[];
};

export type WorkspaceState = {
  cards: WorkspaceCard[];
  attachments?: WorkspaceAttachment[];
};