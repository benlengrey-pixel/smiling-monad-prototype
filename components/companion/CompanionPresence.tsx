"use client";

import type {
  CompanionAvatarExpression,
  CompanionAvatarStatus,
} from "@/lib/companion/avatar/types";

type CompanionPresenceProps = {
  active: boolean;
  status?: CompanionAvatarStatus;
  expression?: CompanionAvatarExpression;
  onActivate: () => void;
};

const STATUS_LABELS: Record<
  CompanionAvatarStatus,
  string
> = {
  idle: "Kimi is ready",
  listening: "Kimi is listening",
  thinking: "Kimi is thinking",
  speaking: "Kimi is speaking",
  offline: "Kimi is offline",
  error: "Kimi needs attention",
};

export default function CompanionPresence({
  active,
  status = "idle",
  expression = "warm",
  onActivate,
}: CompanionPresenceProps) {
  const isEngaged =
    status === "listening" ||
    status === "thinking" ||
    status === "speaking";

  return (
    <div
      className="
        absolute
        left-[46%]
        top-[39%]
        z-20
        h-[31%]
        w-[43%]
        sm:left-[43%]
        sm:top-[35%]
        sm:h-[40%]
        sm:w-[29%]
      "
      data-companion-presence
      data-active={active}
      data-status={status}
      data-expression={expression}
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
          rounded-t-[48%]
          rounded-b-[28px]
        "
      >
        <div
          id="kimi-avatar-stage"
          className="h-full w-full"
        />

        <div
          className={`
            absolute
            inset-[8%]
            rounded-[45%]
            transition-all
            duration-700
            ${
              isEngaged
                ? "bg-[radial-gradient(circle,rgba(255,244,218,0.18)_0%,rgba(255,244,218,0.06)_48%,transparent_74%)] opacity-100"
                : "opacity-0"
            }
            ${
              status === "thinking"
                ? "animate-pulse"
                : ""
            }
          `}
        />
      </div>

      <span className="sr-only">
        {STATUS_LABELS[status]}
      </span>

      <button
        type="button"
        onClick={onActivate}
        aria-label={
          active
            ? STATUS_LABELS[status]
            : "Activate the Office with Kimi"
        }
        title={
          active
            ? STATUS_LABELS[status]
            : "Kimi"
        }
        className="
          absolute
          inset-0
          cursor-pointer
          rounded-t-[48%]
          rounded-b-[28px]
          border-0
          bg-transparent
          outline-none
          transition
          focus-visible:ring-4
          focus-visible:ring-[rgba(255,244,218,0.75)]
        "
      />
    </div>
  );
}