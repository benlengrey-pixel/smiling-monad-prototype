export type EngineObject =
  | "conversation"
  | "note"
  | "report"
  | "project"
  | "goal"
  | "person"
  | "circle"
  | "timeline"
  | "file"
  | "image";

export interface Thought {
  request: string;
}

export interface Decision {
  object: EngineObject;
  createTile: boolean;
}
