"use client";

import {
  canStartLiveAvatarSession,
  getPlanEntitlements,
  hasCapability,
  type PlanEntitlements,
  type SmilingMonadPlan,
} from "./entitlements";
import {
  getUsedLiveAvatarMinutes,
  readLiveAvatarUsage,
  type LiveAvatarUsage,
} from "./live-avatar-usage-client";
import {
  readCurrentPlan,
} from "./plan-client";

export type LiveAvatarAccessReason =
  | "allowed"
  | "plan-required"
  | "monthly-limit-reached"
  | "session-limit-reached";

export type LiveAvatarAccessDecision = {
  allowed: boolean;
  reason: LiveAvatarAccessReason;
  plan: SmilingMonadPlan;
  entitlements: PlanEntitlements;
  usage: LiveAvatarUsage;
  usedMinutes: number;
  remainingMinutes: number;
};

export function evaluateLiveAvatarAccess():
  LiveAvatarAccessDecision {
  const plan = readCurrentPlan();

  const entitlements =
    getPlanEntitlements(plan);

  const usage =
    readLiveAvatarUsage();

  const usedMinutes =
    getUsedLiveAvatarMinutes(usage);

  const remainingMinutes = Math.max(
    0,
    entitlements.liveAvatarMinutesPerMonth -
      usedMinutes,
  );

  if (
    !hasCapability(
      entitlements,
      "live-avatar",
    )
  ) {
    return {
      allowed: false,
      reason: "plan-required",
      plan,
      entitlements,
      usage,
      usedMinutes,
      remainingMinutes,
    };
  }

  if (
    usedMinutes >=
    entitlements.liveAvatarMinutesPerMonth
  ) {
    return {
      allowed: false,
      reason: "monthly-limit-reached",
      plan,
      entitlements,
      usage,
      usedMinutes,
      remainingMinutes,
    };
  }

  if (
    usage.activeSessions >=
    entitlements.maxConcurrentLiveAvatarSessions
  ) {
    return {
      allowed: false,
      reason: "session-limit-reached",
      plan,
      entitlements,
      usage,
      usedMinutes,
      remainingMinutes,
    };
  }

  return {
    allowed: canStartLiveAvatarSession(
      entitlements,
      usedMinutes,
      usage.activeSessions,
    ),
    reason: "allowed",
    plan,
    entitlements,
    usage,
    usedMinutes,
    remainingMinutes,
  };
}

export function getLiveAvatarAccessMessage(
  decision: LiveAvatarAccessDecision,
): string {
  if (decision.reason === "plan-required") {
    return "Live face-to-face Kimi is available with the Premium Pack.";
  }

  if (
    decision.reason ===
    "monthly-limit-reached"
  ) {
    return "Your live-avatar allowance has been used for this month.";
  }

  if (
    decision.reason ===
    "session-limit-reached"
  ) {
    return "Another live-avatar session is already active.";
  }

  const roundedMinutes = Math.max(
    0,
    Math.floor(decision.remainingMinutes),
  );

  return `${roundedMinutes} live-avatar minutes remaining this month.`;
}