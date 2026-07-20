"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CircleLayoutProps = {
  children: ReactNode;
};

export default function CircleLayout({
  children,
}: CircleLayoutProps) {
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    let active = true;

    async function checkAccess() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (!session?.user) {
          router.replace("/");
          return;
        }

        setCheckingAccess(false);
      } catch {
        if (active) {
          router.replace("/");
        }
      }
    }

    void checkAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          router.replace("/");
        }
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checkingAccess) {
    return (
      <main className="flex h-[100svh] w-full items-center justify-center bg-[#5b4936] text-[#fff8ed]">
        <div className="rounded-full border border-white/35 bg-black/30 px-6 py-3 font-serif text-lg shadow-lg backdrop-blur-md">
          Opening your Circle of Support…
        </div>
      </main>
    );
  }

  return children;
}