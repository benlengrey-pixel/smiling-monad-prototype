"use client";

import {
  type ReactNode,
  useEffect,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

type RequireSignedInUserProps = {
  children: ReactNode;
};

export default function RequireSignedInUser({
  children,
}: RequireSignedInUserProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe:
      | (() => void)
      | undefined;

    async function checkAccess() {
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
          const returnTo =
            encodeURIComponent(
              pathname || "/office",
            );

          router.replace(
            `/sign-in?returnTo=${returnTo}`,
          );

          return;
        }

        setChecking(false);

        const {
          data: subscription,
        } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (!session?.user) {
              const returnTo =
                encodeURIComponent(
                  pathname || "/office",
                );

              router.replace(
                `/sign-in?returnTo=${returnTo}`,
              );

              return;
            }

            setChecking(false);
          },
        );

        unsubscribe = () => {
          subscription.subscription.unsubscribe();
        };
      } catch {
        // Temporary development fallback:
        // allow access when Supabase is unavailable
        // so the Smiling Monad Space remains usable.
        if (active) {
          setChecking(false);
        }
      }
    }

    void checkAccess();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 text-[#2c2a26]">
        <div className="rounded-3xl border border-black/10 bg-white/80 px-7 py-6 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/45">
            Smiling Monad
          </p>

          <p className="mt-3 text-lg font-semibold">
            Opening the Space…
          </p>
        </div>
      </main>
    );
  }

  return children;
}