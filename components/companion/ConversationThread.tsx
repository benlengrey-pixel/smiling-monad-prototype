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

  const visibleMessages = messages.slice(-4);

  return (
    <div className="pointer-events-none absolute bottom-[7.5rem] left-1/2 z-20 w-[calc(100%-2rem)] max-w-[34rem] -translate-x-1/2 sm:bottom-auto sm:top-[51%] sm:w-[32rem]">
      <div
        aria-live="polite"
        className="space-y-1 text-center text-sm leading-5 text-[#4b4037] sm:text-base sm:leading-6"
      >
        {visibleMessages.map((message, index) => {
          const distanceFromNewest =
            visibleMessages.length - index - 1;

          const opacityClass =
            distanceFromNewest >= 3
              ? "opacity-20"
              : distanceFromNewest === 2
                ? "opacity-35"
                : distanceFromNewest === 1
                  ? "opacity-55"
                  : "opacity-75";

          return (
            <p
              key={message.id}
              className={`transition-opacity duration-500 ${opacityClass}`}
            >
              <span className="font-medium">
                {message.speaker}:
              </span>{" "}
              <span className="whitespace-pre-wrap">
                {message.text}
              </span>
            </p>
          );
        })}

        {working && (
          <p className="opacity-50">
            <span className="font-medium">
              Kimi:
            </span>{" "}
            thinking…
          </p>
        )}
      </div>
    </div>
  );
}