"use client";

import { useEffect } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutPage() {
  useEffect(() => {
    let active = true;

    async function signOut() {
      try {
        const supabase =
          getSupabaseBrowserClient();

        await supabase.auth.signOut({
          scope: "local",
        });
      } finally {
        if (active) {
          window.location.replace(
            "/sign-in",
          );
        }
      }
    }

    void signOut();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 text-[#2c2a26]">
      <div className="rounded-3xl border border-black/10 bg-white/80 px-7 py-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/45">
          Smiling Monad
        </p>

        <p className="mt-3 text-lg font-semibold">
          Signing out…
        </p>
      </div>
    </main>
  );
}