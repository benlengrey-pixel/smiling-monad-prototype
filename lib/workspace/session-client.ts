import type { SmilingMonadIntent } from "@/lib/intent/intent-engine";

export type TemporaryWorkspaceSession = {
  id: string;
  intent: SmilingMonadIntent;
  createdAt: string;
  source: "office";
  status: "ready" | "active" | "complete";
};

const WORKSPACE_SESSION_KEY = "smiling-monad-workspace-session";

function createLegacyIntent(request: string): SmilingMonadIntent {
  return {
    id: crypto.randomUUID(),
    originalRequest: request.trim(),
    destination: "workspace",
    kind: "general",
    title: request.trim() || "Current task",
    tools: ["companion"],
    shouldStartAutomatically: true,
    createdAt: new Date().toISOString(),
  };
}

export function createTemporaryWorkspaceSession(
  intentOrRequest: SmilingMonadIntent | string
): TemporaryWorkspaceSession {
  const intent =
    typeof intentOrRequest === "string"
      ? createLegacyIntent(intentOrRequest)
      : intentOrRequest;

  return {
    id: crypto.randomUUID(),
    intent,
    createdAt: new Date().toISOString(),
    source: "office",
    status: "ready",
  };
}

export function saveTemporaryWorkspaceSession(
  session: TemporaryWorkspaceSession
): void {
  window.sessionStorage.setItem(
    WORKSPACE_SESSION_KEY,
    JSON.stringify(session)
  );
}

export function readTemporaryWorkspaceSession():
  | TemporaryWorkspaceSession
  | null {
  const storedSession = window.sessionStorage.getItem(
    WORKSPACE_SESSION_KEY
  );

  if (!storedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(storedSession) as
      | TemporaryWorkspaceSession
      | {
          id?: string;
          request?: string;
          createdAt?: string;
          source?: "office";
        };

    if ("intent" in parsedSession && parsedSession.intent) {
      return parsedSession as TemporaryWorkspaceSession;
    }

    if ("request" in parsedSession && parsedSession.request) {
      const migratedSession: TemporaryWorkspaceSession = {
        id: parsedSession.id || crypto.randomUUID(),
        intent: createLegacyIntent(parsedSession.request),
        createdAt: parsedSession.createdAt || new Date().toISOString(),
        source: "office",
        status: "ready",
      };

      saveTemporaryWorkspaceSession(migratedSession);

      return migratedSession;
    }

    window.sessionStorage.removeItem(WORKSPACE_SESSION_KEY);
    return null;
  } catch {
    window.sessionStorage.removeItem(WORKSPACE_SESSION_KEY);
    return null;
  }
}

export function updateTemporaryWorkspaceSession(
  updates: Partial<Pick<TemporaryWorkspaceSession, "status">>
): TemporaryWorkspaceSession | null {
  const currentSession = readTemporaryWorkspaceSession();

  if (!currentSession) {
    return null;
  }

  const updatedSession: TemporaryWorkspaceSession = {
    ...currentSession,
    ...updates,
  };

  saveTemporaryWorkspaceSession(updatedSession);

  return updatedSession;
}

export function clearTemporaryWorkspaceSession(): void {
  window.sessionStorage.removeItem(WORKSPACE_SESSION_KEY);
}