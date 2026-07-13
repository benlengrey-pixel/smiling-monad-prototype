export type SessionMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Session = {
  id: string;
  startedAt: string;
  currentTask?: string;
  activeCircle?: string;
  messages: SessionMessage[];
  approvals: string[];
  temporaryNotes: string[];
  visibleWorkspace: string[];
};

export function createSession(): Session {
  return {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    messages: [],
    approvals: [],
    temporaryNotes: [],
    visibleWorkspace: [],
  };
}

export function addMessage(
  session: Session,
  message: SessionMessage
): Session {
  return {
    ...session,
    messages: [...session.messages, message].slice(-10),
  };
}

export function setCurrentTask(
  session: Session,
  currentTask: string
): Session {
  return {
    ...session,
    currentTask,
  };
}

export function setActiveCircle(
  session: Session,
  activeCircle: string
): Session {
  return {
    ...session,
    activeCircle,
  };
}

export function clearSession(): Session {
  return createSession();
}