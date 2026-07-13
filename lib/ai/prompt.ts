import { SMILING_MONAD_CONTRACT } from "./contract";
import { AI_PARAMETERS } from "./parameters";
import {
  buildCompanionContext,
  type CompanionMode,
} from "./companion";
import type { SubscriptionTier } from "./context";
import type { SmilingMonadTool } from "./tools";

type PromptInput = {
  currentTask?: string;
  memory?: string;
  subscriptionTier: SubscriptionTier;
  availableTools?: SmilingMonadTool[];
  approvedActions?: string[];

  userName?: string;
  mode?: CompanionMode;
  circleName?: string;
  circleCentre?: string;
};

const tierGuidance: Record<SubscriptionTier, string> = {
  free: "Respond to user input with clear guidance and simple assistance.",
  plus: "Adapt to the user and provide more useful assistance.",
  pro: "Work with greater autonomy and use available tools when useful.",
  enterprise:
    "Support wider team coordination while respecting privacy and permissions.",
};

export function buildSystemPrompt(input: PromptInput) {
  const companion = buildCompanionContext({
    userName: input.userName,
    mode: input.mode || "personal",
    circleName: input.circleName,
    circleCentre: input.circleCentre,
  });

  const currentTask =
    input.currentTask?.trim() || "No current task is set.";

  const memory =
    input.memory?.trim() || "No relevant memory is available.";

  const tools =
    input.availableTools?.length
      ? input.availableTools.join(", ")
      : "No tools are currently available.";

  const approvedActions =
    input.approvedActions?.length
      ? input.approvedActions.join(", ")
      : "No actions are pre-approved.";

  return `
${companion.identity}

SMILING MONAD PHILOSOPHY

Purpose:
${SMILING_MONAD_CONTRACT.philosophy.purpose}

Principle:
${SMILING_MONAD_CONTRACT.philosophy.principle}

Circle principle:
${SMILING_MONAD_CONTRACT.philosophy.circle}

COMPANION CONTEXT

User:
${companion.user}

Mode:
${companion.mode}

Circle:
${companion.circle.name}

Centre:
${companion.circle.centre}

Circle relationship:
${companion.circle.principle}

Participant Mode:
${
  companion.participantMode
    ? JSON.stringify(companion.participantMode)
    : "Not active."
}

WORKING CONTEXT

Subscription:
${input.subscriptionTier}

Tier guidance:
${tierGuidance[input.subscriptionTier]}

Current task:
${currentTask}

Relevant memory:
${memory}

Available tools:
${tools}

Approved actions:
${approvedActions}

Actions requiring approval:
${AI_PARAMETERS.askApprovalBefore.join(", ")}

Think freely.
Tell the truth.
Respect the user.
Support the active Circle.
Keep the interaction as simple as the task allows.
Ask before taking an action that is not approved.
`;
}