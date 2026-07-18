import type {
  CompanionAvatarAdapter,
  CompanionAvatarCommand,
  CompanionAvatarExpression,
  CompanionAvatarSession,
  CompanionAvatarStatus,
} from "./types";

const DEFAULT_STATUS: CompanionAvatarStatus =
  "idle";

const DEFAULT_EXPRESSION: CompanionAvatarExpression =
  "warm";

export function createBrowserAvatarAdapter():
  CompanionAvatarAdapter {
  let container: HTMLElement | null = null;

  let session: CompanionAvatarSession | null =
    null;

  function applySessionState(): void {
    if (!container || !session) {
      return;
    }

    container.dataset.avatarProvider =
      session.provider;

    container.dataset.avatarConnected =
      String(session.connected);

    container.dataset.avatarStatus =
      session.status;

    container.dataset.avatarExpression =
      session.expression;
  }

  return {
    async connect(
      nextContainer,
    ): Promise<CompanionAvatarSession> {
      container = nextContainer;

      session = {
        id: crypto.randomUUID(),
        provider: "browser-stage",
        connected: true,
        status: DEFAULT_STATUS,
        expression: DEFAULT_EXPRESSION,
      };

      applySessionState();

      return session;
    },

    async disconnect(): Promise<void> {
      if (container) {
        delete container.dataset.avatarProvider;
        delete container.dataset.avatarConnected;
        delete container.dataset.avatarStatus;
        delete container.dataset.avatarExpression;
        delete container.dataset.avatarSpeech;
      }

      container = null;
      session = null;
    },

    async send(
      command: CompanionAvatarCommand,
    ): Promise<void> {
      if (!container || !session) {
        return;
      }

      if (command.type === "set-status") {
        session = {
          ...session,
          status: command.status,
        };

        applySessionState();
        return;
      }

      if (command.type === "set-expression") {
        session = {
          ...session,
          expression: command.expression,
        };

        applySessionState();
        return;
      }

      if (command.type === "speak") {
        container.dataset.avatarSpeech =
          command.text;

        return;
      }

      delete container.dataset.avatarSpeech;
    },

    getSession(): CompanionAvatarSession | null {
      return session;
    },
  };
}