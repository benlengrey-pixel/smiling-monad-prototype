"use client";

type CompanionPresenceProps = {
  active: boolean;
  onActivate: () => void;
};

export default function CompanionPresence({
  active,
  onActivate,
}: CompanionPresenceProps) {
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
      </div>

      <button
        type="button"
        onClick={onActivate}
        aria-label={
          active
            ? "The Office is active"
            : "Activate the Office with Kimi"
        }
        title={
          active
            ? "Office active"
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