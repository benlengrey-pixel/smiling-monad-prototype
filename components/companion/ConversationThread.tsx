"use client";

export type ConversationMessage = {
  id: string;
  speaker: "Ben" | "Kimi";
  text: string;
};

type ConversationThreadProps = {
  messages: ConversationMessage[];
  working: boolean;
};

export default function ConversationThread({
  messages,
  working,
}: ConversationThreadProps) {
  if (messages.length === 0 && !working) {
    return null;
  }

  const visibleMessages = messages.slice(-6);

  return (
    <div className="pointer-events-none absolute left-[4%] top-[16%] z-20 w-[min(25rem,86vw)] sm:left-[5%] sm:top-[18%] sm:w-[24rem]">
      <div
        aria-live="polite"
        className="space-y-2 text-sm leading-6 text-[#3f352d] drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] sm:text-base"
      >
        {visibleMessages.map((message, index) => {
          const distanceFromNewest =
            visibleMessages.length - index - 1;

          const opacityClass =
            distanceFromNewest >= 4
              ? "opacity-30"
              : distanceFromNewest === 3
                ? "opacity-45"
                : distanceFromNewest === 2
                  ? "opacity-60"
                  : distanceFromNewest === 1
                    ? "opacity-75"
                    : "opacity-100";

          return (
            <p
              key={message.id}
              className={`transition-opacity duration-500 ${opacityClass}`}
            >
              <span className="font-semibold">
                {message.speaker}:
              </span>{" "}
              <span className="whitespace-pre-wrap">
                {message.text}
              </span>
            </p>
          );
        })}

        {working && (
          <p className="opacity-70">
            <span className="font-semibold">
              Kimi:
            </span>{" "}
            <span>Kimi is thinking…</span>
          </p>
        )}
      </div>
    </div>
  );
}