type ConversationDockProps = {
  response: string;
  thought: string;
  sending: boolean;
  onThoughtChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;
};

export default function ConversationDock({
  response,
  thought,
  sending,
  onThoughtChange,
  onSend,
  onKeyDown,
}: ConversationDockProps) {
  const shortResponse =
    response.length > 220
      ? "I've placed the full response in your workspace."
      : response;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        {shortResponse && (
          <div className="rounded-2xl bg-gray-100 p-3 text-sm leading-relaxed">
            {shortResponse}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={thought}
          onChange={(event) =>
            onThoughtChange(event.target.value)
          }
          onKeyDown={onKeyDown}
          placeholder="Start with a thought..."
          className="h-20 flex-1 resize-none rounded-2xl border border-gray-200 p-3 text-sm outline-none"
        />

        <button
          onClick={onSend}
          disabled={sending}
          className="h-12 w-12 flex-shrink-0 rounded-full bg-black text-white disabled:opacity-50"
          aria-label="Send"
        >
          {sending ? "..." : "↑"}
        </button>
      </div>
    </section>
  );
}
