"use client";

import Link from "next/link";
import { useState } from "react";

type ConnectionArea =
  | "people"
  | "work"
  | "circles"
  | "profile";

type AreaDetails = {
  title: string;
  description: string;
  examples: string[];
};

const connectionAreas: Record<
  ConnectionArea,
  AreaDetails
> = {
  people: {
    title: "Find People",
    description:
      "Search for participants, families, support workers, providers and community members who may be a good fit.",
    examples: [
      "Find local support workers",
      "Find providers and professionals",
      "Search by interests and experience",
      "Look for people who share your values",
    ],
  },

  work: {
    title: "Available Work",
    description:
      "A simple community space where people can advertise support opportunities and availability.",
    examples: [
      "Advertise available support work",
      "Share support-worker availability",
      "Find short-term or ongoing opportunities",
      "Connect before exchanging private details",
    ],
  },

  circles: {
    title: "Circles of Support",
    description:
      "Build and manage a trusted group of people around a participant, family, project or shared goal.",
    examples: [
      "Invite trusted people",
      "Define roles and relationships",
      "See who is part of the circle",
      "Connect the circle to shared planning",
    ],
  },

  profile: {
    title: "Your Community Profile",
    description:
      "Create a respectful profile that helps others understand who you are, what you offer and what you are looking for.",
    examples: [
      "Participant and family profiles",
      "Support-worker profiles",
      "Provider and professional profiles",
      "Community-member profiles",
    ],
  },
};

export default function ConnectionsPage() {
  const [activeArea, setActiveArea] =
    useState<ConnectionArea | null>(null);

  const selectedArea = activeArea
    ? connectionAreas[activeArea]
    : null;

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#edf3e9_0%,#f8f2e8_55%,#eadac5_100%)] px-4 pb-12 pt-5 text-[#40352c] sm:px-8 sm:pt-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link
          href="/market"
          aria-label="Return to the Smiling Monad Market"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#7c6a58]/25 bg-white/70 text-xl shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          ←
        </Link>

        <div className="min-w-0 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#7d715f] sm:text-xs">
            The Smiling Monad Market
          </p>

          <h1 className="mt-1 font-serif text-2xl sm:text-4xl">
            Connections Centre
          </h1>
        </div>

        <Link
          href="/office"
          className="rounded-full border border-[#7c6a58]/25 bg-white/70 px-4 py-2 text-sm shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          Space
        </Link>
      </header>

      <section className="mx-auto mt-8 w-full max-w-6xl rounded-[32px] border border-white/70 bg-white/55 p-5 shadow-[0_24px_70px_rgba(78,60,40,0.12)] backdrop-blur-xl sm:mt-12 sm:p-9">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-2xl leading-tight sm:text-4xl">
            Find the right people. Build trusted
            relationships. Grow stronger circles.
          </p>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#695d51]">
            The Connections Centre helps people meet
            safely and thoughtfully. It does not decide
            who belongs in your life or support team.
            It gives you a calm place to explore,
            communicate and make informed choices.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {(
            Object.entries(
              connectionAreas,
            ) as Array<
              [ConnectionArea, AreaDetails]
            >
          ).map(([key, area]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setActiveArea(key)
              }
              className="group min-h-44 rounded-[24px] border border-[#d9cbb9] bg-[rgba(255,251,244,0.82)] p-6 text-left shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#7d654f]/20"
            >
              <p className="font-serif text-2xl">
                {area.title}
              </p>

              <p className="mt-3 leading-7 text-[#706255]">
                {area.description}
              </p>

              <p className="mt-5 text-sm font-semibold text-[#765943]">
                Open area →
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-[24px] border border-[#d6c6b2] bg-[#efe4d4]/75 p-5 sm:p-7">
          <p className="font-serif text-xl">
            Safe community connections
          </p>

          <p className="mt-3 leading-7 text-[#6c5e51]">
            Public profiles and posts should be reviewed
            before becoming visible. Private contact
            details should only be shared after both
            people choose to connect. Kimi can help users
            prepare profiles, compare options and build
            Circles of Support without making decisions
            for them.
          </p>
        </div>
      </section>

      {selectedArea && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <section className="relative w-full max-w-xl rounded-[28px] border border-[#d9c9b4] bg-[#fffaf2] p-6 shadow-[0_30px_80px_rgba(35,24,15,0.4)] sm:p-8">
            <button
              type="button"
              onClick={() =>
                setActiveArea(null)
              }
              aria-label="Close area"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eee2d2] text-xl transition hover:bg-[#e4d4bf]"
            >
              ×
            </button>

            <h2 className="pr-12 font-serif text-3xl">
              {selectedArea.title}
            </h2>

            <p className="mt-4 leading-7 text-[#6d5e51]">
              {selectedArea.description}
            </p>

            <div className="mt-6 space-y-3">
              {selectedArea.examples.map(
                (example) => (
                  <div
                    key={example}
                    className="rounded-[16px] border border-[#e0d3c3] bg-[#f6eee2] px-4 py-3"
                  >
                    {example}
                  </div>
                ),
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setActiveArea(null)
              }
              className="mt-7 w-full rounded-full bg-[#60432f] px-5 py-3 font-medium text-white transition hover:bg-[#4f3728]"
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  );
}