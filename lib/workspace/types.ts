export type WorkspaceCardType =
  | "conversation"
  | "report"
  | "document"
  | "image"
  | "calendar"
  | "checklist"
  | "task";

export type WorkspaceCard = {
  id: string;
  type: WorkspaceCardType;
  title: string;
  content?: string;
  status: "draft" | "ready" | "active" | "complete";
  visible: boolean;
};

export type WorkspaceState = {
  cards: WorkspaceCard[];
};