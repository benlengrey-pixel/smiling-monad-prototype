"use client";

import Link from "next/link";

type MarketEntranceProps = {
  href: string;
  ariaLabel: string;
  label: string;
  description: string;
  className: string;
};

function MarketEntrance({
  href,
  ariaLabel,
  label,
  description,
  className,
}: MarketEntranceProps) {
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
        focus-visible:ring-white/70
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
          group-hover:border-white/30
          group-hover:bg-white/[0.035]
          group-focus-visible:border-white/40
          group-focus-visible:bg-white/[0.05]
        "
      />

      <span
        className="
          pointer-events-none
          absolute
          bottom-4
          left-1/2
          w-[82%]
          -translate-x-1/2
          rounded-[18px]
          border
          border-white/20
          bg-black/30
          px-4
          py-3
          text-center
          text-white
          opacity-0
          shadow-sm
          backdrop-blur-md
          transition
          duration-300
          group-hover:opacity-100
          group-focus-visible:opacity-100
        "
      >
        <span className="block text-sm font-semibold">
          {label}
        </span>

        <span className="mt-1 block text-[10px] leading-4 text-white/75">
          {description}
        </span>
      </span>
    </Link>
  );
}

export default function MarketPage() {
  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#526644] text-[#3f3127]">
      <img
        src="/smiling-monad-community-market.png"
        alt="The Smiling Monad courtyard with the Community Centre and Training Centre beside the waterfall"
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

      <MarketEntrance
        href="/community"
        ariaLabel="Enter the Smiling Monad Community Centre"
        label="Community Centre"
        description="People, circles, posts, events and community trading"
        className="
          left-[2%]
          top-[34%]
          h-[47%]
          w-[46%]
          sm:left-[3%]
          sm:top-[28%]
          sm:h-[55%]
          sm:w-[43%]
        "
      />

      <MarketEntrance
        href="/school"
        ariaLabel="Enter the Smiling Monad Training Centre"
        label="Training Centre"
        description="Learning, worker pathways, training packs and resources"
        className="
          right-[2%]
          top-[34%]
          h-[47%]
          w-[46%]
          sm:right-[3%]
          sm:top-[28%]
          sm:h-[55%]
          sm:w-[43%]
        "
      />
    </main>
  );
}