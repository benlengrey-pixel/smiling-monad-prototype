import type { ConversationMessage } from "@/components/companion/ConversationThread";

const CONVERSATION_MEMORY_KEY =
  "smiling-monad-companion-conversation";

const MAX_STORED_MESSAGES = 30;

type StoredConversationMemory = {
  version: 1;
  updatedAt: string;
  messages: ConversationMessage[];
};

function isConversationMessage(
  value: unknown
): value is ConversationMessage {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const message =
    value as Partial<ConversationMessage>;

  return (
    typeof message.id === "string" &&
    (message.speaker === "Ben" ||
      message.speaker === "Kimi") &&
    typeof message.text === "string"
  );
}

function trimMessages(
  messages: ConversationMessage[]
): ConversationMessage[] {
  return messages
    .filter(
      (message) =>
        isConversationMessage(message) &&
        Boolean(message.text.trim())
    )
    .slice(-MAX_STORED_MESSAGES);
}

export function readConversationMemory():
  ConversationMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue =
    window.localStorage.getItem(
      CONVERSATION_MEMORY_KEY
    );

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(
      storedValue
    ) as Partial<StoredConversationMemory>;

    if (
      !Array.isArray(
        parsedValue.messages
      )
    ) {
      window.localStorage.removeItem(
        CONVERSATION_MEMORY_KEY
      );

      return [];
    }

    return trimMessages(
      parsedValue.messages.filter(
        isConversationMessage
      )
    );
  } catch {
    window.localStorage.removeItem(
      CONVERSATION_MEMORY_KEY
    );

    return [];
  }
}

export function saveConversationMemory(
  messages: ConversationMessage[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  const memory: StoredConversationMemory = {
    version: 1,
    updatedAt: new Date().toISOString(),
    messages: trimMessages(messages),
  };

  window.localStorage.setItem(
    CONVERSATION_MEMORY_KEY,
    JSON.stringify(memory)
  );
}

export function appendConversationMessage(
  message: ConversationMessage
): ConversationMessage[] {
  const messages = [
    ...readConversationMemory(),
    message,
  ];

  const trimmedMessages =
    trimMessages(messages);

  saveConversationMemory(
    trimmedMessages
  );

  return trimmedMessages;
}

export function replaceConversationMemory(
  messages: ConversationMessage[]
): ConversationMessage[] {
  const trimmedMessages =
    trimMessages(messages);

  saveConversationMemory(
    trimmedMessages
  );

  return trimmedMessages;
}

export function clearConversationMemory(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(
    CONVERSATION_MEMORY_KEY
  );
}