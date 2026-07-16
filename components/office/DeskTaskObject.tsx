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
  return folderLabels[String(intent.kind)] ?? "DOCUMENTS";
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
      className="group relative h-16 w-28 border-0 bg-transparent p-0 focus:outline-none sm:h-24 sm:w-40"
    >
      {/* Soft shadow on desk */}
      <div
        className={`absolute bottom-0 left-[8%] h-[20%] w-[84%] rounded-[50%] bg-black/25 blur-md transition-all duration-500 ${
          open ? "scale-x-110 opacity-70" : "opacity-45"
        }`}
      />

      {/* Back cover */}
      <div
        className={`absolute bottom-[8%] left-[3%] h-[66%] w-[94%] overflow-hidden rounded-[0.45rem] border border-[#3d2417] bg-gradient-to-br from-[#765039] via-[#51301f] to-[#301a10] shadow-[0_6px_12px_rgba(35,18,10,0.35),inset_0_1px_1px_rgba(255,225,180,0.15)] transition-all duration-500 ${
          open ? "-translate-y-2 rotate-[-2deg]" : ""
        }`}
      >
        <div className="absolute inset-[0.22rem] rounded-[0.3rem] border border-dashed border-[#b9895e]/35" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(255,220,170,0.18),transparent_19%),radial-gradient(circle_at_82%_74%,rgba(20,10,5,0.38),transparent_25%)] opacity-70" />
      </div>

      {/* Small leather tab */}
      <div
        className={`absolute left-[10%] top-[10%] h-[22%] w-[38%] rounded-t-[0.4rem] border border-b-0 border-[#3d2417] bg-gradient-to-br from-[#7d563d] via-[#5a3724] to-[#3b2115] transition-all duration-500 ${
          open ? "-translate-y-1" : ""
        }`}
      />

      {/* Paper inside */}
      <div
        className={`absolute bottom-[15%] left-[9%] h-[54%] w-[82%] rounded-[0.18rem] border border-[#cbbda8] bg-[#eee7dc] shadow-[0_2px_5px_rgba(30,17,10,0.2)] transition-all duration-500 ${
          open
            ? "-translate-y-5 rotate-[-3deg]"
            : "-translate-y-[2px]"
        }`}
      >
        <div className="absolute left-[12%] right-[12%] top-[24%] h-px bg-[#c0b19d]" />
        <div className="absolute left-[12%] right-[20%] top-[42%] h-px bg-[#cabdaa]" />
        <div className="absolute left-[12%] right-[16%] top-[60%] h-px bg-[#cabdaa]" />
      </div>

      {/* Front cover */}
      <div
        className="absolute bottom-[6%] left-[4%] h-[58%] w-[92%] overflow-hidden rounded-[0.48rem] border border-[#351d12] bg-gradient-to-br from-[#704a32] via-[#4d2d1d] to-[#2e180f] shadow-[0_5px_10px_rgba(30,15,8,0.35),inset_0_1px_1px_rgba(255,225,180,0.14)] transition-transform duration-500"
        style={{
          transformOrigin: "bottom center",
          transform: open
            ? "translateY(0.55rem) perspective(300px) rotateX(58deg)"
            : "perspective(300px) rotateX(8deg)",
        }}
      >
        <div className="absolute inset-[0.22rem] rounded-[0.32rem] border border-dashed border-[#b9895e]/38" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(245,200,145,0.16),transparent_18%),radial-gradient(circle_at_84%_72%,rgba(18,8,4,0.38),transparent_27%)] opacity-80" />

        {/* Small aged label */}
        <div className="absolute left-1/2 top-[26%] w-[62%] -translate-x-1/2 rounded-[0.14rem] border border-[#60431f] bg-gradient-to-b from-[#b98b4e] to-[#79552c] p-[2px] shadow-[0_1px_3px_rgba(20,10,5,0.35)]">
          <div className="rounded-[0.08rem] bg-[#e7ddca] px-1.5 py-1 text-center">
            <p className="truncate font-serif text-[6px] font-semibold tracking-[0.18em] text-[#443022] sm:text-[8px]">
              {label}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}