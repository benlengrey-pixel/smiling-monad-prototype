import Link from "next/link";
import type { ReactNode } from "react";

type CircleLayoutProps = {
  children: ReactNode;
};

export default function CircleLayout({
  children,
}: CircleLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4efe5]">
      <nav className="sticky top-0 z-50 border-b border-black/10 bg-[#f4efe5]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <Link
            href="/circle"
            className="text-sm font-semibold text-[#2c2a26]"
          >
            Circle of Support
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/circle"
              className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#2c2a26]"
            >
              Circle
            </Link>

            <Link
              href="/circle/conversation"
              className="rounded-full bg-[#60432f] px-4 py-2 text-sm font-semibold text-white"
            >
              Conversation
            </Link>
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}