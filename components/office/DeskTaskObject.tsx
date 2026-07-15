"use client";

import type { SmilingMonadIntent } from "@/lib/intent/intent-engine";

type DeskTaskObjectProps = {
  intent: SmilingMonadIntent;
  onOpen: () => void;
};

function getObjectType(
  intent: SmilingMonadIntent
):
  | "folder"
  | "book"
  | "notebook"
  | "planner"
  | "headphones"
  | "mat" {
  switch (intent.kind) {
    case "report":
    case "correspondence":
    case "files":
      return "folder";

    case "document":
    case "research":
      return "book";

    case "meeting":
      return "notebook";

    case "planning":
      return "planner";

    case "wellbeing":
      if (
        intent.originalRequest
          .toLowerCase()
          .includes("music")
      ) {
        return "headphones";
      }

      return "mat";

    default:
      return "book";
  }
}

function getLabel(
  intent: SmilingMonadIntent
): string {
  switch (intent.kind) {
    case "report":
      return "Report";

    case "correspondence":
      return "Letter";

    case "document":
      return "Document";

    case "planning":
      return "Planner";

    case "meeting":
      return "Notes";

    case "research":
      return "Research";

    case "files":
      return "Files";

    case "wellbeing":
      return intent.originalRequest
        .toLowerCase()
        .includes("music")
        ? "Music"
        : "Wellbeing";

    default:
      return "Task";
  }
}

export default function DeskTaskObject({
  intent,
  onOpen,
}: DeskTaskObjectProps) {
  const objectType = getObjectType(intent);
  const label = getLabel(intent);

  if (objectType === "headphones") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${intent.title}`}
        className="group relative h-24 w-24 focus:outline-none"
      >
        <div className="absolute left-1/2 top-1 h-16 w-16 -translate-x-1/2 rounded-full border-[7px] border-[#3d3027] transition group-hover:-translate-y-1" />

        <div className="absolute bottom-3 left-2 h-10 w-5 rounded-lg bg-[#4a392d] shadow-md" />
        <div className="absolute bottom-3 right-2 h-10 w-5 rounded-lg bg-[#4a392d] shadow-md" />

        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-[#4c3d31]">
          {label}
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
        className="group relative h-20 w-32 focus:outline-none"
      >
        <div className="absolute inset-x-1 bottom-3 h-10 rounded-full bg-[#86735e] shadow-[0_9px_14px_rgba(54,41,31,0.3)] transition group-hover:-translate-y-1" />

        <div className="absolute right-1 top-4 h-10 w-10 rounded-full border-4 border-[#6f5f4d] bg-[#9b8974]" />

        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-[#4c3d31]">
          {label}
        </span>
      </button>
    );
  }

  if (objectType === "folder") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${intent.title}`}
        className="group relative h-20 w-28 focus:outline-none"
      >
        <div className="absolute left-2 top-2 h-5 w-12 rounded-t-md bg-[#c79a5f]" />

        <div className="absolute inset-x-1 bottom-2 h-14 rounded-md border border-[#a97a42]/40 bg-[linear-gradient(155deg,#dfb878,#b98549)] shadow-[0_10px_16px_rgba(64,43,24,0.3)] transition group-hover:-translate-y-1">
          <div className="absolute inset-x-3 top-5 text-center text-[10px] font-semibold text-[#4f351e]">
            {label}
          </div>
        </div>
      </button>
    );
  }

  if (objectType === "notebook") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${intent.title}`}
        className="group relative h-20 w-20 focus:outline-none"
      >
        <div className="absolute inset-1 rounded-md bg-[#6f7a68] shadow-[0_10px_16px_rgba(42,48,39,0.3)] transition group-hover:-translate-y-1" />

        <div className="absolute left-2 top-2 h-16 w-1 bg-[#d5c9b6]" />

        <span className="absolute inset-x-2 top-8 text-center text-[10px] font-semibold text-[#f4eee4]">
          {label}
        </span>
      </button>
    );
  }

  if (objectType === "planner") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${intent.title}`}
        className="group relative h-20 w-24 focus:outline-none"
      >
        <div className="absolute inset-x-1 bottom-2 h-14 rounded-md bg-[#8b6d59] shadow-[0_10px_16px_rgba(58,40,30,0.3)] transition group-hover:-translate-y-1" />

        <div className="absolute left-3 right-3 top-4 h-1 rounded bg-[#d6c1aa]" />

        <span className="absolute inset-x-2 top-8 text-center text-[10px] font-semibold text-[#f6eee6]">
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${intent.title}`}
      className="group relative h-20 w-24 focus:outline-none"
    >
      <div className="absolute bottom-1 left-2 h-14 w-20 rotate-[-2deg] rounded-sm bg-[#6f4e37] shadow-[0_9px_15px_rgba(47,31,21,0.32)] transition group-hover:-translate-y-1" />

      <div className="absolute bottom-3 left-4 h-14 w-20 rotate-[2deg] rounded-sm border border-[#79583f]/40 bg-[#8a6547] shadow-[0_8px_13px_rgba(47,31,21,0.25)]" />

      <span className="absolute inset-x-3 top-8 z-10 text-center text-[10px] font-semibold text-[#f6eee5]">
        {label}
      </span>
    </button>
  );
}