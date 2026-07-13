import {
  buildAIContext,
  type AIContext,
} from "./context";
import { buildSystemPrompt } from "./prompt";
import type { SmilingMonadTool } from "./tools";
import type { CompanionMode } from "./companion";
import type { Session } from "./session";

type GatewayInput = AIContext & {
  availableTools?: SmilingMonadTool[];
  approvedActions?: string[];

  userName?: string;
  mode?: CompanionMode;
  circleName?: string;
  circleCentre?: string;

  session?: Session;
};

export function buildGatewayRequest(
  prompt: string,
  input: GatewayInput
) {
  const sessionConversation =
    input.session?.messages
      .map(
        (message) =>
          `${message.role}: ${message.content}`
      )
      .join("\n") || "No previous conversation.";

  const currentTask =
    input.session?.currentTask ||
    input.currentTask;

  const activeCircle =
    input.session?.activeCircle ||
    input.circleName;

  const context = buildAIContext({
    currentTask,
    memory: input.memory,
    subscriptionTier: input.subscriptionTier,
  });

  const instructions = buildSystemPrompt({
    currentTask,
    memory: `
${input.memory || "No saved memory."}

CURRENT SESSION:
${sessionConversation}
`,
    subscriptionTier: input.subscriptionTier,
    availableTools: input.availableTools,
    approvedActions:
      input.session?.approvals ||
      input.approvedActions,

    userName: input.userName,
    mode: input.mode,
    circleName: activeCircle,
    circleCentre: input.circleCentre,
  });

  return {
    prompt,
    context,
    instructions,
  };
}