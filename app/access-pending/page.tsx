"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

type AccessStatus =
  | "pending"
  | "approved"
  | "suspended"
  | "unknown";

export default function AccessPendingPage() {
  const [status, setStatus] =
    useState<AccessStatus>("unknown");

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    async function loadAccess() {
      try {
        const supabase =
          getSupabaseBrowserClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (!user) {
          setStatus("unknown");
          setLoading(false);
          return;
        }

        setEmail(user.email ?? "");

        const {
          data,
          error,
        } = await supabase
          .from("user_access")
          .select("access_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!active) {
          return;
        }

        setStatus(
          data?.access_status === "approved" ||
            data?.access_status === "pending" ||
            data?.access_status === "suspended"
            ? data.access_status
            : "unknown",
        );
      } catch {
        if (active) {
          setStatus("unknown");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAccess();

    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    const supabase =
      getSupabaseBrowserClient();

    await supabase.auth.signOut();

    window.location.href = "/sign-in";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 text-[#2c2a26]">
        <div className="rounded-3xl border border-black/10 bg-white/80 px-7 py-6 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/45">
            Smiling Monad
          </p>

          <p className="mt-3 text-lg font-semibold">
            Checking your access…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="w-full max-w-xl rounded-[2rem] border border-black/10 bg-white/85 p-7 text-center shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/45">
          Smiling Monad
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          {status === "suspended"
            ? "Access paused"
            : status === "approved"
              ? "Access approved"
              : "Access awaiting approval"}
        </h1>

        <p className="mt-4 leading-7 text-black/65">
          {status === "suspended"
            ? "Your access has been temporarily paused. Contact the Smiling Monad administrator for help."
            : status === "approved"
              ? "Your account is approved and ready to use."
              : "Your secure account has been created. An administrator needs to approve access before you can enter the protected areas of the Smiling Monad Space."}
        </p>

        {email ? (
          <p className="mt-5 break-all rounded-2xl bg-black/5 px-4 py-3 text-sm font-semibold">
            {email}
          </p>
        ) : null}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {status === "approved" ? (
            <Link
              href="/office"
              className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
            >
              Enter the Space
            </Link>
          ) : (
            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
            >
              Check again
            </button>
          )}

          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}