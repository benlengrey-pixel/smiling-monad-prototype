"use client";

import Link from "next/link";
import { useState } from "react";

type MarketStall =
  | "community"
  | "connections"
  | "noticeboard"
  | "shop";

type StallDetails = {
  name: string;
  sign: string;
  description: string;
  items: string[];
};

const stalls: Record<MarketStall, StallDetails> = {
  community: {
    name: "Community Access",
    sign: "COMMUNITY",
    description:
      "A welcoming place to discover activities, social groups, local opportunities and ways to participate in community life.",
    items: [
      "Community activities",
      "Social and interest groups",
      "Accessible outings",
      "Local events",
      "Community chat rooms",
    ],
  },

  connections: {
    name: "People & Connections",
    sign: "CONNECTIONS",
    description:
      "A place where participants, families, support workers, providers and community members can find and build meaningful connections.",
    items: [
      "Participant profiles",
      "Support worker profiles",
      "Provider profiles",
      "Community connections",
      "Circle of Support invitations",
    ],
  },

  noticeboard: {
    name: "Community Noticeboard",
    sign: "NOTICEBOARD",
    description:
      "Shared announcements, upcoming events, requests for support and important information from across the Smiling Monad community.",
    items: [
      "Upcoming events",
      "Community announcements",
      "Help wanted",
      "Opportunities",
      "Local information",
    ],
  },

  shop: {
    name: "Smiling Monad Shop",
    sign: "THE SHOP",
    description:
      "Resources, training packages, practical tools and Smiling Monad products designed to help people live and work more easily.",
    items: [
      "Training packages",
      "Support resources",
      "Templates and guides",
      "Smiling Monad merchandise",
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
    <main className="relative min-h-screen overflow-hidden bg-[#c7d7b4] text-[#3f3127]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#acd1dd_0%,#dce9d5_32%,#b8c99c_64%,#87996f_100%)]" />

      <div className="absolute left-[-8%] top-[22%] h-[35rem] w-[42rem] rounded-full bg-[#78906f] opacity-45 blur-3xl" />

      <div className="absolute right-[-8%] top-[5%] h-[38rem] w-[38rem] rounded-full bg-[#edf4df] opacity-55 blur-3xl" />

      <div className="absolute right-[4%] top-[10%] h-[36%] w-[13%] rounded-[50%] bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(176,219,226,0.7),rgba(100,154,165,0.35))] shadow-[0_0_50px_rgba(255,255,255,0.5)]" />

      <div className="absolute right-[3%] top-[40%] h-[16%] w-[18%] rounded-[50%] bg-[rgba(205,233,225,0.5)] blur-lg" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/office"
              className="inline-flex items-center rounded-full border border-[rgba(75,55,38,0.28)] bg-[rgba(255,250,240,0.82)] px-4 py-2 text-sm shadow-sm backdrop-blur-sm transition hover:bg-[#fffaf1]"
            >
              ← Back to the Smiling Monad Space
            </Link>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.34em] text-[#6d604e]">
              Beyond the office
            </p>

            <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-6xl">
              The Smiling Monad Market
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f5547] sm:text-lg">
              An outdoor community space near the waterfall,
              where people can meet, connect, discover
              opportunities and access the wider Smiling Monad
              community.
            </p>
          </div>

          <Link
            href="/circle"
            className="rounded-full bg-[#60432f] px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-[#4e3627]"
          >
            Circle of Support Centre
          </Link>
        </header>

        <section className="mt-10 grid flex-1 items-end gap-6 pb-8 md:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveStall("community")}
            className="group relative min-h-[22rem] overflow-hidden rounded-t-[72px] rounded-b-[24px] border border-[#7c684e] bg-[linear-gradient(180deg,#d8b66d_0%,#a96f3f_52%,#68442f_100%)] p-5 text-left shadow-[0_22px_45px_rgba(56,42,24,0.28)] transition hover:-translate-y-2 hover:shadow-[0_30px_55px_rgba(56,42,24,0.35)]"
          >
            <div className="absolute inset-x-0 top-0 h-20 bg-[repeating-linear-gradient(90deg,#efe0b7_0px,#efe0b7_42px,#b76445_42px,#b76445_84px)]" />

            <div className="absolute left-1/2 top-16 h-10 w-[82%] -translate-x-1/2 rounded bg-[#f4e4bd] shadow-md" />

            <div className="relative mt-14 text-center">
              <p className="font-serif text-xl tracking-[0.12em] text-[#533b29]">
                COMMUNITY
              </p>
            </div>

            <div className="relative mt-12 rounded-[22px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,247,225,0.88)] p-5 backdrop-blur-sm">
              <p className="font-serif text-2xl">
                Community Access
              </p>

              <p className="mt-3 text-sm leading-6 text-[#695747]">
                Activities, social groups and ways to participate
                in local community life.
              </p>
            </div>

            <div className="absolute bottom-5 left-5 right-5 rounded-full bg-[#60432f] px-4 py-2 text-center text-sm text-white">
              Enter stall
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStall("connections")}
            className="group relative min-h-[22rem] overflow-hidden rounded-t-[72px] rounded-b-[24px] border border-[#756347] bg-[linear-gradient(180deg,#c9b47a_0%,#75845b_52%,#4c5b42_100%)] p-5 text-left shadow-[0_22px_45px_rgba(56,42,24,0.28)] transition hover:-translate-y-2 hover:shadow-[0_30px_55px_rgba(56,42,24,0.35)]"
          >
            <div className="absolute inset-x-0 top-0 h-20 bg-[repeating-linear-gradient(90deg,#e4d39b_0px,#e4d39b_42px,#6e8055_42px,#6e8055_84px)]" />

            <div className="absolute left-1/2 top-16 h-10 w-[82%] -translate-x-1/2 rounded bg-[#eee0b4] shadow-md" />

            <div className="relative mt-14 text-center">
              <p className="font-serif text-xl tracking-[0.12em] text-[#4e4835]">
                CONNECTIONS
              </p>
            </div>

            <div className="relative mt-12 rounded-[22px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,250,234,0.88)] p-5 backdrop-blur-sm">
              <p className="font-serif text-2xl">
                People & Connections
              </p>

              <p className="mt-3 text-sm leading-6 text-[#695747]">
                Find participants, workers, providers and people
                who may belong in a circle of support.
              </p>
            </div>

            <div className="absolute bottom-5 left-5 right-5 rounded-full bg-[#4f5d43] px-4 py-2 text-center text-sm text-white">
              Enter stall
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStall("noticeboard")}
            className="group relative min-h-[22rem] overflow-hidden rounded-t-[72px] rounded-b-[24px] border border-[#725d45] bg-[linear-gradient(180deg,#d5b977_0%,#987348_52%,#64462f_100%)] p-5 text-left shadow-[0_22px_45px_rgba(56,42,24,0.28)] transition hover:-translate-y-2 hover:shadow-[0_30px_55px_rgba(56,42,24,0.35)]"
          >
            <div className="absolute inset-x-0 top-0 h-20 bg-[repeating-linear-gradient(90deg,#f0d8a2_0px,#f0d8a2_42px,#9d6846_42px,#9d6846_84px)]" />

            <div className="absolute left-1/2 top-16 h-10 w-[82%] -translate-x-1/2 rounded bg-[#f0ddad] shadow-md" />

            <div className="relative mt-14 text-center">
              <p className="font-serif text-xl tracking-[0.12em] text-[#513c2c]">
                NOTICEBOARD
              </p>
            </div>

            <div className="relative mt-12 rounded-[22px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,248,230,0.9)] p-5 backdrop-blur-sm">
              <p className="font-serif text-2xl">
                Community Noticeboard
              </p>

              <p className="mt-3 text-sm leading-6 text-[#695747]">
                Events, announcements, opportunities and shared
                community information.
              </p>
            </div>

            <div className="absolute bottom-5 left-5 right-5 rounded-full bg-[#6d4c34] px-4 py-2 text-center text-sm text-white">
              Enter stall
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStall("shop")}
            className="group relative min-h-[22rem] overflow-hidden rounded-t-[72px] rounded-b-[24px] border border-[#6c5741] bg-[linear-gradient(180deg,#d6bb82_0%,#7c6452_52%,#493a31_100%)] p-5 text-left shadow-[0_22px_45px_rgba(56,42,24,0.28)] transition hover:-translate-y-2 hover:shadow-[0_30px_55px_rgba(56,42,24,0.35)]"
          >
            <div className="absolute inset-x-0 top-0 h-20 bg-[repeating-linear-gradient(90deg,#ead7aa_0px,#ead7aa_42px,#725846_42px,#725846_84px)]" />

            <div className="absolute left-1/2 top-16 h-10 w-[82%] -translate-x-1/2 rounded bg-[#efddb4] shadow-md" />

            <div className="relative mt-14 text-center">
              <p className="font-serif text-xl tracking-[0.12em] text-[#4d3d33]">
                THE SHOP
              </p>
            </div>

            <div className="relative mt-12 rounded-[22px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,250,235,0.9)] p-5 backdrop-blur-sm">
              <p className="font-serif text-2xl">
                Smiling Monad Shop
              </p>

              <p className="mt-3 text-sm leading-6 text-[#695747]">
                Resources, training, practical tools and Smiling
                Monad products.
              </p>
            </div>

            <div className="absolute bottom-5 left-5 right-5 rounded-full bg-[#4b3a31] px-4 py-2 text-center text-sm text-white">
              Enter stall
            </div>
          </button>
        </section>
      </div>

      {selectedStall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(35,29,22,0.48)] p-4 backdrop-blur-sm">
          <section className="relative w-full max-w-xl rounded-[30px] border border-[#d9c6aa] bg-[#fffaf1] p-6 shadow-[0_30px_70px_rgba(41,31,21,0.38)] sm:p-8">
            <button
              type="button"
              onClick={() => setActiveStall(null)}
              aria-label="Close stall"
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#eee2d2] text-lg text-[#5c4838] transition hover:bg-[#e3d3bd]"
            >
              ×
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b745d]">
              {selectedStall.sign}
            </p>

            <h2 className="mt-3 pr-10 font-serif text-3xl sm:text-4xl">
              {selectedStall.name}
            </h2>

            <p className="mt-4 leading-7 text-[#68584a]">
              {selectedStall.description}
            </p>

            <div className="mt-6 space-y-3">
              {selectedStall.items.map((item) => (
                <div
                  key={item}
                  className="rounded-[16px] border border-[#e1d3c1] bg-[#f6eee2] px-4 py-3"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {activeStall === "connections" && (
                <Link
                  href="/circle"
                  className="rounded-full bg-[#60432f] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4f3728]"
                >
                  Open Circle Centre
                </Link>
              )}

              <button
                type="button"
                onClick={() => setActiveStall(null)}
                className="rounded-full bg-[#eee2d2] px-5 py-3 text-sm font-medium text-[#513d2f] transition hover:bg-[#e3d3bd]"
              >
                Return to market
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}