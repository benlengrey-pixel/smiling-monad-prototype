import OfficeSidebar from "./OfficeSidebar";
import WorkspaceCanvas from "./WorkspaceCanvas";
import ConversationDock from "@/components/companion/ConversationDock";

import type { WorkspaceCard } from "@/lib/workspace/types";

type OfficeShellProps = {
  officeName: string;
  officeMode: string;
  cards: WorkspaceCard[];
  response: string;
  thought: string;
  sending: boolean;
  onThoughtChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;
};

export default function OfficeShell({
  officeName,
  officeMode,
  cards,
  response,
  thought,
  sending,
  onThoughtChange,
  onSend,
  onKeyDown,
}: OfficeShellProps) {
  return (
    <main className="min-h-screen bg-[#eee8df] text-[#211d19]">
      <div className="flex min-h-screen flex-col">
        {/* TOP HEADER */}
        <header className="relative z-20 flex h-[86px] items-center justify-between border-b border-black/5 bg-white/90 px-5 shadow-sm backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src="/branding/logo.png"
              alt="The Smiling Monad"
              className="h-14 w-14 object-contain"
            />

            <div>
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                The Smiling Monad
              </h1>

              <p className="text-xs text-[#746d64] sm:text-sm">
                Your AI Companion
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-2 shadow-sm sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

            <div>
              <p className="text-xs font-semibold">Online</p>
              <p className="text-xs text-[#81796f]">
                Here to help
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5"
            >
              🔔
            </button>

            <button
              type="button"
              aria-label="Help"
              className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-black/5"
            >
              ?
            </button>

            <div className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-[#ddd4c7] text-sm font-semibold">
              BG
            </div>
          </div>
        </header>

        {/* MAIN LIVING OFFICE */}
        <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 pb-24 lg:grid lg:grid-cols-[minmax(260px,0.8fr)_minmax(420px,1.4fr)_minmax(330px,0.9fr)] lg:gap-5 lg:p-5 lg:pb-28">
          {/* COMPANION ENVIRONMENT */}
          <section className="relative hidden min-h-0 overflow-hidden rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top,#f9f4ec_0%,#d9c8b3_52%,#aa9277_100%)] shadow-[0_20px_60px_rgba(65,48,32,0.16)] lg:flex lg:flex-col">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,rgba(36,27,20,0.38)_100%)]" />

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="relative">
                <div className="grid h-56 w-56 place-items-center rounded-full border-[6px] border-white/85 bg-white/30 shadow-2xl backdrop-blur-md">
                  <img
                    src="/branding/logo.png"
                    alt="Smiling Monad Companion"
                    className="h-36 w-36 object-contain"
                  />
                </div>

                <div className="absolute right-0 top-4 flex items-center gap-2 rounded-full border border-white/70 bg-[#f4eee4]/95 px-4 py-2 text-sm font-semibold shadow-lg">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  Online
                </div>
              </div>

              <h2 className="mt-7 text-2xl font-semibold text-white">
                Smiling Monad Companion
              </h2>

              <p className="mt-2 max-w-xs text-sm leading-6 text-white/85">
                Present, calm and ready to help with whatever
                you are working on.
              </p>
            </div>

            <div className="relative z-10 m-5 rounded-[1.5rem] border border-white/40 bg-white/75 p-4 shadow-lg backdrop-blur-xl">
              <OfficeSidebar />
            </div>
          </section>

          {/* CENTRAL WORKSPACE */}
          <section className="flex min-h-[600px] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/68 shadow-[0_20px_60px_rgba(65,48,32,0.14)] backdrop-blur-xl lg:min-h-0">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Workspace
                </h2>

                <p className="mt-1 text-sm text-[#766e65]">
                  Documents, tasks and insights live here.
                </p>
              </div>

              <button
                type="button"
                className="rounded-full bg-[#171513] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black"
              >
                + New
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <WorkspaceCanvas cards={cards} />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-black/5 bg-white/55 px-4 py-3 sm:px-6">
              <span className="mr-2 text-sm font-semibold">
                Quick actions
              </span>

              {[
                "New Report",
                "Add Note",
                "Upload",
                "Calendar",
              ].map((action) => (
                <button
                  key={action}
                  type="button"
                  className="rounded-xl border border-black/5 bg-white px-4 py-2 text-sm shadow-sm transition hover:bg-[#f7f4ef]"
                >
                  {action}
                </button>
              ))}
            </div>
          </section>

          {/* CONVERSATION PANEL */}
          <section className="flex min-h-[620px] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/88 shadow-[0_20px_60px_rgba(65,48,32,0.16)] backdrop-blur-xl lg:min-h-0">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative grid h-12 w-12 place-items-center rounded-full bg-[#eee7dc]">
                  <img
                    src="/branding/logo.png"
                    alt=""
                    className="h-9 w-9 object-contain"
                  />

                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold">
                    Smiling Monad Companion
                  </h2>

                  <p className="text-xs text-[#766e65]">
                    Online
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-xl transition hover:bg-black/5"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 p-4">
              <ConversationDock
                response={response}
                thought={thought}
                sending={sending}
                onThoughtChange={onThoughtChange}
                onSend={onSend}
                onKeyDown={onKeyDown}
              />
            </div>
          </section>
        </div>

        {/* BOTTOM NAVIGATION */}
        <nav className="fixed bottom-3 left-1/2 z-30 flex w-[calc(100%-1.5rem)] max-w-[1450px] -translate-x-1/2 items-center justify-between gap-1 rounded-[1.7rem] border border-white/75 bg-white/88 p-2 shadow-[0_16px_45px_rgba(45,34,24,0.18)] backdrop-blur-2xl">
          {[
            ["⌂", "Home"],
            ["▢", "Projects"],
            ["♙", "Participants"],
            ["▱", "Resources"],
            ["□", "Calendar"],
            ["⌁", "Insights"],
            ["⚙", "Settings"],
          ].map(([icon, label], index) => (
            <button
              key={label}
              type="button"
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm transition ${
                index === 0
                  ? "bg-[#171513] text-white shadow-sm"
                  : "text-[#4e4841] hover:bg-black/5"
              }`}
            >
              <span className="text-lg">{icon}</span>

              <span className="hidden md:inline">
                {label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}