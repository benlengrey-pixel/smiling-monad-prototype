import type { Task } from "./types";
import type { WorkspaceCard } from "@/lib/workspace/types";

export function createTask(
  request: string,
  title = request
): Task {
  return {
    id: crypto.randomUUID(),
    title,
    request,
    status: "planned",
    requiredTools: [],
    requiredTemplateIds: [],
    workspaceCards: [],
  };
}

export function startTask(task: Task): Task {
  return {
    ...task,
    status: "active",
  };
}

export function addTaskCard(
  task: Task,
  card: WorkspaceCard
): Task {
  return {
    ...task,
    workspaceCards: [...task.workspaceCards, card],
  };
}

export function completeTask(task: Task): Task {
  return {
    ...task,
    status: "complete",
  };
}