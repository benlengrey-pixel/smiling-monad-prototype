import type { Task } from "./types";
import { startTask } from "./engine";
import {
  createWorkspace,
  openCard,
} from "@/lib/workspace/engine";
import type { WorkspaceState } from "@/lib/workspace/types";

export type TaskExecution = {
  task: Task;
  workspace: WorkspaceState;
};

export function executeTask(task: Task): TaskExecution {
  const activeTask = startTask(task);

  let workspace = createWorkspace();

  for (const card of activeTask.workspaceCards) {
    workspace = openCard(workspace, card);
  }

  return {
    task: activeTask,
    workspace,
  };
}