type CompanionProps = {
  name: string;
  avatar: string;
  status: "ready" | "thinking" | "presenting" | "waiting";
  focus?: string;
};

const statusText = {
  ready: "Online",
  thinking: "Thinking",
  presenting: "Presenting",
  waiting: "Waiting",
};

export default function Companion({
  name,
  avatar,
  status,
  focus = "Here to help",
}: CompanionProps) {
  return (
    <section className="flex items-center gap-4">
      <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-3xl bg-[#f3eee5]">
        <img
          src={avatar}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-500">
          Your AI Companion
        </p>

        <h1 className="truncate text-xl font-semibold">
          {name}
        </h1>

        <div className="mt-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium">
            {statusText[status]}
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-600">
          {focus}
        </p>
      </div>
    </section>
  );
}
