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
  updatedAt: string;
  lastOpenedAt: string;
  source: "office";
  status: "ready" | "active" | "complete";
  gatewayResult?: WorkspaceGatewayResult;
};

const WORKSPACE_SESSION_KEY =
  "smiling-monad-workspace-session";

const LEGACY_SESSION_KEY =
  "smiling-monad-workspace-session";

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `workspace-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getCurrentTime(): string {
  return new Date().toISOString();
}

function createLegacyIntent(
  request: string
): SmilingMonadIntent {
  const trimmedRequest = request.trim();

  return {
    id: createId(),
    originalRequest: trimmedRequest,
    destination: "workspace",
    kind: "general",
    title:
      trimmedRequest || "Current task",
    tools: ["companion"],
    shouldStartAutomatically: true,
    createdAt: getCurrentTime(),
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

function isWorkspaceStatus(
  value: unknown
): value is TemporaryWorkspaceSession["status"] {
  return (
    value === "ready" ||
    value === "active" ||
    value === "complete"
  );
}

function writeSessionToLocalStorage(
  session: TemporaryWorkspaceSession
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    WORKSPACE_SESSION_KEY,
    JSON.stringify(session)
  );
}

function removeLegacySessionStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(
    LEGACY_SESSION_KEY
  );
}

function migrateStoredSession(
  value: unknown
): TemporaryWorkspaceSession | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const parsedSession = value as {
    id?: string;
    intent?: SmilingMonadIntent;
    request?: string;
    createdAt?: string;
    updatedAt?: string;
    lastOpenedAt?: string;
    source?: "office";
    status?:
      | "ready"
      | "active"
      | "complete";
    gatewayResult?: unknown;
  };

  const now = getCurrentTime();

  let intent: SmilingMonadIntent | null =
    null;

  if (parsedSession.intent) {
    intent = parsedSession.intent;
  } else if (
    typeof parsedSession.request ===
      "string" &&
    parsedSession.request.trim()
  ) {
    intent = createLegacyIntent(
      parsedSession.request
    );
  }

  if (!intent) {
    return null;
  }

  return {
    id:
      parsedSession.id || createId(),
    intent,
    createdAt:
      parsedSession.createdAt || now,
    updatedAt:
      parsedSession.updatedAt ||
      parsedSession.createdAt ||
      now,
    lastOpenedAt:
      parsedSession.lastOpenedAt ||
      parsedSession.updatedAt ||
      parsedSession.createdAt ||
      now,
    source: "office",
    status: isWorkspaceStatus(
      parsedSession.status
    )
      ? parsedSession.status
      : "ready",
    ...(isGatewayResult(
      parsedSession.gatewayResult
    )
      ? {
          gatewayResult:
            parsedSession.gatewayResult,
        }
      : {}),
  };
}

function readStoredValue(
  storage: Storage,
  key: string
): unknown {
  const storedValue =
    storage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    storage.removeItem(key);
    return null;
  }
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

  const now = getCurrentTime();

  return {
    id: createId(),
    intent,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
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

  const now = getCurrentTime();

  const persistentSession: TemporaryWorkspaceSession =
    {
      ...session,
      updatedAt:
        session.updatedAt || now,
      lastOpenedAt:
        session.lastOpenedAt || now,
    };

  writeSessionToLocalStorage(
    persistentSession
  );

  removeLegacySessionStorage();
}

export function readTemporaryWorkspaceSession():
  | TemporaryWorkspaceSession
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const localValue = readStoredValue(
    window.localStorage,
    WORKSPACE_SESSION_KEY
  );

  let migratedSession =
    migrateStoredSession(localValue);

  if (!migratedSession) {
    const legacyValue = readStoredValue(
      window.sessionStorage,
      LEGACY_SESSION_KEY
    );

    migratedSession =
      migrateStoredSession(legacyValue);
  }

  if (!migratedSession) {
    window.localStorage.removeItem(
      WORKSPACE_SESSION_KEY
    );

    removeLegacySessionStorage();

    return null;
  }

  const openedSession: TemporaryWorkspaceSession =
    {
      ...migratedSession,
      lastOpenedAt: getCurrentTime(),
    };

  writeSessionToLocalStorage(
    openedSession
  );

  removeLegacySessionStorage();

  return openedSession;
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

  const now = getCurrentTime();

  const updatedSession: TemporaryWorkspaceSession =
    {
      ...currentSession,
      ...updates,
      updatedAt: now,
      lastOpenedAt: now,
    };

  writeSessionToLocalStorage(
    updatedSession
  );

  return updatedSession;
}

export function clearTemporaryWorkspaceSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(
    WORKSPACE_SESSION_KEY
  );

  removeLegacySessionStorage();
}