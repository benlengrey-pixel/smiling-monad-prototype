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
  | "mfa-required"
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

    const supabase =
      getSupabaseBrowserClient();

    function openSignIn() {
      const returnTo =
        encodeURIComponent(
          pathname || "/office",
        );

      router.replace(
        `/sign-in?returnTo=${returnTo}`,
      );
    }

    function openMfa() {
      const returnTo =
        encodeURIComponent(
          pathname || "/office",
        );

      router.replace(
        `/security/mfa?returnTo=${returnTo}`,
      );
    }

    async function checkAccess() {
      setAccessStatus("checking");

      try {
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
          throw new Error(
            accessError.message,
          );
        }

        const status =
          accessRecord?.access_status;

        if (status === "suspended") {
          setAccessStatus("suspended");
          router.replace(
            "/access-pending",
          );
          return;
        }

        if (status !== "approved") {
          setAccessStatus("pending");
          router.replace(
            "/access-pending",
          );
          return;
        }

        const {
          data: assurance,
          error: assuranceError,
        } =
          await supabase.auth.mfa
            .getAuthenticatorAssuranceLevel();

        if (!active) {
          return;
        }

        if (assuranceError) {
          throw new Error(
            assuranceError.message,
          );
        }

        if (
          assurance.currentLevel !== "aal2"
        ) {
          setAccessStatus("mfa-required");
          openMfa();
          return;
        }

        setAccessStatus("approved");
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(
          "Secure access check failed:",
          error,
        );

        setAccessStatus("error");
      }
    }

    void checkAccess();

    const {
      data: subscription,
    } = supabase.auth.onAuthStateChange(
      () => {
        if (!active) {
          return;
        }

        void checkAccess();
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
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
            {accessStatus ===
            "mfa-required"
              ? "Opening two-step security…"
              : accessStatus ===
                  "pending"
                ? "Waiting for approval…"
                : accessStatus ===
                    "suspended"
                  ? "Access is paused…"
                  : accessStatus ===
                      "signed-out"
                    ? "Opening sign in…"
                    : accessStatus ===
                        "error"
                      ? "Secure access could not be confirmed."
                      : "Checking secure access…"}
          </p>
        </div>
      </main>
    );
  }

  return children;
}