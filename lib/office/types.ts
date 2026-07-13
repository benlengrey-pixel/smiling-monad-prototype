import type { Companion } from "@/lib/companion/types";
import type { WorkspaceState } from "@/lib/workspace/types";

export type OfficeType =
  | "participant"
  | "support-worker"
  | "support-coordinator"
  | "therapist"
  | "provider"
  | "project";

export type SubscriptionTier =
  | "free"
  | "plus"
  | "pro"
  | "enterprise";

export type Office = {
  id: string;
  name: string;
  type: OfficeType;
  subscriptionTier: SubscriptionTier;
  companion: Companion;
  activeCircleIds: string[];
  toolIds: string[];
  templateIds: string[];
  integrationIds: string[];
  accessibilityProfileId?: string;
  workspace: WorkspaceState;
};