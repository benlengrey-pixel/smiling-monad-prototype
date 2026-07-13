import type { ReactNode } from "react";

type OfficeLayoutProps = {
  companion: ReactNode;
  workspace: ReactNode;
  conversation: ReactNode;
};

export default function OfficeLayout({
  companion,
  workspace,
  conversation,
}: OfficeLayoutProps) {
  return (
    <main className="min-h-screen bg-[#ece7dd] p-5 text-gray-900">
      <div className="mx-auto grid h-[calc(100vh-2.5rem)] max-w-[1800px] grid-cols-[280px_minmax(0,1fr)_300px] gap-5">
        <aside className="overflow-hidden rounded-[2rem] bg-white/90 shadow-xl">
          {companion}
        </aside>

        <section className="overflow-hidden rounded-[2rem] bg-white/80 shadow-xl">
          {workspace}
        </section>

        <aside className="overflow-hidden rounded-[2rem] bg-white/90 shadow-xl">
          {conversation}
        </aside>
      </div>
    </main>
  );
}
