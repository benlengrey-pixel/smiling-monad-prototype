"use client";

type WorkspaceDocumentProps = {
  content: string;
  working: boolean;
  onContentChange: (value: string) => void;
};

export default function WorkspaceDocument({
  content,
  working,
  onContentChange,
}: WorkspaceDocumentProps) {
  if (!content && working) {
    return (
      <div className="flex min-h-[38dvh] items-center justify-center rounded-2xl border border-white/50 bg-white/25 p-6">
        <p className="text-center text-base text-[#77695e]">
          The Companion is preparing the document…
        </p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-[38dvh] items-center justify-center rounded-2xl border border-dashed border-[#8f7d6e]/25 bg-white/20 p-6">
        <p className="max-w-md text-center text-base leading-7 text-[#77695e]">
          The working document will appear here when the Companion creates it.
        </p>
      </div>
    );
  }

  return (
    <textarea
      value={content}
      onChange={(event) => onContentChange(event.target.value)}
      aria-label="Working document"
      className="min-h-[48dvh] w-full resize-none rounded-2xl border border-white/55 bg-white/55 px-5 py-5 text-base leading-7 text-[#332a23] outline-none focus:ring-4 focus:ring-[#6d513a]/15 sm:px-7 sm:py-6 sm:text-lg sm:leading-8"
    />
  );
}