"use client";

import type { SmilingMonadIntent } from "@/lib/intent/intent-engine";

type DeskTaskObjectProps = {
  intent: SmilingMonadIntent;
  open: boolean;
  onOpen: () => void;
};

function getFolderLabel(
  intent: SmilingMonadIntent
): string {
  switch (intent.kind) {
    case "report":
      return "REPORTS";
    case "correspondence":
      return "CORRESPONDENCE";
    case "planning":
      return "PLANNING";
    case "meeting":
      return "NOTES";
    case "files":
      return "FILES";
    case "research":
      return "RESEARCH";
    case "wellbeing":
      return "WELLBEING";
    default:
      return "DOCUMENTS";
  }
}

export default function DeskTaskObject({
  intent,
  open,
  onOpen,
}: DeskTaskObjectProps) {
  const label = getFolderLabel(intent);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${open ? "Close" : "Open"} ${label} folder`}
      className="group relative h-24 w-36 focus:outline-none sm:h-28 sm:w-44"
    >
      <div
        className={`absolute inset-x-0 bottom-0 h-[72%] rounded-md border border-[#8b6239]/35 bg-[#bd8950] shadow-[0_14px_24px_rgba(58,39,22,0.28)] transition duration-300 ${
          open
            ? "translate-y-1 rotate-[1deg]"
            : "group-hover:-translate-y-1"
        }`}
      />

      <div
        className={`absolute left-2 top-3 h-7 w-20 rounded-t-md border border-b-0 border-[#9b6e42]/35 bg-[#cf9b60] transition duration-300 sm:w-24 ${
          open
            ? "-translate-y-1"
            : ""
        }`}
      />

      <div
        className={`absolute inset-x-2 bottom-2 h-[64%] origin-bottom rounded-md border border-[#9a6b3f]/35 bg-[#d3a06a] shadow-sm transition duration-300 ${
          open
            ? "-translate-y-5 rotate-[-7deg]"
            : ""
        }`}
      >
        <div className="absolute inset-x-4 top-4 rounded-sm bg-[#f4eadc]/92 px-3 py-2 text-center shadow-sm">
          <p className="text-[9px] font-semibold tracking-[0.18em] text-[#5a3c25] sm:text-[10px]">
            {label}
          </p>
        </div>
      </div>
    </button>
  );
}