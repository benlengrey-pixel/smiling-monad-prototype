"use client";

import type { SmilingMonadIntent } from "@/lib/intent/intent-engine";

type DeskTaskObjectProps = {
  intent: SmilingMonadIntent;
  onOpen: () => void;
};

type DeskObjectType =
  | "report"
  | "notes"
  | "planner"
  | "headphones"
  | "mat"
  | "book";

function getDeskObjectType(
  intent: SmilingMonadIntent
): DeskObjectType {
  const request = intent.originalRequest.toLowerCase();

  if (
    intent.kind === "report" ||
    intent.kind === "correspondence" ||
    intent.kind === "files"
  ) {
    return "report";
  }

  if (intent.kind === "meeting") {
    return "notes";
  }

  if (intent.kind === "planning") {
    return "planner";
  }

  if (intent.kind === "wellbeing") {
    if (
      request.includes("music") ||
      request.includes("listen") ||
      request.includes("audio")
    ) {
      return "headphones";
    }

    return "mat";
  }

  if (
    intent.kind === "document" ||
    intent.kind === "research"
  ) {
    return "book";
  }

  return "book";
}

function getShortTitle(
  intent: SmilingMonadIntent
): string {
  switch (intent.kind) {
    case "report":
      return "SHIFT REPORT";
    case "correspondence":
      return "CORRESPONDENCE";
    case "meeting":
      return "NOTES";
    case "planning":
      return "PLANNING";
    case "research":
      return "RESEARCH";
    case "files":
      return "FILES";
    case "wellbeing":
      return intent.originalRequest
        .toLowerCase()
        .includes("music")
        ? "MUSIC"
        : "WELLBEING";
    case "document":
      return "DOCUMENT";
    default:
      return "CURRENT TASK";
  }
}

export default function DeskTaskObject({
  intent,
  onOpen,
}: DeskTaskObjectProps) {
  const objectType = getDeskObjectType(intent);
  const shortTitle = getShortTitle(intent);

  if (objectType === "report") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${intent.title}`}
        className="group relative h-36 w-28 focus:outline-none sm:h-40 sm:w-32"
      >
        <div className="absolute inset-x-2 bottom-1 top-3 rotate-[1deg] rounded-sm border border-[#8f7a63]/40 bg-[#f3eee4] shadow-[0_14px_22px_rgba(54,39,25,0.28)] transition duration-300 group-hover:-translate-y-2 group-hover:rotate-0">
          <div className="absolute left-1/2 top-[-0.45rem] h-4 w-8 -translate-x-1/2 rounded-b-sm rounded-t-md bg-[#c7b8a6] shadow-sm" />

          <div className="px-3 pt-5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[8px] uppercase tracking-[0.14em] text-[#7a6e62]">
                Draft
              </span>

              <span className="rounded-full bg-[#587259] px-1.5 py-0.5 text-[7px] font-semibold uppercase text-white">
                Ready
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-[10px] font-semibold uppercase leading-4 text-[#342c26]">
              {intent.title}
            </p>

            <div className="mt-3 space-y-2">
              <div className="h-px bg-[#cfc6bb]" />
              <div className="h-px bg-[#d9d1c8]" />
              <div className="h-px bg-[#d9d1c8]" />
              <div className="h-px bg-[#d9d1c8]" />
            </div>
          </div>
        </div>
      </button>
    );
  }

  if (objectType === "notes") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${intent.title}`}
        className="group relative h-32 w-28 focus:outline-none sm:h-36 sm:w-32"
      >
        <div className="absolute inset-1 rotate-[-2deg] rounded-md border border-[#8b7866]/35 bg-[#c8b49e] shadow-[0_14px_22px_rgba(52,38,25,0.28)] transition duration-300 group-hover:-translate-y-2 group-hover:rotate-0">
          <div className="absolute left-0 top-0 h-full w-3 rounded-l-md bg-[#a68f78]" />

          <div className="absolute -left-1 top-2 flex h-[calc(100%-1rem)] flex-col justify-between">
            {Array.from({ length: 8 }).map((_, index) => (
              <span
                key={index}
                className="block h-1.5 w-3 rounded-full bg-[#5f5145]"
              />
            ))}
          </div>

          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-2 h-6 w-6 rounded-full border border-[#5f5145]/60" />
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#4f4237]">
              NOTES
            </p>
          </div>
        </div>
      </button>
    );
  }

  if (objectType === "planner") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${intent.title}`}
        className="group relative h-32 w-28 focus:outline-none sm:h-36 sm:w-32"
      >
        <div className="absolute inset-1 rotate-[2deg] rounded-md border border-[#263b2d]/40 bg-[#2e4a37] shadow-[0_14px_22px_rgba(38,43,31,0.32)] transition duration-300 group-hover:-translate-y-2 group-hover:rotate-0">
          <div className="absolute inset-y-0 left-0 w-2 rounded-l-md bg-[#203527]" />

          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 h-7 w-7 rounded-full border border-[#d4b46f]/70" />

            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#e7cc8f]">
              PLANNING
            </p>
          </div>
        </div>

        <div className="absolute bottom-2 right-0 h-2 w-16 rotate-[-38deg] rounded-full bg-[#171717] shadow-md transition duration-300 group-hover:-translate-y-2">
          <div className="absolute right-0 top-0 h-2 w-3 rounded-r-full bg-[#b98a45]" />
        </div>
      </button>
    );
  }

  if (objectType === "headphones") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${intent.title}`}
        className="group relative h-28 w-28 focus:outline-none"
      >
        <div className="absolute left-1/2 top-1 h-20 w-20 -translate-x-1/2 rounded-full border-[8px] border-[#2d2925] shadow-sm transition duration-300 group-hover:-translate-y-2" />
        <div className="absolute bottom-2 left-2 h-12 w-6 rounded-xl bg-[#403b35] shadow-[0_8px_14px_rgba(30,25,20,0.28)]" />
        <div className="absolute bottom-2 right-2 h-12 w-6 rounded-xl bg-[#403b35] shadow-[0_8px_14px_rgba(30,25,20,0.28)]" />

        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium tracking-wide text-[#4c4036]">
          MUSIC
        </span>
      </button>
    );
  }

  if (objectType === "mat") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${intent.title}`}
        className="group relative h-24 w-36 focus:outline-none"
      >
        <div className="absolute inset-x-1 bottom-3 h-12 rounded-full bg-[#8d7a65] shadow-[0_12px_18px_rgba(54,41,31,0.28)] transition duration-300 group-hover:-translate-y-2" />
        <div className="absolute right-2 top-4 h-12 w-12 rounded-full border-4 border-[#6f5e4d] bg-[#a1907c]" />

        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium tracking-wide text-[#4c4036]">
          WELLBEING
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${intent.title}`}
      className="group relative h-32 w-28 focus:outline-none sm:h-36 sm:w-32"
    >
      <div className="absolute inset-1 rotate-[-2deg] rounded-md bg-[#6e523f] shadow-[0_14px_22px_rgba(47,31,21,0.3)] transition duration-300 group-hover:-translate-y-2 group-hover:rotate-0" />

      <div className="absolute inset-x-3 bottom-4 top-3 rotate-[1deg] rounded-sm border border-[#8d6c53]/40 bg-[#866449] shadow-[0_8px_14px_rgba(47,31,21,0.2)]">
        <div className="flex h-full flex-col items-center justify-center px-3 text-center">
          <div className="mb-3 h-7 w-7 rounded-full border border-[#e6d5c6]/60" />

          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#f2e8df]">
            {shortTitle}
          </p>
        </div>
      </div>
    </button>
  );
}