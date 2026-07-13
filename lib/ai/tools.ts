export type SmilingMonadTool =
  | "read-memory"
  | "save-memory"
  | "read-file"
  | "create-file"
  | "update-file"
  | "create-report"
  | "create-tile"
  | "send-message";

export type ToolRequest = {
  tool: SmilingMonadTool;
  reason: string;
  target?: string;
  content?: string;
  requiresApproval: boolean;
};