"use client";

import type { ReactNode } from "react";

type WorkspaceSceneProps = {
  children: ReactNode;
};

export default function WorkspaceScene({
  children,
}: WorkspaceSceneProps) {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/workspace.png')",
      }}
    >
      {/* Soft overlay so documents remain readable */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />

      {/* Workspace content */}
      <div className="relative z-10 min-h-screen px-6 py-6">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </div>
    </main>
  );
}