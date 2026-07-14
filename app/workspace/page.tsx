"use client";

import { useRouter } from "next/navigation";

export default function WorkspacePage() {
  const router = useRouter();

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#e7ded2] text-[#211d19]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.92),rgba(255,255,255,0)_42%),linear-gradient(180deg,#f4efe8_0%,#e8ded1_58%,#d9c8b5_100%)]" />

      <div className="absolute inset-x-0 bottom-0 h-[43%] bg-[linear-gradient(180deg,rgba(174,135,96,0.05),rgba(128,88,54,0.18)),repeating-linear-gradient(90deg,rgba(98,67,43,0.06)_0,rgba(98,67,43,0.06)_1px,transparent_1px,transparent_110px)]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() => router.push("/office")}
          className="rounded-full bg-[#3b2415]/90 px-5 py-3 text-base font-medium text-white shadow-xl backdrop-blur-md transition hover:bg-[#2d1a0e] focus:outline-none focus:ring-4 focus:ring-white/50"
        >
          Back to Office
        </button>

        <div className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm text-[#64584e] shadow-lg backdrop-blur-md">
          Temporary Workspace
        </div>
      </header>

      <section className="relative z-10 flex min-h-dvh items-center justify-center px-4 pb-24 pt-24 sm:px-8">
        <div className="flex min-h-[58dvh] w-full max-w-6xl items-center justify-center rounded-[2.25rem] border border-white/50 bg-white/18 shadow-[0_30px_80px_rgba(77,52,31,0.12)] backdrop-blur-[2px]">
          <div className="max-w-md px-6 text-center">
            <p className="text-sm uppercase tracking-[0.18em] text-[#85776b]">
              Workspace
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#332a23] sm:text-4xl">
              Your work will appear here.
            </h1>

            <p className="mt-4 text-base leading-7 text-[#6f6257] sm:text-lg">
              Conversation, files, drafts and tools will remain temporary until
              you choose to save them.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}