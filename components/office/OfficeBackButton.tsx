import Link from "next/link";

export default function OfficeBackButton() {
  return (
    <Link
      href="/"
      aria-label="Close the Smiling Monad app"
      title="Close app"
      className="
        absolute
        left-4
        top-4
        z-50
        inline-flex
        h-11
        items-center
        justify-center
        gap-2
        rounded-full
        border
        border-white/55
        bg-[rgba(48,38,30,0.72)]
        px-4
        text-sm
        font-medium
        text-[#fff8ed]
        shadow-[0_8px_24px_rgba(38,29,22,0.24)]
        backdrop-blur-md
        transition
        hover:bg-[rgba(48,38,30,0.9)]
        focus-visible:outline-none
        focus-visible:ring-4
        focus-visible:ring-white/70
        sm:left-6
        sm:top-6
      "
    >
      <span
        aria-hidden="true"
        className="text-lg leading-none"
      >
        ×
      </span>

      <span>Close app</span>
    </Link>
  );
}