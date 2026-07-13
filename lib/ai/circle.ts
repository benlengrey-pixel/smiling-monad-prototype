export type CircleType =
  | "participant"
  | "project"
  | "family"
  | "business"
  | "organisation";

export interface Circle {
  id: string;
  name: string;
  type: CircleType;

  centre: string;

  purpose: string;

  members: string[];

  companionPrinciple:
    "Each member has their own companion. Companions cooperate to support the Circle.";
}

export const CIRCLE_PRINCIPLE =
  "The companion serves its user. The companions together serve the Circle.";