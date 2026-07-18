export type SmilingMonadPlan =
  | "free"
  | "standard"
  | "premium"
  | "provider";

export type SmilingMonadCapability =
  | "companion-text"
  | "companion-voice"
  | "workspace"
  | "documents"
  | "circle-support"
  | "live-avatar"
  | "guided-meetings"
  | "meeting-records"
  | "provider-management";

export type PlanEntitlements = {
  plan: SmilingMonadPlan;
  capabilities: SmilingMonadCapability[];
  liveAvatarMinutesPerMonth: number;
  maxConcurrentLiveAvatarSessions: number;
};

const PLAN_ENTITLEMENTS: Record<
  SmilingMonadPlan,
  PlanEntitlements
> = {
  free: {
    plan: "free",
    capabilities: [
      "companion-text",
      "workspace",
      "documents",
    ],
    liveAvatarMinutesPerMonth: 0,
    maxConcurrentLiveAvatarSessions: 0,
  },

  standard: {
    plan: "standard",
    capabilities: [
      "companion-text",
      "companion-voice",
      "workspace",
      "documents",
      "circle-support",
    ],
    liveAvatarMinutesPerMonth: 0,
    maxConcurrentLiveAvatarSessions: 0,
  },

  premium: {
    plan: "premium",
    capabilities: [
      "companion-text",
      "companion-voice",
      "workspace",
      "documents",
      "circle-support",
      "live-avatar",
      "guided-meetings",
      "meeting-records",
    ],
    liveAvatarMinutesPerMonth: 60,
    maxConcurrentLiveAvatarSessions: 1,
  },

  provider: {
    plan: "provider",
    capabilities: [
      "companion-text",
      "companion-voice",
      "workspace",
      "documents",
      "circle-support",
      "live-avatar",
      "guided-meetings",
      "meeting-records",
      "provider-management",
    ],
    liveAvatarMinutesPerMonth: 300,
    maxConcurrentLiveAvatarSessions: 3,
  },
};

export function getPlanEntitlements(
  plan: SmilingMonadPlan,
): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan];
}

export function hasCapability(
  entitlements: PlanEntitlements,
  capability: SmilingMonadCapability,
): boolean {
  return entitlements.capabilities.includes(
    capability,
  );
}

export function canStartLiveAvatarSession(
  entitlements: PlanEntitlements,
  usedMinutesThisMonth: number,
  activeSessions: number,
): boolean {
  return (
    hasCapability(
      entitlements,
      "live-avatar",
    ) &&
    usedMinutesThisMonth <
      entitlements.liveAvatarMinutesPerMonth &&
    activeSessions <
      entitlements.maxConcurrentLiveAvatarSessions
  );
}