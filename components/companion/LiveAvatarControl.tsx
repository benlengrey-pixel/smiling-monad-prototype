"use client";

type LiveAvatarControlProps = {
  active: boolean;
  blocked: boolean;
  message: string;
  onStart: () => void;
  onFinish: () => void;
};

export default function LiveAvatarControl({
  active,
  blocked,
  message,
  onStart,
  onFinish,
}: LiveAvatarControlProps) {
  return (
    <div className="pointer-events-auto absolute left-3 top-3 z-40 sm:left-auto sm:right-[4%] sm:top-[4%]">
      <div className="rounded-2xl border border-white/25 bg-[#3f4641]/70 p-2 shadow-[0_12px_28px_rgba(32,39,35,0.24)] backdrop-blur-xl">
        <button
          type="button"
          onClick={
            active
              ? onFinish
              : onStart
          }
          className={`
            rounded-xl
            px-4
            py-2
            text-xs
            font-medium
            text-white
            transition
            focus:outline-none
            focus:ring-2
            focus:ring-white/35
            ${
              active
                ? "bg-[#7a3f32] hover:bg-[#69362b]"
                : "bg-[#486d67] hover:bg-[#3c5d58]"
            }
          `}
        >
          {active
            ? "End face-to-face session"
            : "Meet Kimi face-to-face"}
        </button>

        {(message || blocked) && (
          <p className="mt-2 max-w-[15rem] px-1 text-[10px] leading-4 text-white/75">
            {message ||
              "Live face-to-face Kimi is available with the Premium Pack."}
          </p>
        )}
      </div>
    </div>
  );
}