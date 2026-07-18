"use client";

import Link from "next/link";

type MarketEntryProps = {
  href: string;
  ariaLabel: string;
  label: string;
  className: string;
};

function MarketEntry({
  href,
  ariaLabel,
  label,
  className,
}: MarketEntryProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={label}
      className={`
        group
        absolute
        z-20
        rounded-[24px]
        outline-none
        transition
        focus-visible:ring-2
        focus-visible:ring-white/65
        ${className}
      `}
    >
      <span
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-[24px]
          border
          border-white/0
          bg-white/0
          transition
          duration-300
          group-hover:border-white/28
          group-hover:bg-white/[0.035]
          group-hover:shadow-[0_0_24px_rgba(255,255,255,0.08)]
          group-focus-visible:border-white/35
          group-focus-visible:bg-white/[0.045]
        "
      />

      <span
        className="
          pointer-events-none
          absolute
          bottom-4
          left-1/2
          -translate-x-1/2
          whitespace-nowrap
          rounded-full
          border
          border-white/18
          bg-black/28
          px-3
          py-1.5
          text-[10px]
          font-medium
          tracking-[0.08em]
          text-white/0
          opacity-0
          shadow-sm
          backdrop-blur-md
          transition
          duration-300
          group-hover:text-white/88
          group-hover:opacity-100
          group-focus-visible:text-white/88
          group-focus-visible:opacity-100
          sm:text-[11px]
        "
      >
        {label}
      </span>
    </Link>
  );
}

export default function MarketPage() {
  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#526644] text-[#3f3127]">
      <img
        src="/smiling-monad-community-market.png"
        alt="The Smiling Monad Community Market beside the waterfall"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15" />

      <Link
        href="/office"
        aria-label="Return to the Smiling Monad Space"
        title="Return to the Smiling Monad Space"
        className="
          absolute
          left-3
          top-3
          z-30
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-full
          border
          border-white/35
          bg-black/30
          text-xl
          text-white/90
          shadow-lg
          backdrop-blur-md
          transition
          hover:bg-black/42
          focus:outline-none
          focus:ring-2
          focus:ring-white/65
          sm:left-5
          sm:top-5
        "
      >
        ←
      </Link>

      <MarketEntry
        href="/connections"
        ariaLabel="Open Connections and Circles"
        label="Connections & Circles"
        className="
          left-[0%]
          top-[27%]
          h-[30%]
          w-[47%]
          sm:left-[1%]
          sm:top-[23%]
          sm:h-[38%]
          sm:w-[37%]
        "
      />

      <MarketEntry
        href="/school"
        ariaLabel="Open the Smiling Monad School and Community Chat"
        label="School & Community Chat"
        className="
          right-[0%]
          top-[27%]
          h-[30%]
          w-[47%]
          sm:right-[1%]
          sm:top-[23%]
          sm:h-[38%]
          sm:w-[37%]
        "
      />

      <MarketEntry
        href="/community"
        ariaLabel="Open the Community Noticeboard"
        label="Community Noticeboard"
        className="
          bottom-[3%]
          left-[0%]
          h-[33%]
          w-[48%]
          sm:bottom-[2%]
          sm:left-[1%]
          sm:h-[33%]
          sm:w-[38%]
        "
      />

      <MarketEntry
        href="/shop"
        ariaLabel="Open the Smiling Monad Shop"
        label="Smiling Monad Shop"
        className="
          bottom-[3%]
          right-[0%]
          h-[33%]
          w-[48%]
          sm:bottom-[2%]
          sm:right-[1%]
          sm:h-[33%]
          sm:w-[38%]
        "
      />
    </main>
  );
}