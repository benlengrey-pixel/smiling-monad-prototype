export type CompanionAvatarStatus =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "offline"
  | "error";

export type CompanionAvatarExpression =
  | "neutral"
  | "warm"
  | "encouraging"
  | "focused"
  | "concerned";

export type CompanionAvatarCommand =
  | {
      type: "set-status";
      status: CompanionAvatarStatus;
    }
  | {
      type: "set-expression";
      expression: CompanionAvatarExpression;
    }
  | {
      type: "speak";
      text: string;
    }
  | {
      type: "stop-speaking";
    };

export type CompanionAvatarSession = {
  id: string;
  provider: string;
  connected: boolean;
  status: CompanionAvatarStatus;
  expression: CompanionAvatarExpression;
};

export type CompanionAvatarAdapter = {
  connect: (
    container: HTMLElement,
  ) => Promise<CompanionAvatarSession>;

  disconnect: () => Promise<void>;

  send: (
    command: CompanionAvatarCommand,
  ) => Promise<void>;

  getSession: () =>
    | CompanionAvatarSession
    | null;
};