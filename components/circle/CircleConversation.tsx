"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  readSecureCircleMessages,
  sendSecureCircleMessage,
  type SecureCircleMessage,
} from "@/lib/circle/secure-circle-messages-client";

type CircleConversationProps = {
  circleId: string;
  senderName: string;
};

function formatMessageTime(
  createdAt: string,
): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

export default function CircleConversation({
  circleId,
  senderName,
}: CircleConversationProps) {
  const [messages, setMessages] =
    useState<SecureCircleMessage[]>([]);

  const [messageText, setMessageText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const loadMessages = useCallback(
    async () => {
      if (!circleId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        const nextMessages =
          await readSecureCircleMessages(
            circleId,
          );

        setMessages(nextMessages);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "The Circle conversation could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    },
    [circleId],
  );

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  async function submitMessage(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !circleId ||
      sending ||
      !messageText.trim()
    ) {
      return;
    }

    setSending(true);
    setMessage("");

    try {
      const newMessage =
        await sendSecureCircleMessage(
          circleId,
          senderName,
          messageText,
        );

      setMessages((current) => [
        ...current,
        newMessage,
      ]);

      setMessageText("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The Circle message could not be sent.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/80 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/40">
            Circle conversation
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-[#2c2a26]">
            Talk with your Circle
          </h2>

          <p className="mt-2 text-sm leading-6 text-black/55">
            Messages here are shared with active
            members of this Circle of Support.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadMessages();
          }}
          disabled={loading}
          className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Refreshing…"
            : "Refresh"}
        </button>
      </div>

      <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto rounded-3xl border border-black/10 bg-[#f7f3eb] p-4">
        {loading ? (
          <p className="py-6 text-center text-sm text-black/50">
            Loading conversation…
          </p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-sm leading-6 text-black/50">
            No messages yet. Start the
            conversation with your Circle.
          </p>
        ) : (
          messages.map((circleMessage) => (
            <article
              key={circleMessage.id}
              className="rounded-3xl border border-black/10 bg-white p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-[#2c2a26]">
                  {circleMessage.sender_name ||
                    "Circle member"}
                </p>

                <time className="text-xs text-black/40">
                  {formatMessageTime(
                    circleMessage.created_at,
                  )}
                </time>
              </div>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-black/70">
                {circleMessage.message_text}
              </p>
            </article>
          ))
        )}
      </div>

      <form
        onSubmit={submitMessage}
        className="mt-5"
      >
        <label
          htmlFor="circle-message"
          className="text-sm font-semibold text-[#2c2a26]"
        >
          Message your Circle
        </label>

        <textarea
          id="circle-message"
          value={messageText}
          onChange={(event) => {
            setMessageText(
              event.target.value,
            );
          }}
          rows={4}
          maxLength={5000}
          placeholder="Write a message to Kimi and the rest of your Circle…"
          className="mt-2 w-full resize-y rounded-3xl border border-black/15 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-black/35"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-black/40">
            {messageText.length} / 5000
          </p>

          <button
            type="submit"
            disabled={
              sending ||
              !circleId ||
              !messageText.trim()
            }
            className="rounded-full bg-[#60432f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending
              ? "Sending…"
              : "Send message"}
          </button>
        </div>
      </form>

      {message ? (
        <p className="mt-4 rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm leading-6">
          {message}
        </p>
      ) : null}
    </section>
  );
}