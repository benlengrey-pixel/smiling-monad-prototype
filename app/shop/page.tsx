"use client";

import Link from "next/link";
import { useState } from "react";

type ShopArea =
  | "resources"
  | "templates"
  | "training"
  | "merchandise"
  | "digital";

type ShopAreaDetails = {
  title: string;
  description: string;
  products: string[];
};

const shopAreas: Record<
  ShopArea,
  ShopAreaDetails
> = {
  resources: {
    title: "Practical Resources",
    description:
      "Clear, useful resources that help participants, families, workers and providers communicate and stay organised.",
    products: [
      "Communication guides",
      "Circle of Support resources",
      "Participant information packs",
      "Support-worker guides",
      "Planning and reflection tools",
    ],
  },

  templates: {
    title: "Templates & Documents",
    description:
      "Ready-to-use templates that reduce administration while remaining flexible enough for individual people and situations.",
    products: [
      "Shift-report templates",
      "Meeting templates",
      "Support agreements",
      "Induction documents",
      "Planning and review documents",
    ],
  },

  training: {
    title: "Training Packages",
    description:
      "Practical learning packages for individuals, teams and organisations that want to improve the quality of support.",
    products: [
      "Communication training package",
      "Behaviour as communication package",
      "Circle-building package",
      "Support-worker induction package",
      "Team reflection package",
    ],
  },

  merchandise: {
    title: "Smiling Monad Merchandise",
    description:
      "Simple products that share the Smiling Monad identity, philosophy and sense of community.",
    products: [
      "T-shirts and clothing",
      "Posters and prints",
      "Notebooks and journals",
      "Community gifts",
      "Smiling Monad logo products",
    ],
  },

  digital: {
    title: "Digital Tools",
    description:
      "Digital resources designed to save time, reduce repetition and support easier collaboration.",
    products: [
      "Interactive forms",
      "Document generators",
      "Digital planning tools",
      "Communication resources",
      "Companion-assisted templates",
    ],
  },
};

export default function ShopPage() {
  const [activeArea, setActiveArea] =
    useState<ShopArea | null>(null);

  const selectedArea = activeArea
    ? shopAreas[activeArea]
    : null;

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#edf1e7_0%,#f8f1e5_52%,#ead6bc_100%)] px-4 pb-14 pt-5 text-[#40352c] sm:px-8 sm:pt-8">
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
            Smiling Monad Shop
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
            Useful things that make life easier.
          </p>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#695d51]">
            The Smiling Monad Shop brings together
            practical resources, training, templates,
            digital tools and community products. The
            focus is on saving time and reducing
            unnecessary administration.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            Object.entries(
              shopAreas,
            ) as Array<
              [
                ShopArea,
                ShopAreaDetails,
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
                Browse area →
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-[24px] border border-[#d6c6b2] bg-[#efe4d4]/75 p-5 sm:p-7">
            <p className="font-serif text-2xl">
              Buy only what is useful
            </p>

            <p className="mt-3 leading-7 text-[#6c5e51]">
              The Shop should not create dependency or
              lock people into unnecessary subscriptions.
              Resources should solve clear problems and
              remain useful after purchase.
            </p>
          </section>

          <section className="rounded-[24px] border border-[#d6c6b2] bg-[#efe4d4]/75 p-5 sm:p-7">
            <p className="font-serif text-2xl">
              Kimi can help you choose
            </p>

            <p className="mt-3 leading-7 text-[#6c5e51]">
              Kimi can explain products, help users
              compare options and identify what may be
              useful without pressuring anyone to buy.
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
              aria-label="Close shop area"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eee2d2] text-xl transition hover:bg-[#e4d4bf]"
            >
              ×
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#846e58]">
              Shop area
            </p>

            <h2 className="mt-3 pr-12 font-serif text-3xl">
              {selectedArea.title}
            </h2>

            <p className="mt-4 leading-7 text-[#6c5e51]">
              {selectedArea.description}
            </p>

            <div className="mt-6 space-y-3">
              {selectedArea.products.map(
                (product) => (
                  <button
                    key={product}
                    type="button"
                    className="block w-full rounded-[16px] border border-[#dfd1bf] bg-[#f6eee2] px-4 py-3 text-left transition hover:bg-white"
                  >
                    {product}
                  </button>
                ),
              )}
            </div>

            <p className="mt-6 rounded-[16px] border border-[#d9c9b5] bg-[#efe3d3] px-4 py-3 text-sm leading-6 text-[#6b5c4f]">
              Product pages, pricing and checkout will
              be connected later. This page establishes
              the permanent Shop structure first.
            </p>

            <button
              type="button"
              onClick={() =>
                setActiveArea(null)
              }
              className="mt-7 w-full rounded-full bg-[#60432f] px-5 py-3 font-medium text-white transition hover:bg-[#4f3728]"
            >
              Return to the Shop
            </button>
          </section>
        </div>
      )}
    </main>
  );
}