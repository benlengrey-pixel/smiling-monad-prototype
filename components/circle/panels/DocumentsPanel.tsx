"use client";

import Link from "next/link";

import type { SecureCircleDocument } from "@/lib/circle/secure-documents-client";

type DocumentsPanelProps = {
  documents: SecureCircleDocument[];
  loading: boolean;
  workingId: string;
  message: string;
  onRefresh: () => void;
  onOpenDocument: (
    document: SecureCircleDocument,
  ) => void;
  onArchiveDocument: (
    documentId: string,
  ) => void;
};

export default function DocumentsPanel({
  documents,
  loading,
  workingId,
  message,
  onRefresh,
  onOpenDocument,
  onArchiveDocument,
}: DocumentsPanelProps) {
  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        Shared information
      </p>

      <h1 className="mt-3 font-serif text-3xl">
        Documents and records
      </h1>

      <p className="mt-3 max-w-2xl leading-7 text-[#6b5d50]">
        Documents are stored in the private
        Circle file area. Two-step security is
        required before documents can be
        uploaded, opened or archived.
      </p>

      <Link
        href="/secure-document-upload"
        className="mt-6 flex w-full items-center justify-center rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
      >
        Upload a secure document
      </Link>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="mt-3 w-full rounded-full border border-[#bfa98d] bg-[#efe3d2] px-6 py-3 font-medium text-[#533d2d] transition hover:bg-[#e6d6c0] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {loading
          ? "Refreshing documents…"
          : "Refresh documents"}
      </button>

      {message && (
        <p className="mt-3 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
          {message}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
            Loading secure documents…
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
            No secure documents are currently
            available.
          </div>
        ) : (
          documents.map(
            (secureDocument) => (
              <article
                key={secureDocument.id}
                className="flex flex-col gap-4 rounded-[20px] border border-[#dfd2c1] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-serif text-xl">
                    {secureDocument.title}
                  </p>

                  <p className="mt-1 text-sm text-[#756151]">
                    {secureDocument.category} ·{" "}
                    {
                      secureDocument.document_status
                    }{" "}
                    ·{" "}
                    {
                      secureDocument.sensitivity
                    }
                  </p>

                  <p className="mt-2 text-sm text-[#8a786a]">
                    {
                      secureDocument.original_filename
                    }
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenDocument(
                        secureDocument,
                      )
                    }
                    disabled={
                      workingId ===
                      secureDocument.id
                    }
                    className="rounded-full bg-[#60432f] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    Open
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onArchiveDocument(
                        secureDocument.id,
                      )
                    }
                    disabled={
                      workingId ===
                      secureDocument.id
                    }
                    className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm text-[#533d2d] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {workingId ===
                    secureDocument.id
                      ? "Working…"
                      : "Archive"}
                  </button>
                </div>
              </article>
            ),
          )
        )}
      </div>
    </>
  );
}