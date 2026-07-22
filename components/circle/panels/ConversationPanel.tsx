"use client";

import type { SecureCircleMessage } from "@/lib/circle/secure-circle-messages-client";

type ConversationPanelProps = {
  messages: SecureCircleMessage[];
  loading: boolean;
  working: boolean;
  messageText: string;
  notice: string;
  onMessageTextChange: (value: string) => void;
  onSendMessage: () => void;
};

export default function ConversationPanel({
  messages,
  loading,
  working,
  messageText,
  notice,
  onMessageTextChange,
  onSendMessage,
}: ConversationPanelProps) {
  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        Shared Circle conversation
      </p>

      <h1 className="mt-3 font-serif text-3xl">
        Circle messages
      </h1>

      <p className="mt-3 max-w-2xl leading-7 text-[#6b5d50]">
        A shared text conversation for active
        Circle members. Kimi’s personal controls
        remain separate.
      </p>

      <div className="mt-6 max-h-[44svh] space-y-3 overflow-y-auto rounded-[22px] border border-[#d8c7b1] bg-[#f5ecdf] p-4 sm:p-5">
        {loading ? (
          <p className="rounded-[16px] bg-white/80 px-4 py-3 text-[#756151]">
            Loading Circle conversation…
          </p>
        ) : messages.length === 0 ? (
          <p className="rounded-[16px] border border-dashed border-[#cdbba4] bg-white/70 px-4 py-5 text-[#756151]">
            No messages yet. Start the Circle
            conversation below.
          </p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className="rounded-[18px] border border-[#dfd2c1] bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[#4f3b2d]">
                  {message.sender_name}
                </p>

                <time className="text-xs text-[#8a786a]">
                  {new Date(
                    message.created_at,
                  ).toLocaleString()}
                </time>
              </div>

              <p className="mt-2 whitespace-pre-wrap leading-7 text-[#5f5044]">
                {message.message_body}
              </p>
            </article>
          ))
        )}
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-medium">
          Message the Circle
        </span>

        <textarea
          value={messageText}
          onChange={(event) =>
            onMessageTextChange(
              event.target.value,
            )
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();
              onSendMessage();
            }
          }}
          maxLength={4000}
          placeholder="Write a message for active Circle members…"
          className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 leading-7 outline-none focus:border-[#71523b]"
        />
      </label>

      <div className="mt-2 flex items-center justify-between gap-4 text-xs text-[#8a786a]">
        <span>
          Enter sends · Shift+Enter adds a line
        </span>
        <span>{messageText.length}/4000</span>
      </div>

      <button
        type="button"
        onClick={onSendMessage}
        disabled={
          working ||
          !messageText.trim()
        }
        className="mt-4 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {working
          ? "Sending securely…"
          : "Send to Circle"}
      </button>

      {notice && (
        <p className="mt-3 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
          {notice}
        </p>
      )}
    </>
  );
}