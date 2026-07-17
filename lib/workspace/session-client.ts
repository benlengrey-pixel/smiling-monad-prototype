import type { SmilingMonadIntent } from "@/lib/intent/intent-engine";

export type GatewayAction =
  | "answer"
  | "draft"
  | "clarify"
  | "prepare-tool";

export type GatewayApplication =
  | "shift-report"
  | "correspondence"
  | "notes"
  | "planning"
  | "general";

export type GatewayPresentation =
  | "conversation"
  | "document"
  | "folder"
  | "workspace"
  | "tool";

export type GatewayOfficeObject =
  | "none"
  | "report-folder"
  | "correspondence-folder"
  | "notebook"
  | "planner"
  | "workspace";

export type GatewayTool =
  | "none"
  | "shift-report"
  | "correspondence"
  | "notes"
  | "planning";

export type WorkspaceGatewayResult = {
  action: GatewayAction;
  application: GatewayApplication;
  presentation: GatewayPresentation;
  officeObject: GatewayOfficeObject;
  tool: GatewayTool;
  title: string;
  question: string;
  content: string;
  reason: string;
  nextStep: string;
  requiresConfirmation: boolean;
};

export type TemporaryWorkspaceSession = {
  id: string;
  intent: SmilingMonadIntent;
  createdAt: string;
  source: "office";
  status: "ready" | "active" | "complete";
  gatewayResult?: WorkspaceGatewayResult;
};

const WORKSPACE_SESSION_KEY =
  "smiling-monad-workspace-session";

function createLegacyIntent(
  request: string
): SmilingMonadIntent {
  return {
    id: crypto.randomUUID(),
    originalRequest: request.trim(),
    destination: "workspace",
    kind: "general",
    title:
      request.trim() || "Current task",
    tools: ["companion"],
    shouldStartAutomatically: true,
    createdAt: new Date().toISOString(),
  };
}

function isGatewayResult(
  value: unknown
): value is WorkspaceGatewayResult {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const result =
    value as Partial<WorkspaceGatewayResult>;

  return (
    typeof result.action === "string" &&
    typeof result.application ===
      "string" &&
    typeof result.presentation ===
      "string" &&
    typeof result.officeObject ===
      "string" &&
    typeof result.tool === "string" &&
    typeof result.title === "string" &&
    typeof result.question === "string" &&
    typeof result.content === "string" &&
    typeof result.reason === "string" &&
    typeof result.nextStep === "string" &&
    typeof result.requiresConfirmation ===
      "boolean"
  );
}

export function createTemporaryWorkspaceSession(
  intentOrRequest:
    | SmilingMonadIntent
    | string,
  gatewayResult?: WorkspaceGatewayResult
): TemporaryWorkspaceSession {
  const intent =
    typeof intentOrRequest === "string"
      ? createLegacyIntent(
          intentOrRequest
        )
      : intentOrRequest;

  return {
    id: crypto.randomUUID(),
    intent,
    createdAt: new Date().toISOString(),
    source: "office",
    status: "ready",
    ...(gatewayResult
      ? { gatewayResult }
      : {}),
  };
}

export function saveTemporaryWorkspaceSession(
  session: TemporaryWorkspaceSession
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    WORKSPACE_SESSION_KEY,
    JSON.stringify(session)
  );
}

export function readTemporaryWorkspaceSession():
  | TemporaryWorkspaceSession
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedSession =
    window.sessionStorage.getItem(
      WORKSPACE_SESSION_KEY
    );

  if (!storedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(
      storedSession
    ) as
      | TemporaryWorkspaceSession
      | {
          id?: string;
          request?: string;
          createdAt?: string;
          source?: "office";
          status?:
            | "ready"
            | "active"
            | "complete";
          gatewayResult?: unknown;
        };

    if (
      "intent" in parsedSession &&
      parsedSession.intent
    ) {
      const migratedSession: TemporaryWorkspaceSession =
        {
          id:
            parsedSession.id ||
            crypto.randomUUID(),
          intent:
            parsedSession.intent,
          createdAt:
            parsedSession.createdAt ||
            new Date().toISOString(),
          source: "office",
          status:
            parsedSession.status ||
            "ready",
          ...(isGatewayResult(
            parsedSession.gatewayResult
          )
            ? {
                gatewayResult:
                  parsedSession.gatewayResult,
              }
            : {}),
        };

      saveTemporaryWorkspaceSession(
        migratedSession
      );

      return migratedSession;
    }

    if (
      "request" in parsedSession &&
      parsedSession.request
    ) {
      const migratedSession: TemporaryWorkspaceSession =
        {
          id:
            parsedSession.id ||
            crypto.randomUUID(),
          intent: createLegacyIntent(
            parsedSession.request
          ),
          createdAt:
            parsedSession.createdAt ||
            new Date().toISOString(),
          source: "office",
          status: "ready",
          ...(isGatewayResult(
            parsedSession.gatewayResult
          )
            ? {
                gatewayResult:
                  parsedSession.gatewayResult,
              }
            : {}),
        };

      saveTemporaryWorkspaceSession(
        migratedSession
      );

      return migratedSession;
    }

    window.sessionStorage.removeItem(
      WORKSPACE_SESSION_KEY
    );

    return null;
  } catch {
    window.sessionStorage.removeItem(
      WORKSPACE_SESSION_KEY
    );

    return null;
  }
}

export function updateTemporaryWorkspaceSession(
  updates: Partial<
    Pick<
      TemporaryWorkspaceSession,
      "status" | "gatewayResult"
    >
  >
): TemporaryWorkspaceSession | null {
  const currentSession =
    readTemporaryWorkspaceSession();

  if (!currentSession) {
    return null;
  }

  const updatedSession: TemporaryWorkspaceSession =
    {
      ...currentSession,
      ...updates,
    };

  saveTemporaryWorkspaceSession(
    updatedSession
  );

  return updatedSession;
}

export function clearTemporaryWorkspaceSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(
    WORKSPACE_SESSION_KEY
  );
}