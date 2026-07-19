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

type AccessStatus =
  | "checking"
  | "approved"
  | "pending"
  | "suspended"
  | "signed-out"
  | "error";

export default function RequireSignedInUser({
  children,
}: RequireSignedInUserProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [accessStatus, setAccessStatus] =
    useState<AccessStatus>("checking");

  useEffect(() => {
    let active = true;
    let unsubscribe:
      | (() => void)
      | undefined;

    function openSignIn() {
      const returnTo =
        encodeURIComponent(
          pathname || "/office",
        );

      router.replace(
        `/sign-in?returnTo=${returnTo}`,
      );
    }

    async function checkAccess() {
      try {
        const supabase =
          getSupabaseBrowserClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (userError || !user) {
          setAccessStatus("signed-out");
          openSignIn();
          return;
        }

        const {
          data: accessRecord,
          error: accessError,
        } = await supabase
          .from("user_access")
          .select(
            "access_status, is_admin",
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) {
          return;
        }

        if (accessError) {
          throw accessError;
        }

        const status =
          accessRecord?.access_status;

        if (status === "approved") {
          setAccessStatus("approved");
          return;
        }

        if (status === "suspended") {
          setAccessStatus("suspended");
          router.replace(
            "/access-pending",
          );
          return;
        }

        setAccessStatus("pending");
        router.replace(
          "/access-pending",
        );
      } catch {
        if (!active) {
          return;
        }

        if (
          process.env.NODE_ENV ===
          "development"
        ) {
          setAccessStatus("approved");
          return;
        }

        setAccessStatus("error");
        router.replace(
          "/access-pending",
        );
      }
    }

    void checkAccess();

    try {
      const supabase =
        getSupabaseBrowserClient();

      const {
        data: subscription,
      } = supabase.auth.onAuthStateChange(
        () => {
          if (!active) {
            return;
          }

          setAccessStatus("checking");
          void checkAccess();
        },
      );

      unsubscribe = () => {
        subscription.subscription.unsubscribe();
      };
    } catch {
      if (
        process.env.NODE_ENV ===
        "development"
      ) {
        setAccessStatus("approved");
      }
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [pathname, router]);

  if (accessStatus !== "approved") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 text-[#2c2a26]">
        <div className="rounded-3xl border border-black/10 bg-white/80 px-7 py-6 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/45">
            Smiling Monad
          </p>

          <p className="mt-3 text-lg font-semibold">
            {accessStatus === "pending"
              ? "Waiting for approval…"
              : accessStatus ===
                  "suspended"
                ? "Access is paused…"
                : accessStatus ===
                    "signed-out"
                  ? "Opening sign in…"
                  : accessStatus ===
                      "error"
                    ? "Access could not be confirmed…"
                    : "Checking secure access…"}
          </p>
        </div>
      </main>
    );
  }

  return children;
}