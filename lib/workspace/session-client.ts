export type TemporaryWorkspaceSession = {
  id: string;
  request: string;
  createdAt: string;
  source: "office";
};

const WORKSPACE_SESSION_KEY = "smiling-monad-workspace-session";

export function createTemporaryWorkspaceSession(
  request: string
): TemporaryWorkspaceSession {
  return {
    id: crypto.randomUUID(),
    request: request.trim(),
    createdAt: new Date().toISOString(),
    source: "office",
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
    return JSON.parse(storedSession) as TemporaryWorkspaceSession;
  } catch {
    window.sessionStorage.removeItem(WORKSPACE_SESSION_KEY);
    return null;
  }
}

export function clearTemporaryWorkspaceSession(): void {
  window.sessionStorage.removeItem(WORKSPACE_SESSION_KEY);
}