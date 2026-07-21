import Link from "next/link";
import type { ReactNode } from "react";

type CircleLayoutProps = {
  children: ReactNode;
};

export default function CircleLayout({
  children,
}: CircleLayoutProps) {
  return (
    <>
      {children}

      <Link
        href="/circle/conversation"
        aria-label="Open Circle conversation"
        style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          zIndex: 2147483647,
        }}
        className="flex min-h-14 items-center justify-center rounded-full border border-white/50 bg-[#60432f] px-6 py-3 text-base font-semibold text-white shadow-2xl"
      >
        Conversation
      </Link>
    </>
  );
}