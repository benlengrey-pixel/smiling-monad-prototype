import type { WorkspaceCard } from "@/lib/workspace/types";

export type TaskStatus =
  | "planned"
  | "active"
  | "waiting"
  | "complete"
  | "cancelled";

export type Task = {
  id: string;
  title: string;
  request: string;
  status: TaskStatus;
  requiredTools: string[];
  requiredTemplateIds: string[];
  workspaceCards: WorkspaceCard[];
};