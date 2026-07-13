import { Decision, Thought } from "./types";

export function decide(thought: Thought): Decision {
  const text = thought.request.toLowerCase();

  if (text.includes("shift") || text.includes("report")) {
    return {
      object: "report",
      createTile: true,
    };
  }

  if (text.includes("image") || text.includes("photo")) {
    return {
      object: "image",
      createTile: false,
    };
  }

  return {
    object: "conversation",
    createTile: false,
  };
}