import Link from "next/link";
import type { ReactNode } from "react";

type CircleLayoutProps = {
  children: ReactNode;
};

export default function CircleLayout({
  children,
}: CircleLayoutProps) {
  return (
    <div className="relative min-h-screen">
      {children}

      <Link
        href="/circle/conversation"
        className="fixed right-5 top-5 z-[9999] flex min-h-12 items-center justify-center rounded-full border border-white/40 bg-[#60432f]/95 px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur"
      >
        Conversation
      </Link>
    </div>
  );
}