"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";

import CompanionPresence from "@/components/companion/CompanionPresence";
import type {
  CompanionAvatarExpression,
  CompanionAvatarStatus,
} from "@/lib/companion/avatar/types";
import OfficeBackground from "./OfficeBackground";
import OfficeBackButton from "./OfficeBackButton";

type OfficeEnvironmentProps = {
  children: ReactNode;
  avatarStatus?: CompanionAvatarStatus;
  avatarExpression?: CompanionAvatarExpression;
  onOfficeActivated?: () => void;
};

export default function OfficeEnvironment({
  children,
  avatarStatus = "idle",
  avatarExpression = "warm",
  onOfficeActivated,
}: OfficeEnvironmentProps) {
  const [officeActivated, setOfficeActivated] =
    useState(false);

  function activateOffice() {
    if (officeActivated) {
      return;
    }

    setOfficeActivated(true);
    onOfficeActivated?.();
  }

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#d9c3a6]">
      <OfficeBackground />

      {/* Poster behind Kimi: Circle of Support Meeting Room */}
      <Link
        href="/circle"
        aria-label="Enter the Circle of Support Meeting Room"
        title="Circle of Support Meeting Room"
        className="
          group
          absolute
          right-[12%]
          top-[22%]
          z-30
          h-[25%]
          w-[25%]
          cursor-pointer
          rounded-[10px]
          outline-none
          transition
          focus-visible:ring-4
          focus-visible:ring-[rgba(255,248,230,0.8)]
          sm:right-[17%]
          sm:top-[20%]
          sm:h-[30%]
          sm:w-[17%]
        "
      >
        <span
          className="
            pointer-events-none
            absolute
            inset-x-0
            top-0
            h-[76%]
            rounded-[10px]
            border
            border-[rgba(255,248,230,0.18)]
            bg-[rgba(255,248,230,0.025)]
            transition
            group-hover:border-[rgba(255,248,230,0.82)]
            group-hover:bg-[rgba(255,248,230,0.08)]
            group-hover:shadow-[0_0_28px_rgba(255,244,215,0.45)]
            group-focus-visible:border-[rgba(255,248,230,0.82)]
            group-focus-visible:shadow-[0_0_28px_rgba(255,244,215,0.45)]
          "
        />

        <span
          className="
            pointer-events-none
            absolute
            bottom-0
            left-1/2
            w-[92%]
            -translate-x-1/2
            rounded-[12px]
            border
            border-[rgba(91,65,43,0.28)]
            bg-[rgba(250,241,222,0.9)]
            px-2
            py-1.5
            text-center
            font-serif
            text-[10px]
            font-semibold
            leading-tight
            tracking-[0.08em]
            text-[#60432f]
            shadow-[0_6px_16px_rgba(65,45,30,0.16)]
            backdrop-blur-sm
            transition
            group-hover:bg-[#fff8ed]
            group-focus-visible:bg-[#fff8ed]
            sm:text-xs
          "
        >
          Circle of Support
        </span>

        <span
          className="
            pointer-events-none
            absolute
            bottom-[-2.9rem]
            left-1/2
            -translate-x-1/2
            whitespace-nowrap
            rounded-full
            bg-[rgba(55,38,26,0.92)]
            px-4
            py-2
            text-xs
            font-medium
            text-[#fff8ed]
            opacity-0
            shadow-lg
            backdrop-blur-sm
            transition
            group-hover:opacity-100
            group-focus-visible:opacity-100
          "
        >
          Enter the meeting room
        </span>
      </Link>

      {/* Doorway and waterfall: Community Market */}
      <Link
        href="/market"
        aria-label="Walk through the doorway to the Community Market"
        title="Smiling Monad Community Market"
        className="
          group
          absolute
          left-[2%]
          top-[20%]
          z-10
          h-[43%]
          w-[54%]
          cursor-pointer
          rounded-t-[50%]
          rounded-b-[20px]
          outline-none
          transition
          focus-visible:ring-4
          focus-visible:ring-[rgba(224,246,238,0.85)]
          sm:left-[4%]
          sm:top-[14%]
          sm:h-[54%]
          sm:w-[42%]
        "
      >
        <span
          className="
            pointer-events-none
            absolute
            inset-0
            rounded-t-[50%]
            rounded-b-[20px]
            border
            border-transparent
            transition
            group-hover:border-[rgba(224,246,238,0.75)]
            group-hover:bg-[rgba(210,239,226,0.06)]
            group-hover:shadow-[0_0_35px_rgba(215,244,235,0.48)]
          "
        />

        <span
          className="
            pointer-events-none
            absolute
            bottom-[8%]
            left-1/2
            -translate-x-1/2
            whitespace-nowrap
            rounded-full
            bg-[rgba(45,66,51,0.9)]
            px-4
            py-2
            text-xs
            font-medium
            text-[#f7fff8]
            opacity-0
            shadow-lg
            backdrop-blur-sm
            transition
            group-hover:opacity-100
            group-focus-visible:opacity-100
          "
        >
          Community Market
        </span>
      </Link>

      <CompanionPresence
        active={officeActivated}
        status={avatarStatus}
        expression={avatarExpression}
        onActivate={activateOffice}
      />

      <OfficeBackButton />

      {officeActivated && children}
    </main>
  );
}