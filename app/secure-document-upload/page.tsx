"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  openSecureCircleWorkspace,
  type SecureCircleWorkspace,
} from "@/lib/circle/secure-circle-client";
import {
  uploadSecureCircleDocument,
  type SecureDocumentCategory,
  type SecureDocumentSensitivity,
} from "@/lib/circle/secure-documents-client";

export default function CircleDocumentUploadPage() {
  const [workspace, setWorkspace] =
    useState<SecureCircleWorkspace | null>(
      null,
    );
  const [loading, setLoading] =
    useState(true);
  const [working, setWorking] =
    useState(false);
  const [message, setMessage] =
    useState("");

  const [title, setTitle] =
    useState("");
  const [description, setDescription] =
    useState("");
  const [category, setCategory] =
    useState<SecureDocumentCategory>(
      "other",
    );
  const [sensitivity, setSensitivity] =
    useState<SecureDocumentSensitivity>(
      "personal",
    );
  const [file, setFile] =
    useState<File | null>(null);

  useEffect(() => {
    let active = true;

    async function openWorkspace() {
      try {
        const nextWorkspace =
          await openSecureCircleWorkspace();

        if (!active) {
          return;
        }

        if (
          !nextWorkspace.privateAccess ||
          !nextWorkspace.participant.id
        ) {
          window.location.assign(
            `/security/mfa?returnTo=${encodeURIComponent(
              "/secure-document-upload",
            )}`,
          );
          return;
        }

        setWorkspace(nextWorkspace);
        setMessage("");
      } catch (error) {
        if (!active) {
          return;
        }

        setMessage(
          error instanceof Error
            ? error.message
            : "The secure upload page could not be opened.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void openWorkspace();

    return () => {
      active = false;
    };
  }, []);

  async function submitUpload(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !workspace ||
      working
    ) {
      return;
    }

    if (!title.trim()) {
      setMessage(
        "Enter a document title.",
      );
      return;
    }

    if (!file) {
      setMessage(
        "Choose a file to upload.",
      );
      return;
    }

    setWorking(true);
    setMessage(
      "Uploading securely…",
    );

    try {
      await uploadSecureCircleDocument({
        circleId: workspace.circle.id,
        participantId:
          workspace.participant.id,
        title,
        description,
        category,
        sensitivity,
        file,
      });

      window.location.assign(
        "/circle?panel=documents&uploaded=1",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The document could not be uploaded.",
      );
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#5b4936] px-6 text-[#fff8ed]">
        <div className="rounded-full border border-white/35 bg-black/30 px-6 py-3 font-serif text-lg shadow-lg backdrop-blur-md">
          Opening secure document upload…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-[#5b4936] px-4 py-6 text-[#3f3127] sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-2xl rounded-[28px] border border-[#d9c7ad] bg-[rgba(255,250,241,0.99)] p-5 shadow-[0_30px_70px_rgba(25,18,12,0.48)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
              Shared information
            </p>

            <h1 className="mt-3 font-serif text-3xl sm:text-4xl">
              Upload a secure document
            </h1>
          </div>

          <Link
            href="/circle?panel=documents"
            aria-label="Return to Documents"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eee2d2] text-xl text-[#5c4838]"
          >
            ×
          </Link>
        </div>

        <p className="mt-4 leading-7 text-[#68584a]">
          Enter the details, choose the file, then press
          the upload button. The file will remain on this
          page until the secure upload finishes.
        </p>

        <form
          onSubmit={submitUpload}
          className="mt-7 space-y-4"
        >
          <label className="block">
            <span className="text-sm font-medium">
              Document title
            </span>

            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              disabled={working}
              className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b] disabled:opacity-60"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">
                Category
              </span>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target
                      .value as SecureDocumentCategory,
                  )
                }
                disabled={working}
                className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b] disabled:opacity-60"
              >
                <option value="plan">Plan</option>
                <option value="agreement">
                  Agreement
                </option>
                <option value="report">Report</option>
                <option value="meeting">
                  Meeting
                </option>
                <option value="assessment">
                  Assessment
                </option>
                <option value="health">Health</option>
                <option value="financial">
                  Financial
                </option>
                <option value="consent">
                  Consent
                </option>
                <option value="correspondence">
                  Correspondence
                </option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">
                Sensitivity
              </span>

              <select
                value={sensitivity}
                onChange={(event) =>
                  setSensitivity(
                    event.target
                      .value as SecureDocumentSensitivity,
                  )
                }
                disabled={working}
                className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b] disabled:opacity-60"
              >
                <option value="general">
                  General
                </option>
                <option value="personal">
                  Personal
                </option>
                <option value="health">
                  Health
                </option>
                <option value="financial">
                  Financial
                </option>
                <option value="restricted">
                  Restricted
                </option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium">
              Description
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              disabled={working}
              placeholder="Optional"
              className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 leading-7 outline-none focus:border-[#71523b] disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              File
            </span>

            <input
              type="file"
              disabled={working}
              onChange={(event) =>
                setFile(
                  event.target.files?.[0] ??
                    null,
                )
              }
              className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 text-sm disabled:opacity-60"
            />
          </label>

          {file && (
            <div className="rounded-[18px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
              Selected:{" "}
              <strong>{file.name}</strong>
            </div>
          )}

          {message && (
            <div className="rounded-[18px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={
              working ||
              !workspace ||
              !title.trim() ||
              !file
            }
            className="w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {working
              ? "Uploading securely…"
              : "Upload secure document"}
          </button>
        </form>
      </section>
    </main>
  );
}