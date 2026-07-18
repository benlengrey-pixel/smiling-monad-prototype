"use client";

import {
  getPlanEntitlements,
  type PlanEntitlements,
  type SmilingMonadPlan,
} from "./entitlements";

const PLAN_STORAGE_KEY =
  "smiling-monad-plan-v1";

const DEFAULT_PLAN: SmilingMonadPlan =
  "free";

function isSmilingMonadPlan(
  value: unknown,
): value is SmilingMonadPlan {
  return (
    value === "free" ||
    value === "standard" ||
    value === "premium" ||
    value === "provider"
  );
}

export function readCurrentPlan():
  SmilingMonadPlan {
  if (typeof window === "undefined") {
    return DEFAULT_PLAN;
  }

  try {
    const storedPlan =
      window.localStorage.getItem(
        PLAN_STORAGE_KEY,
      );

    return isSmilingMonadPlan(storedPlan)
      ? storedPlan
      : DEFAULT_PLAN;
  } catch {
    return DEFAULT_PLAN;
  }
}

export function readCurrentEntitlements():
  PlanEntitlements {
  return getPlanEntitlements(
    readCurrentPlan(),
  );
}

export function saveCurrentPlan(
  plan: SmilingMonadPlan,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PLAN_STORAGE_KEY,
      plan,
    );
  } catch {
    // The app continues with the free plan.
  }
}

export function clearCurrentPlan(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(
      PLAN_STORAGE_KEY,
    );
  } catch {
    // The app continues with the free plan.
  }
}