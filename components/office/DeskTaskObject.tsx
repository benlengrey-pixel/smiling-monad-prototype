"use client";

import type { SmilingMonadIntent } from "@/lib/intent/intent-engine";

type DeskTaskObjectProps = {
  intent: SmilingMonadIntent;
  open: boolean;
  onOpen: () => void;
};

const folderLabels: Record<string, string> = {
  report: "REPORTS",
  correspondence: "CORRESPONDENCE",
  planning: "PLANNING",
  meeting: "NOTES",
  files: "FILES",
  research: "RESEARCH",
  wellbeing: "WELLBEING",
};

function getFolderLabel(intent: SmilingMonadIntent): string {
  const kind = String(intent.kind);
  return folderLabels[kind] ?? "DOCUMENTS";
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
      aria-label={`${open ? "Close" : "Open"} ${label} leather folder`}
      className="group relative h-24 w-36 border-0 bg-transparent p-0 focus:outline-none sm:h-28 sm:w-44"
    >
      <div
        className={`absolute bottom-[-0.35rem] left-[7%] h-[30%] w-[90%] rounded-[50%] bg-black/30 blur-md transition-all duration-500 ${
          open
            ? "translate-y-1 scale-x-110 opacity-70"
            : "opacity-55"
        }`}
      />

      <div
        className={`absolute inset-x-0 bottom-0 h-[76%] overflow-hidden rounded-[0.55rem] border border-[#3a2114] bg-gradient-to-br from-[#795033] via-[#55331f] to-[#2f1a10] shadow-[0_15px_24px_rgba(36,20,12,0.45),inset_0_1px_1px_rgba(255,225,178,0.18)] transition-all duration-500 ${
          open
            ? "translate-y-1 rotate-[1deg]"
            : "group-hover:-translate-y-1"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,220,168,0.28)_0,transparent_17%),radial-gradient(circle_at_78%_74%,rgba(25,12,7,0.52)_0,transparent_24%),linear-gradient(118deg,transparent_25%,rgba(255,255,255,0.07)_38%,transparent_52%)] opacity-40" />

        <div className="absolute inset-[0.28rem] rounded-[0.38rem] border border-dashed border-[#b98b5d]/45" />

        <div className="absolute bottom-1 left-4 right-4 h-px bg-[#1e100a]/60" />
      </div>

      <div
        className={`absolute left-3 top-2 h-8 w-[55%] overflow-hidden rounded-t-[0.5rem] border border-b-0 border-[#3a2114] bg-gradient-to-br from-[#805739] via-[#603c25] to-[#412517] shadow-[inset_0_1px_1px_rgba(255,224,180,0.18)] transition-all duration-500 ${
          open ? "-translate-y-1" : ""
        }`}
      >
        <div className="absolute inset-x-2 bottom-1 border-b border-dashed border-[#c09362]/35" />
      </div>

      <div
        className={`absolute bottom-3 left-[9%] h-[62%] w-[82%] origin-bottom rounded-[0.15rem] border border-[#c9bca8] bg-[#eee7dc] shadow-[0_3px_7px_rgba(29,17,10,0.25)] transition-all duration-500 ${
          open
            ? "-translate-y-7 rotate-[-4deg]"
            : "-translate-y-1"
        }`}
      >
        <div className="absolute left-[12%] right-[12%] top-[20%] h-px bg-[#b9aa96]" />
        <div className="absolute left-[12%] right-[20%] top-[34%] h-px bg-[#c7b9a6]" />
        <div className="absolute left-[12%] right-[15%] top-[48%] h-px bg-[#c7b9a6]" />
        <div className="absolute left-[12%] right-[25%] top-[62%] h-px bg-[#c7b9a6]" />
      </div>

      <div
        className="absolute inset-x-1 bottom-1 h-[65%] overflow-hidden rounded-[0.55rem] border border-[#351d11] bg-gradient-to-br from-[#70472c] via-[#4c2c1b] to-[#2d180e] shadow-[0_8px_14px_rgba(30,16,9,0.38),inset_0_1px_1px_rgba(255,222,174,0.16)] transition-transform duration-500"
        style={{
          transformOrigin: "bottom center",
          transform: open
            ? "translateY(0.75rem) perspective(350px) rotateX(52deg) scaleY(0.82)"
            : "none",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(244,196,135,0.22)_0,transparent_15%),radial-gradient(circle_at_85%_72%,rgba(18,8,5,0.5)_0,transparent_25%),linear-gradient(132deg,transparent_18%,rgba(255,255,255,0.06)_29%,transparent_43%,rgba(0,0,0,0.12)_61%,transparent_77%)] opacity-50" />

        <div className="absolute inset-[0.28rem] rounded-[0.38rem] border border-dashed border-[#b98b5d]/45" />

        <div className="absolute left-[14%] top-[18%] h-px w-[28%] rotate-[-8deg] bg-[#2a160d]/45" />
        <div className="absolute right-[9%] top-[28%] h-px w-[22%] rotate-[12deg] bg-[#b27d4c]/25" />
        <div className="absolute bottom-[18%] left-[22%] h-px w-[48%] rotate-[2deg] bg-[#25130b]/35" />

        <div className="absolute left-1/2 top-[20%] w-[72%] -translate-x-1/2 rounded-[0.18rem] border border-[#5b3c19] bg-gradient-to-b from-[#c49a55] via-[#96703a] to-[#6f4d25] p-[0.16rem] shadow-[0_2px_4px_rgba(20,10,5,0.4),inset_0_1px_1px_rgba(255,232,175,0.45)]">
          <div className="relative rounded-[0.1rem] border border-[#d8bc82]/50 bg-[#e7dcc7] px-2 py-1.5 text-center shadow-inner">
            <span className="absolute left-[0.2rem] top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[#60451f] shadow-[inset_0_1px_1px_rgba(255,220,155,0.4)]" />

            <span className="absolute right-[0.2rem] top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[#60451f] shadow-[inset_0_1px_1px_rgba(255,220,155,0.4)]" />

            <p className="truncate px-1 font-serif text-[8px] font-bold tracking-[0.16em] text-[#3e2b1d] sm:text-[9px]">
              {label}
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-5 w-6 rounded-tr-full bg-[#241209]/20" />
        <div className="absolute bottom-0 right-0 h-5 w-6 rounded-tl-full bg-[#241209]/25" />
      </div>
    </button>
  );
}