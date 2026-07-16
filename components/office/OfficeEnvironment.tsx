import type { ReactNode } from "react";
import Link from "next/link";

import OfficeBackground from "./OfficeBackground";
import OfficeBackButton from "./OfficeBackButton";

type OfficeEnvironmentProps = {
  children: ReactNode;
};

export default function OfficeEnvironment({
  children,
}: OfficeEnvironmentProps) {
  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#d9c3a6]">
      <OfficeBackground />

      <Link
        href="/circle"
        aria-label="Open the Circles of Support Centre"
        title="Circles of Support Centre"
        className="
          group
          absolute
          left-[15%]
          top-[31%]
          z-10
          h-[18%]
          w-[22%]
          cursor-pointer
          rounded-[18px]
          outline-none
          transition
          focus-visible:ring-4
          focus-visible:ring-[rgba(255,248,230,0.8)]
          sm:left-[13%]
          sm:top-[25%]
          sm:h-[25%]
          sm:w-[18%]
        "
      >
        <span
          className="
            pointer-events-none
            absolute
            inset-0
            rounded-[18px]
            border
            border-transparent
            transition
            group-hover:border-[rgba(255,248,230,0.75)]
            group-hover:bg-[rgba(255,248,230,0.08)]
            group-hover:shadow-[0_0_28px_rgba(255,244,215,0.4)]
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
            bg-[rgba(55,38,26,0.88)]
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
          Circles of Support Centre
        </span>
      </Link>

      <Link
        href="/market"
        aria-label="Walk outside to the Smiling Monad Community Market"
        title="Smiling Monad Community Market"
        className="
          group
          absolute
          right-[1%]
          top-[20%]
          z-10
          h-[38%]
          w-[21%]
          cursor-pointer
          rounded-[40px]
          outline-none
          transition
          focus-visible:ring-4
          focus-visible:ring-[rgba(224,246,238,0.85)]
          sm:right-[2%]
          sm:top-[15%]
          sm:h-[48%]
          sm:w-[19%]
        "
      >
        <span
          className="
            pointer-events-none
            absolute
            inset-0
            rounded-[40px]
            border
            border-transparent
            transition
            group-hover:border-[rgba(224,246,238,0.72)]
            group-hover:bg-[rgba(210,239,226,0.08)]
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

      <OfficeBackButton />

      {children}
    </main>
  );
}