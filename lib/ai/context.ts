import { SMILING_MONAD_CONTRACT } from "./contract";
import { AI_PARAMETERS } from "./parameters";

export type SubscriptionTier =
  | "free"
  | "plus"
  | "pro"
  | "enterprise";

export type AIContext = {
  currentTask?: string;
  memory?: string;
  subscriptionTier: SubscriptionTier;
};

export function buildAIContext(context: AIContext) {
  return {
    contract: SMILING_MONAD_CONTRACT,
    parameters: AI_PARAMETERS,
    currentTask: context.currentTask || "No current task set.",
    memory: context.memory || "No saved memory.",
    subscriptionTier: context.subscriptionTier,
  };
}