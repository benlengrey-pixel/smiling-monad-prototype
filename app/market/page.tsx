"use client";

import Link from "next/link";
import { useState } from "react";

type MarketStall =
  | "school"
  | "shop";

type StallDetails = {
  name: string;
  sign: string;
  description: string;
  items: string[];
};

const stalls: Record<MarketStall, StallDetails> = {
  school: {
    name: "Smiling Monad School",
    sign: "SCHOOL FOR TRAINING",
    description:
      "A calm learning space for practical training, personal development and building the skills needed to provide thoughtful, person-centred support.",
    items: [
      "Support worker training",
      "Communication training",
      "Positive behaviour support learning",
      "Circle-building skills",
      "Community and professional development",
    ],
  },

  shop: {
    name: "Smiling Monad Shop",
    sign: "THE SHOP",
    description:
      "The home of Smiling Monad merchandise, practical resources and tools that help people live and work more easily.",
    items: [
      "Clothing and merchandise",
      "Printed resources",
      "Templates and guides",
      "Gifts and community products",
      "Digital tools",
    ],
  },
};

export default function MarketPage() {
  const [activeStall, setActiveStall] =
    useState<MarketStall | null>(null);

  const selectedStall = activeStall
    ? stalls[activeStall]
    : null;

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

      <button
        type="button"
        onClick={() => setActiveStall("school")}
        aria-label="Open the Smiling Monad School"
        className="absolute right-[0%] top-[27%] z-20 h-[30%] w-[47%] rounded-[24px] bg-transparent outline-none transition hover:bg-white/5 focus-visible:ring-4 focus-visible:ring-white/70 sm:right-[1%] sm:top-[23%] sm:h-[38%] sm:w-[37%]"
      />

      <Link
        href="/community"
        aria-label="Open the Events and Community Noticeboard"
        className="absolute bottom-[3%] left-[0%] z-20 h-[33%] w-[48%] rounded-[24px] bg-transparent outline-none transition hover:bg-white/5 focus-visible:ring-4 focus-visible:ring-white/70 sm:bottom-[2%] sm:left-[1%] sm:h-[33%] sm:w-[38%]"
      />

      <button
        type="button"
        onClick={() => setActiveStall("shop")}
        aria-label="Open the Smiling Monad Shop"
        className="absolute bottom-[3%] right-[0%] z-20 h-[33%] w-[48%] rounded-[24px] bg-transparent outline-none transition hover:bg-white/5 focus-visible:ring-4 focus-visible:ring-white/70 sm:bottom-[2%] sm:right-[1%] sm:h-[33%] sm:w-[38%]"
      />

      {selectedStall && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <section className="relative w-full max-w-xl rounded-[28px] border border-[#dac8ae] bg-[rgba(255,250,241,0.97)] p-6 text-[#443326] shadow-[0_30px_70px_rgba(25,18,12,0.45)] sm:p-8">
            <button
              type="button"
              onClick={() => setActiveStall(null)}
              aria-label="Close stall"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eee2d2] text-xl text-[#5c4838] transition hover:bg-[#e3d3bd]"
            >
              ×
            </button>

            <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
              {selectedStall.sign}
            </p>

            <h1 className="mt-3 pr-10 font-serif text-3xl leading-tight sm:text-4xl">
              {selectedStall.name}
            </h1>

            <p className="mt-4 leading-7 text-[#68584a]">
              {selectedStall.description}
            </p>

            <div className="mt-6 space-y-3">
              {selectedStall.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="block w-full rounded-[16px] border border-[#e1d3c1] bg-[#f6eee2] px-4 py-3 text-left transition hover:bg-[#eee1cf]"
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveStall(null)}
              className="mt-7 w-full rounded-full bg-[#60432f] px-5 py-3 font-medium text-white transition hover:bg-[#4f3728]"
            >
              Return to the market
            </button>
          </section>
        </div>
      )}
    </main>
  );
}