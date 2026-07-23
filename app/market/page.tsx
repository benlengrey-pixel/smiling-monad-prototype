"use client";

import Link from "next/link";

type MarketCardProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  children?: React.ReactNode;
};

function MarketCard({
  title,
  description,
  primaryHref,
  primaryLabel,
  children,
}: MarketCardProps) {
  return (
    <section className="rounded-[26px] border border-white/35 bg-[rgba(35,31,25,0.72)] p-5 text-white shadow-[0_20px_45px_rgba(22,16,11,0.28)] backdrop-blur-xl sm:p-6">
      <h2 className="font-serif text-2xl sm:text-3xl">
        {title}
      </h2>

      <p className="mt-3 leading-7 text-white/78">
        {description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={primaryHref}
          className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#49362a] transition hover:-translate-y-0.5 hover:bg-[#fffaf2] focus:outline-none focus:ring-4 focus:ring-white/50"
        >
          {primaryLabel}
        </Link>

        {children}
      </div>
    </section>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border border-white/35 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/40"
    >
      {children}
    </Link>
  );
}

export default function MarketPage() {
  return (
    <main className="relative min-h-[100svh] w-full overflow-y-auto bg-[#526644] px-4 pb-8 pt-5 text-white sm:px-7 sm:pb-10 sm:pt-7">
      <img
        src="/smiling-monad-community-market.png"
        alt="The Smiling Monad Community Market"
        className="fixed inset-0 h-full w-full object-cover object-center"
      />

      <div className="fixed inset-0 bg-[linear-gradient(180deg,rgba(16,25,15,0.24)_0%,rgba(15,17,13,0.18)_40%,rgba(20,14,10,0.72)_100%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-start justify-between gap-4">
        <Link
          href="/office"
          aria-label="Return to the Smiling Monad Space"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/35 text-xl text-white shadow-lg backdrop-blur-md transition hover:bg-black/50 focus:outline-none focus:ring-4 focus:ring-white/65"
        >
          ←
        </Link>

        <div className="min-w-0 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/75 sm:text-xs">
            The Smiling Monad
          </p>

          <h1 className="mt-1 font-serif text-3xl drop-shadow-md sm:text-5xl">
            Community Market
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/82 sm:text-base">
            Choose a place below. Every entrance is now clearly labelled and works on phone or desktop.
          </p>
        </div>

        <Link
          href="/circle"
          className="shrink-0 rounded-full border border-white/40 bg-black/35 px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur-md transition hover:bg-black/50 focus:outline-none focus:ring-4 focus:ring-white/65"
        >
          My Circles
        </Link>
      </header>

      <section className="relative z-10 mx-auto mt-[34svh] grid w-full max-w-6xl gap-4 lg:mt-[42svh] lg:grid-cols-3">
        <MarketCard
          title="Community Centre"
          description="Community posts, people, Circles, service connections and the moderated Services Directory."
          primaryHref="/community"
          primaryLabel="Open Community"
        >
          <SecondaryLink href="/community/services">
            Services Directory
          </SecondaryLink>

          <SecondaryLink href="/connections">
            People & Circles
          </SecondaryLink>
        </MarketCard>

        <MarketCard
          title="Wellbeing Centre"
          description="A calm place for relaxation, meditation, yoga, music and gentle activities."
          primaryHref="/wellbeing"
          primaryLabel="Open Wellbeing"
        >
          <SecondaryLink href="/wellbeing?activity=meditate">
            Meditation
          </SecondaryLink>
        </MarketCard>

        <MarketCard
          title="Training Centre"
          description="Learning, worker pathways, participant-specific training and practical resources."
          primaryHref="/school"
          primaryLabel="Open Training"
        >
          <SecondaryLink href="/school?panel=worker-pathway">
            Worker pathway
          </SecondaryLink>
        </MarketCard>
      </section>

      <p className="relative z-10 mx-auto mt-5 max-w-6xl rounded-[18px] border border-white/25 bg-black/28 px-4 py-3 text-center text-sm leading-6 text-white/80 backdrop-blur-md">
        The permanent Menu on the left also gives direct access to My Circles, Community and the Services Directory from throughout the app.
      </p>
    </main>
  );
}