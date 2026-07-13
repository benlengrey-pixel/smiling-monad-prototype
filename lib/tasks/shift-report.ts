import { addTaskCard, createTask } from "./engine";
import type { Task } from "./types";

export function createShiftReportTask(): Task {
  const task = createTask(
    "Prepare a shift report",
    "Shift Report"
  );

  return addTaskCard(task, {
    id: crypto.randomUUID(),
    type: "report",
    title: "Shift Report",
    content:
      "The Companion will gather the required shift details and prepare the report here.",
    status: "draft",
    visible: true,
  });
}