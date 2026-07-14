"use client";

import { ReactNode } from "react";

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
      {/* Soft readability layer */}
      <div className="absolute inset-0 bg-white/25 backdrop-blur-[1px]" />

      {/* Workspace */}
      <div className="relative z-10 flex min-h-screen justify-center px-6 py-8">
        <div className="w-full max-w-7xl">
          {children}
        </div>
      </div>
    </main>
  );
}