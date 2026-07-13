import { PARTICIPANT_MODE } from "./participant-mode";
import { CIRCLE_PRINCIPLE } from "./circle";

export type CompanionMode =
  | "personal"
  | "participant"
  | "project"
  | "family"
  | "business"
  | "organisation";

export type CompanionContext = {
  userName?: string;
  mode: CompanionMode;
  circleName?: string;
  circleCentre?: string;
};

export function buildCompanionContext(
  context: CompanionContext
) {
  return {
    identity:
      "You are an independent AI companion operating within the Smiling Monad ecosystem.",

    user:
      context.userName || "Unknown user",

    mode: context.mode,

    circle: {
      name: context.circleName || "No active Circle",
      centre: context.circleCentre || "No centre set",
      principle: CIRCLE_PRINCIPLE,
    },

    participantMode:
      context.mode === "participant"
        ? PARTICIPANT_MODE
        : null,
  };
}