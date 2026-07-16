"use client";

import type { SmilingMonadIntent } from "@/lib/intent/intent-engine";

type DeskTaskObjectProps = {
  intent: SmilingMonadIntent;
  previewOpen: boolean;
  onTogglePreview: () => void;
};

function getFolderLabel(intent: SmilingMonadIntent): string {
  switch (intent.kind) {
    case "report":
      return "REPORTS";
    case "document":
      return "DOCUMENTS";
    case "correspondence":
      return "MAIL";
    case "planning":
      return "PLANS";
    case "research":
      return "RESEARCH";
    case "meeting":
      return "MEETINGS";
    case "files":
      return "FILES";
    case "wellbeing":
      return "WELLBEING";
    default:
      return "TASKS";
  }
}

export default function DeskTaskObject({
  intent,
  previewOpen,
  onTogglePreview,
}: DeskTaskObjectProps) {
  const label = getFolderLabel(intent);

  return (
    <button
      type="button"
      onClick={onTogglePreview}
      className="group relative h-[112px] w-[170px] cursor-pointer select-none text-left sm:h-[140px] sm:w-[220px]"
      aria-label={`Open ${label.toLowerCase()} folder preview`}
    >
      <div className="absolute left-[10px] top-[18px] h-[86px] w-[150px] rounded-[18px] bg-[#c69458] shadow-[0_14px_24px_rgba(74,46,18,0.22)] sm:left-[14px] sm:top-[20px] sm:h-[108px] sm:w-[192px]" />

      <div className="absolute left-[18px] top-[4px] h-[28px] w-[64px] rounded-t-[14px] rounded-br-[8px] bg-[#d7a56a] shadow-[0_4px_10px_rgba(74,46,18,0.12)] sm:left-[24px] sm:h-[34px] sm:w-[82px]" />

      <div className="absolute inset-x-0 bottom-0 top-[16px] rounded-[20px] border border-[#bb8a55] bg-[#d8a76b] shadow-[0_18px_32px_rgba(74,46,18,0.24)] sm:top-[18px]">
        {previewOpen ? (
          <>
            <div className="absolute left-[18px] right-[18px] top-[18px] h-[58px] rounded-[10px] bg-[#f8f4eb] shadow-[0_5px_10px_rgba(0,0,0,0.08)] sm:left-[24px] sm:right-[24px] sm:top-[22px] sm:h-[72px]" />
            <div className="absolute left-[28px] right-[30px] top-[24px] h-[58px] rounded-[10px] bg-[#fffaf1] shadow-[0_6px_12px_rgba(0,0,0,0.08)] sm:left-[36px] sm:right-[36px] sm:top-[30px] sm:h-[74px]" />
            <div className="absolute inset-x-[8px] top-[10px] h-[44px] rounded-t-[18px] rounded-b-[10px] border border-[#c69562] bg-[#e3bb87] shadow-[0_8px_12px_rgba(74,46,18,0.14)] sm:inset-x-[10px] sm:top-[12px] sm:h-[52px]" />
          </>
        ) : (
          <>
            <div className="absolute left-[12px] right-[12px] top-[28px] h-[50px] rounded-[12px] bg-[#f8f1e4] shadow-[0_5px_10px_rgba(0,0,0,0.06)] sm:left-[16px] sm:right-[16px] sm:top-[34px] sm:h-[64px]" />
          </>
        )}

        <div className="absolute inset-x-[18px] bottom-[14px] h-[38px] rounded-[10px] border border-[#ccb89b] bg-[#f3eee4] shadow-[0_3px_6px_rgba(0,0,0,0.06)] sm:inset-x-[22px] sm:bottom-[16px] sm:h-[46px]">
          <div className="flex h-full items-center justify-center text-[11px] font-semibold tracking-[0.24em] text-[#6c5843] sm:text-[13px]">
            {label}
          </div>
        </div>
      </div>
    </button>
  );
}