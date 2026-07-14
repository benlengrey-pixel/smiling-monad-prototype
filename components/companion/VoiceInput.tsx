"use client";

type VoiceInputProps = {
  working: boolean;
  listening: boolean;
  message: string;
  selected: boolean;
  onStart: () => void;
};

export default function VoiceInput({
  working,
  listening,
  message,
  selected,
  onStart,
}: VoiceInputProps) {
  return (
    <>
      {selected && (
        <div
          aria-live="polite"
          className="min-w-0 flex-1 px-3 py-2 text-sm text-[#5f544b] sm:w-[380px] sm:flex-none sm:text-base"
        >
          {working
            ? "Kimi is working…"
            : message || "Press the microphone and speak to Kimi."}
        </div>
      )}

      <button
        type="button"
        onClick={onStart}
        aria-label={listening ? "Kimi is listening" : "Talk to Kimi"}
        aria-pressed={selected}
        title="Talk to Kimi"
        className={`touch-manipulation flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl transition focus:outline-none focus:ring-4 focus:ring-[#6d513a]/35 ${
          selected
            ? "bg-[#6d513a] text-white"
            : "bg-[#efe8df] text-[#6d513a]"
        } ${listening ? "animate-pulse" : ""}`}
      >
        <span aria-hidden="true">🎤</span>
      </button>
    </>
  );
}