type WorkspaceCardProps = {
  title: string;
  content?: string;
  status?: "draft" | "ready" | "active" | "complete";
};

export default function WorkspaceCard({
  title,
  content,
  status = "active",
}: WorkspaceCardProps) {
  return (
    <section className="w-full rounded-2xl border bg-white p-5 text-left shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">
          {title}
        </h2>

        <span className="text-xs capitalize text-gray-500">
          {status}
        </span>
      </div>

      {content && (
        <p className="mt-3 whitespace-pre-wrap text-gray-700">
          {content}
        </p>
      )}
    </section>
  );
}