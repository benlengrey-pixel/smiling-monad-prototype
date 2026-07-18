"use client";

import Link from "next/link";

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
        className="absolute left-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/35 text-xl text-white shadow-lg backdrop-blur-md transition hover:bg-black/50 focus:outline-none focus:ring-4 focus:ring-white/70 sm:left-5 sm:top-5"
      >
        ←
      </Link>

      <Link
        href="/connections"
        aria-label="Open the Connections Centre"
        className="absolute left-[0%] top-[27%] z-20 h-[30%] w-[47%] rounded-[24px] bg-transparent outline-none transition hover:bg-white/5 focus-visible:ring-4 focus-visible:ring-white/70 sm:left-[1%] sm:top-[23%] sm:h-[38%] sm:w-[37%]"
      />

      <Link
        href="/school"
        aria-label="Open the Smiling Monad School"
        className="absolute right-[0%] top-[27%] z-20 h-[30%] w-[47%] rounded-[24px] bg-transparent outline-none transition hover:bg-white/5 focus-visible:ring-4 focus-visible:ring-white/70 sm:right-[1%] sm:top-[23%] sm:h-[38%] sm:w-[37%]"
      />

      <Link
        href="/community"
        aria-label="Open the Events and Community Noticeboard"
        className="absolute bottom-[3%] left-[0%] z-20 h-[33%] w-[48%] rounded-[24px] bg-transparent outline-none transition hover:bg-white/5 focus-visible:ring-4 focus-visible:ring-white/70 sm:bottom-[2%] sm:left-[1%] sm:h-[33%] sm:w-[38%]"
      />

      <Link
        href="/shop"
        aria-label="Open the Smiling Monad Shop"
        className="absolute bottom-[3%] right-[0%] z-20 h-[33%] w-[48%] rounded-[24px] bg-transparent outline-none transition hover:bg-white/5 focus-visible:ring-4 focus-visible:ring-white/70 sm:bottom-[2%] sm:right-[1%] sm:h-[33%] sm:w-[38%]"
      />
    </main>
  );
}