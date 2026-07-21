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

type RequireAuthenticatedUserProps = {
  children: ReactNode;
};

type AuthenticationStatus =
  | "checking"
  | "authenticated"
  | "signed-out"
  | "error";

export default function RequireAuthenticatedUser({
  children,
}: RequireAuthenticatedUserProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [
    authenticationStatus,
    setAuthenticationStatus,
  ] = useState<AuthenticationStatus>(
    "checking",
  );

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

    async function checkAuthentication() {
      setAuthenticationStatus(
        "checking",
      );

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (error || !user) {
          setAuthenticationStatus(
            "signed-out",
          );
          openSignIn();
          return;
        }

        setAuthenticationStatus(
          "authenticated",
        );
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(
          "Authentication check failed:",
          error,
        );

        setAuthenticationStatus(
          "error",
        );
      }
    }

    void checkAuthentication();

    const {
      data: subscription,
    } = supabase.auth.onAuthStateChange(
      () => {
        if (!active) {
          return;
        }

        void checkAuthentication();
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (
    authenticationStatus !==
    "authenticated"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 text-[#2c2a26]">
        <div className="rounded-3xl border border-black/10 bg-white/80 px-7 py-6 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-black/45">
            Smiling Monad
          </p>

          <p className="mt-3 text-lg font-semibold">
            {authenticationStatus ===
            "signed-out"
              ? "Opening sign in…"
              : authenticationStatus ===
                  "error"
                ? "Sign-in could not be confirmed."
                : "Checking sign in…"}
          </p>
        </div>
      </main>
    );
  }

  return children;
}