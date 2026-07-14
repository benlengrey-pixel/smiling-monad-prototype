import type { SmilingMonadIntent } from "@/lib/intent/intent-engine";

export type TemporaryWorkspaceSession = {
  id: string;
  intent: SmilingMonadIntent;
  createdAt: string;
  source: "office";
  status: "ready" | "active" | "complete";
};

const WORKSPACE_SESSION_KEY = "smiling-monad-workspace-session";

export function createTemporaryWorkspaceSession(
  intent: SmilingMonadIntent
): TemporaryWorkspaceSession {
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
    const parsedSession = JSON.parse(
      storedSession
    ) as TemporaryWorkspaceSession;

    if (
      !parsedSession.id ||
      !parsedSession.intent ||
      !parsedSession.intent.originalRequest
    ) {
      window.sessionStorage.removeItem(WORKSPACE_SESSION_KEY);
      return null;
    }

    return parsedSession;
  } catch {
    window.sessionStorage.removeItem(WORKSPACE_SESSION_KEY);
    return null;
  }
}

export function updateTemporaryWorkspaceSession(
  updates: Partial<
    Pick<TemporaryWorkspaceSession, "status">
  >
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