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

      {/* Wall poster: Circle of Support */}
      <Link
        href="/circle"
        aria-label="Enter the Circle of Support room"
        title="Circle of Support"
        className="
          absolute
          right-[12%]
          top-[22%]
          z-30
          h-[19%]
          w-[25%]
          cursor-pointer
          rounded-[10px]
          outline-none
          sm:right-[17%]
          sm:top-[20%]
          sm:h-[23%]
          sm:w-[17%]
        "
      />

      {/* Doorway and waterfall only: Community Market */}
      <Link
        href="/market"
        aria-label="Walk through the doorway to the Community Market"
        title="Smiling Monad Community Market"
        className="
          absolute
          left-[3%]
          top-[24%]
          z-10
          h-[38%]
          w-[43%]
          cursor-pointer
          rounded-t-[48%]
          rounded-b-[18px]
          outline-none
          sm:left-[5%]
          sm:top-[16%]
          sm:h-[48%]
          sm:w-[32%]
        "
      />

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