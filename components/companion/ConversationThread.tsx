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
    <div className="pointer-events-none absolute bottom-[5.75rem] left-1/2 z-40 w-[calc(100%-3rem)] max-w-[38rem] -translate-x-1/2 sm:bottom-auto sm:top-[56%] sm:w-[36rem]">
      <div
        aria-live="polite"
        className="text-center text-[13px] leading-5 text-white/80 drop-shadow-[0_1px_2px_rgba(44,31,20,0.78)] sm:text-sm"
      >
        <div className="space-y-0.5">
          {visibleMessages.map((message, index) => {
            const distanceFromNewest =
              visibleMessages.length - index - 1;

            const opacityClass =
              distanceFromNewest >= 5
                ? "opacity-10"
                : distanceFromNewest === 4
                  ? "opacity-15"
                  : distanceFromNewest === 3
                    ? "opacity-25"
                    : distanceFromNewest === 2
                      ? "opacity-40"
                      : distanceFromNewest === 1
                        ? "opacity-58"
                        : "opacity-82";

            return (
              <p
                key={message.id}
                className={`m-0 transition-opacity duration-500 ${opacityClass}`}
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
            <p className="m-0 opacity-50">
              <span className="font-medium">
                Kimi:
              </span>{" "}
              thinking…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}