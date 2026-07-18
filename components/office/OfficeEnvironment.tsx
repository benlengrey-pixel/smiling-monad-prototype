"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";

import CompanionPresence from "@/components/companion/CompanionPresence";
import OfficeBackground from "./OfficeBackground";
import OfficeBackButton from "./OfficeBackButton";

type OfficeEnvironmentProps = {
  children: ReactNode;
};

export default function OfficeEnvironment({
  children,
}: OfficeEnvironmentProps) {
  const [officeActivated, setOfficeActivated] =
    useState(false);

  function activateOffice() {
    if (officeActivated) {
      return;
    }

    setOfficeActivated(true);
  }

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#d9c3a6]">
      <OfficeBackground />

      {/* Poster behind Kimi: Circle of Support Centre */}
      <Link
        href="/circle"
        aria-label="Open the Circle of Support Centre"
        title="Circle of Support Centre"
        className="
          group
          absolute
          right-[12%]
          top-[22%]
          z-30
          h-[21%]
          w-[25%]
          cursor-pointer
          rounded-[10px]
          outline-none
          transition
          focus-visible:ring-4
          focus-visible:ring-[rgba(255,248,230,0.8)]
          sm:right-[17%]
          sm:top-[20%]
          sm:h-[25%]
          sm:w-[17%]
        "
      >
        <span
          className="
            pointer-events-none
            absolute
            inset-0
            rounded-[10px]
            border
            border-transparent
            transition
            group-hover:border-[rgba(255,248,230,0.8)]
            group-hover:bg-[rgba(255,248,230,0.08)]
            group-hover:shadow-[0_0_28px_rgba(255,244,215,0.45)]
          "
        />

        <span
          className="
            pointer-events-none
            absolute
            bottom-[-2.6rem]
            left-1/2
            -translate-x-1/2
            whitespace-nowrap
            rounded-full
            bg-[rgba(55,38,26,0.9)]
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
          Circle of Support Centre
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
        onActivate={activateOffice}
      />

      <OfficeBackButton />

      {officeActivated && children}
    </main>
  );
}