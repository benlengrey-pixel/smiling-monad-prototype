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
  startSessionSecurityMonitor,
  type SessionExpiryReason,
} from "@/lib/auth/session-security-client";
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
  const router =
    useRouter();

  const pathname =
    usePathname();

  const [
    authenticationStatus,
    setAuthenticationStatus,
  ] =
    useState<AuthenticationStatus>(
      "checking",
    );

  useEffect(() => {
    let active =
      true;

    let stopSessionMonitor:
      | (() => void)
      | null = null;

    let authenticationCheckRunning =
      false;

    let authenticationCheckPending =
      false;

    const supabase =
      getSupabaseBrowserClient();

    function stopCurrentMonitor():
      void {
      stopSessionMonitor?.();

      stopSessionMonitor =
        null;
    }

    function openSignIn(
      expiryReason?:
        SessionExpiryReason,
    ): void {
      const returnTo =
        encodeURIComponent(
          pathname ||
            "/office",
        );

      const reasonParameter =
        expiryReason
          ? `&sessionExpired=${encodeURIComponent(
              expiryReason,
            )}`
          : "";

      router.replace(
        `/sign-in?returnTo=${returnTo}${reasonParameter}`,
      );
    }

    function handleSessionExpired(
      reason: SessionExpiryReason,
    ): void {
      if (!active) {
        return;
      }

      stopCurrentMonitor();

      setAuthenticationStatus(
        "signed-out",
      );

      openSignIn(
        reason,
      );
    }

    async function performAuthenticationCheck(
      showCheckingState: boolean,
    ): Promise<void> {
      if (
        authenticationCheckRunning
      ) {
        authenticationCheckPending =
          true;

        return;
      }

      authenticationCheckRunning =
        true;

      if (
        showCheckingState &&
        active
      ) {
        setAuthenticationStatus(
          "checking",
        );
      }

      try {
        const {
          data: {
            session,
          },
          error:
            sessionError,
        } =
          await supabase.auth
            .getSession();

        const {
          data: {
            user,
          },
          error:
            userError,
        } =
          await supabase.auth
            .getUser();

        if (!active) {
          return;
        }

        if (
          sessionError ||
          userError ||
          !session ||
          !user ||
          session.user.id !==
            user.id
        ) {
          stopCurrentMonitor();

          setAuthenticationStatus(
            "signed-out",
          );

          openSignIn();

          return;
        }

        stopCurrentMonitor();

        stopSessionMonitor =
          startSessionSecurityMonitor({
            supabase,

            userId:
              user.id,

            signedInAt:
              user.last_sign_in_at ??
              null,

            onExpired:
              handleSessionExpired,
          });

        setAuthenticationStatus(
          "authenticated",
        );
      } catch (error) {
        if (!active) {
          return;
        }

        stopCurrentMonitor();

        console.error(
          "Authentication check failed:",
          error,
        );

        setAuthenticationStatus(
          "error",
        );
      } finally {
        authenticationCheckRunning =
          false;

        if (
          active &&
          authenticationCheckPending
        ) {
          authenticationCheckPending =
            false;

          void performAuthenticationCheck(
            false,
          );
        }
      }
    }

    void performAuthenticationCheck(
      true,
    );

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          () => {
            if (!active) {
              return;
            }

            /*
             * Run outside the Supabase
             * authentication callback to
             * avoid blocking token refresh
             * or sign-out processing.
             */
            window.setTimeout(
              () => {
                if (active) {
                  void performAuthenticationCheck(
                    false,
                  );
                }
              },
              0,
            );
          },
        );

    return () => {
      active =
        false;

      stopCurrentMonitor();

      subscription.unsubscribe();
    };
  }, [
    pathname,
    router,
  ]);

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