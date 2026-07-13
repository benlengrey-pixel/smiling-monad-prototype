export type CompanionStatus =
  | "ready"
  | "thinking"
  | "presenting"
  | "waiting";

export type Companion = {
  id: string;
  name: string;
  avatar: string;
  status: CompanionStatus;
  mode:
    | "personal"
    | "participant"
    | "project"
    | "family"
    | "business"
    | "organisation";
};