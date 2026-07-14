"use client";

import type { ReactNode } from "react";

type WorkspaceDeskProps = {
  children: ReactNode;
};

export default function WorkspaceDesk({
  children,
}: WorkspaceDeskProps) {
  return (
    <section className="mx-auto flex min-h-[80vh] w-full max-w-6xl flex-col gap-6 rounded-[2rem] border border-white/30 bg-white/10 p-6 backdrop-blur-[2px] shadow-[0_30px_80px_rgba(0,0,0,0.12)]">
      {children}
    </section>
  );
}