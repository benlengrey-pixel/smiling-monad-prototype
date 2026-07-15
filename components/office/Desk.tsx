"use client";

import type { ReactNode } from "react";

type DeskProps = {
  children?: ReactNode;
};

export default function Desk({
  children,
}: DeskProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[7.5rem] z-20 flex justify-center">
      <div className="relative h-56 w-[900px] max-w-[92vw]">
        {children}
      </div>
    </div>
  );
}