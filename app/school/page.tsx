"use client";

import Link from "next/link";
import { useState } from "react";

type LearningArea =
  | "support"
  | "communication"
  | "behaviour"
  | "circles"
  | "development";

type LearningAreaDetails = {
  title: string;
  description: string;
  lessons: string[];
};

const learningAreas: Record<
  LearningArea,
  LearningAreaDetails
> = {
  support: {
    title: "Thoughtful Support Work",
    description:
      "Practical learning for support workers who want to provide reliable, respectful and person-centred support.",
    lessons: [
      "Understanding the whole person",
      "Building trust and consistency",
      "Supporting choice and control",
      "Professional boundaries",
      "Writing useful shift notes",
    ],
  },

  communication: {
    title: "Communication",
    description:
      "Learn how to understand communication in all its forms and reduce frustration, confusion and unnecessary conflict.",
    lessons: [
      "Communication beyond speech",
      "Visual communication systems",
      "Listening for meaning",
      "Supporting transitions",
      "Working with families and teams",
    ],
  },

  behaviour: {
    title: "Behaviour as Communication",
    description:
      "A compassionate approach to understanding behaviour, identifying unmet needs and supporting safer outcomes.",
    lessons: [
      "Looking beneath behaviour",
      "Recognising stress and overload",
      "Understanding triggers",
      "Reducing restrictive responses",
      "Building proactive support",
    ],
  },

  circles: {
    title: "Building Circles of Support",
    description:
      "Learn how to bring the right people together around a participant, family, project or shared goal.",
    lessons: [
      "Choosing trusted people",
      "Defining roles clearly",
      "Sharing information safely",
      "Running useful meetings",
      "Maintaining healthy relationships",
    ],
  },

  development: {
    title: "Personal & Professional Development",
    description:
      "Learning that supports reflection, wellbeing, confidence and long-term growth.",
    lessons: [
      "Reflective practice",
      "Preventing burnout",
      "Managing difficult conversations",
      "Values-led decision making",
      "Remembering why the work matters",
    ],
  },
};

export default function SchoolPage() {
  const [activeArea, setActiveArea] =
    useState<LearningArea | null>(null);

  const selectedArea = activeArea
    ? learningAreas[activeArea]
    : null;

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#e9f0e4_0%,#f8f1e6_54%,#ead7bd_100%)] px-4 pb-14 pt-5 text-[#40352c] sm:px-8 sm:pt-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link
          href="/market"
          aria-label="Return to the Smiling Monad Market"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#7c6a58]/25 bg-white/75 text-xl shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          ←
        </Link>

        <div className="min-w-0 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#7d715f] sm:text-xs">
            The Smiling Monad Market
          </p>

          <h1 className="mt-1 font-serif text-2xl sm:text-4xl">
            Smiling Monad School
          </h1>
        </div>

        <Link
          href="/office"
          className="rounded-full border border-[#7c6a58]/25 bg-white/75 px-4 py-2 text-sm shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          Space
        </Link>
      </header>

      <section className="mx-auto mt-8 w-full max-w-6xl rounded-[32px] border border-white/70 bg-white/60 p-5 shadow-[0_24px_70px_rgba(78,60,40,0.12)] backdrop-blur-xl sm:mt-12 sm:p-9">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-3xl leading-tight sm:text-5xl">
            Learn to support people well.
          </p>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#695d51]">
            The Smiling Monad School brings together
            practical skills, lived experience and a
            thoughtful approach to human support.
            Learning should help people become more
            capable, more confident and more connected.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            Object.entries(
              learningAreas,
            ) as Array<
              [
                LearningArea,
                LearningAreaDetails,
              ]
            >
          ).map(([key, area]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setActiveArea(key)
              }
              className="group min-h-52 rounded-[24px] border border-[#d9cbb9] bg-[rgba(255,251,244,0.84)] p-6 text-left shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#7d654f]/20"
            >
              <p className="font-serif text-2xl">
                {area.title}
              </p>

              <p className="mt-3 leading-7 text-[#706255]">
                {area.description}
              </p>

              <p className="mt-5 text-sm font-semibold text-[#765943]">
                View learning area →
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-[24px] border border-[#d6c6b2] bg-[#efe4d4]/75 p-5 sm:p-7">
            <p className="font-serif text-2xl">
              Learn at your own pace
            </p>

            <p className="mt-3 leading-7 text-[#6c5e51]">
              Courses can include short lessons,
              practical examples, reflection questions,
              downloadable resources and guided
              activities with Kimi.
            </p>
          </section>

          <section className="rounded-[24px] border border-[#d6c6b2] bg-[#efe4d4]/75 p-5 sm:p-7">
            <p className="font-serif text-2xl">
              Training for real situations
            </p>

            <p className="mt-3 leading-7 text-[#6c5e51]">
              The School should help people handle the
              situations they actually face—not just
              complete generic online modules.
            </p>
          </section>
        </div>
      </section>

      {selectedArea && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6">
          <section className="relative w-full max-w-xl rounded-[28px] border border-[#d8c7b1] bg-[#fffaf2] p-6 shadow-[0_30px_80px_rgba(35,24,15,0.42)] sm:p-8">
            <button
              type="button"
              onClick={() =>
                setActiveArea(null)
              }
              aria-label="Close learning area"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eee2d2] text-xl transition hover:bg-[#e4d4bf]"
            >
              ×
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#846e58]">
              Learning area
            </p>

            <h2 className="mt-3 pr-12 font-serif text-3xl">
              {selectedArea.title}
            </h2>

            <p className="mt-4 leading-7 text-[#6c5e51]">
              {selectedArea.description}
            </p>

            <div className="mt-6 space-y-3">
              {selectedArea.lessons.map(
                (lesson, index) => (
                  <button
                    key={lesson}
                    type="button"
                    className="flex w-full items-center gap-4 rounded-[16px] border border-[#dfd1bf] bg-[#f6eee2] px-4 py-3 text-left transition hover:bg-white"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#decdb8] text-sm font-semibold text-[#684d38]">
                      {index + 1}
                    </span>

                    <span>{lesson}</span>
                  </button>
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
              Return to the School
            </button>
          </section>
        </div>
      )}
    </main>
  );
}