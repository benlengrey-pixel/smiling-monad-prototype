import WorkspaceCard from "@/components/companion/WorkspaceCard";
import type { WorkspaceCard as WorkspaceCardData } from "@/lib/workspace/types";

type WorkspaceCanvasProps = {
  cards: WorkspaceCardData[];
};

export default function WorkspaceCanvas({
  cards,
}: WorkspaceCanvasProps) {
  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] bg-[#d8ba95] p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/5" />

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center">
        {cards.length === 0 ? (
          <p className="rounded-2xl bg-white/55 px-5 py-3 text-sm text-[#655443] shadow-sm backdrop-blur">
            Ready when you are.
          </p>
        ) : (
          <div className="grid max-h-full w-full gap-4 overflow-auto">
            {cards.slice(0, 3).map((card) => (
              <WorkspaceCard
                key={card.id}
                title={card.title}
                content={card.content}
                status={card.status}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
