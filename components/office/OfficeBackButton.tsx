"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function OfficeBackButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] =
    useState(false);

  async function signOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    try {
      const supabase =
        getSupabaseBrowserClient();

      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div
      className="
        absolute
        left-4
        top-4
        z-50
        flex
        items-center
        gap-2
        sm:left-6
        sm:top-6
      "
    >
      <Link
        href="/"
        aria-label="Close the Smiling Monad app"
        title="Close app"
        className="
          inline-flex
          h-11
          items-center
          justify-center
          gap-2
          rounded-full
          border
          border-white/55
          bg-[rgba(48,38,30,0.72)]
          px-4
          text-sm
          font-medium
          text-[#fff8ed]
          shadow-[0_8px_24px_rgba(38,29,22,0.24)]
          backdrop-blur-md
          transition
          hover:bg-[rgba(48,38,30,0.9)]
          focus-visible:outline-none
          focus-visible:ring-4
          focus-visible:ring-white/70
        "
      >
        <span
          aria-hidden="true"
          className="text-lg leading-none"
        >
          ×
        </span>

        <span>Close app</span>
      </Link>

      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        aria-label="Sign out of the Smiling Monad"
        title="Sign out"
        className="
          inline-flex
          h-8
          items-center
          justify-center
          rounded-full
          border
          border-white/20
          bg-black/20
          px-3
          text-[11px]
          font-medium
          text-white/75
          shadow-sm
          backdrop-blur-sm
          transition
          hover:border-white/35
          hover:bg-black/35
          hover:text-white
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-white/55
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {signingOut
          ? "Signing out…"
          : "Sign out"}
      </button>
    </div>
  );
}