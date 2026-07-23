"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import CommunityServicesDirectory from "@/components/community/CommunityServicesDirectory";
import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

export default function CommunityServicesPage() {
  const [authReady, setAuthReady] =
    useState(false);

  const [signedIn, setSignedIn] =
    useState(false);

  useEffect(() => {
    const supabase =
      getSupabaseBrowserClient();

    let active = true;

    async function loadUser() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!active) {
        return;
      }

      setSignedIn(Boolean(user));
      setAuthReady(true);
    }

    void loadUser();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!active) {
            return;
          }

          setSignedIn(
            Boolean(session?.user),
          );

          setAuthReady(true);
        },
      );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!authReady) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#eee4d7] px-6 text-[#6b5d50]">
        Loading the Services
        Directory…
      </main>
    );
  }

  return (
    <>
      <div className="fixed left-4 top-4 z-50 flex flex-wrap gap-2 sm:left-6 sm:top-6">
        <Link
          href="/community"
          className="rounded-full border border-[#d6c6b1] bg-[rgba(255,250,241,0.94)] px-4 py-2 text-sm font-medium text-[#60432f] shadow-sm backdrop-blur-md transition hover:bg-white"
        >
          ← Community
        </Link>

        {!signedIn ? (
          <Link
            href="/sign-in?returnTo=%2Fcommunity%2Fservices"
            className="rounded-full bg-[#60432f] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#4f3728]"
          >
            Sign in to save or list
          </Link>
        ) : null}
      </div>

      <CommunityServicesDirectory
        signedIn={signedIn}
      />
    </>
  );
}