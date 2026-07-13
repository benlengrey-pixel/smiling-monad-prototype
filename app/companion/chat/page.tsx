"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function CompanionChatPage() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [currentTask, setCurrentTask] = useState("");
  const [memory, setMemory] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const savedConversation = localStorage.getItem(
      "smiling-monad-conversation"
    );
    const savedTask = localStorage.getItem(
      "smiling-monad-current-task"
    );
    const savedMemory = localStorage.getItem(
      "smiling-monad-memory"
    );

    if (savedConversation) {
      setConversation(JSON.parse(savedConversation));
    }

    if (savedTask) {
      setCurrentTask(savedTask);
    }

    if (savedMemory) {
      setMemory(savedMemory);
    }
  }, []);

  function saveTask(value: string) {
    setCurrentTask(value);
    localStorage.setItem("smiling-monad-current-task", value);
  }

  function saveMemory(value: string) {
    setMemory(value);
    localStorage.setItem("smiling-monad-memory", value);
  }

  async function sendMessage() {
    const cleanMessage = message.trim();

    if (!cleanMessage || sending) {
      return;
    }

    const updatedConversation: ChatMessage[] = [
      ...conversation,
      {
        role: "user",
        text: cleanMessage,
      },
    ];

    setConversation(updatedConversation);
    setMessage("");
    setSending(true);

    const conversationText = updatedConversation
      .map((item) => `${item.role}: ${item.text}`)
      .join("\n");

    const fullMessage = `
You are operating within the Smiling Monad ecosystem.

While here, operate under Smiling Monad philosophy.

Keep responses short and direct.
Stay focused on the current task.
Ask before changing the task.
Ask before changing code or data.

CURRENT TASK:
${currentTask || "No current task set."}

SMILING MONAD MEMORY:
${memory || "No saved memory."}

CONVERSATION:
${conversationText}

Respond to the latest user message.
`;

    try {
      const result = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: fullMessage,
        }),
      });

      const data = await result.json();

      const reply =
        data.response || data.error || "No response returned.";

      const completedConversation: ChatMessage[] = [
        ...updatedConversation,
        {
          role: "assistant",
          text: reply,
        },
      ];

      setConversation(completedConversation);

      localStorage.setItem(
        "smiling-monad-conversation",
        JSON.stringify(completedConversation)
      );
    } catch {
      const failedConversation: ChatMessage[] = [
        ...updatedConversation,
        {
          role: "assistant",
          text: "Unable to contact the AI.",
        },
      ];

      setConversation(failedConversation);
    } finally {
      setSending(false);
    }
  }

  function clearConversation() {
    setConversation([]);
    localStorage.removeItem("smiling-monad-conversation");
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2e8] p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/companion"
          className="text-blue-600 hover:underline"
        >
          ← Companion
        </Link>

        <h1 className="mt-6 text-4xl font-bold">
          AI Companion
        </h1>

        <div className="mt-8 rounded-xl border bg-white p-6">
          <label className="font-bold">Current Task</label>

          <input
            value={currentTask}
            onChange={(event) => saveTask(event.target.value)}
            placeholder="What are we working on?"
            className="mt-3 w-full rounded-lg border p-3"
          />

          <label className="mt-6 block font-bold">
            Smiling Monad Memory
          </label>

          <textarea
            value={memory}
            onChange={(event) => saveMemory(event.target.value)}
            placeholder="Important information to remember..."
            className="mt-3 h-32 w-full rounded-lg border p-3"
          />
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="text-2xl font-bold">Conversation</h2>

          <div className="mt-4 space-y-4">
            {conversation.length === 0 && (
              <p className="text-gray-500">
                No conversation yet.
              </p>
            )}

            {conversation.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border p-4"
              >
                <strong>
                  {item.role === "user" ? "You" : "Companion"}
                </strong>

                <p className="mt-2 whitespace-pre-wrap">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI..."
            className="mt-6 h-32 w-full rounded-lg border p-4"
          />

          <div className="mt-4 flex gap-4">
            <button
              onClick={sendMessage}
              disabled={sending}
              className="rounded-full bg-black px-6 py-3 text-white disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>

            <button
              onClick={clearConversation}
              className="rounded-full border px-6 py-3"
            >
              Clear Conversation
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}