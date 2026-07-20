"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "create-account";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] =
    useState<AuthMode>("sign-in");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    let active = true;

    async function readSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (active) {
          setUser(session?.user ?? null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void readSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submitAuthentication(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (working) {
      return;
    }

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setMessage(
        "Enter your email address and password.",
      );
      return;
    }

    setWorking(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();

      if (authMode === "create-account") {
        const { data, error } =
          await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
            },
          });

        if (error) {
          throw error;
        }

        if (data.session) {
          setUser(data.session.user);
          setAuthOpen(false);
          setEmail("");
          setPassword("");
          return;
        }

        setMessage(
          "Your account has been created. Check your email to confirm your address, then sign in.",
        );
        setAuthMode("sign-in");
        setPassword("");
        return;
      }

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (error) {
        throw error;
      }

      setUser(data.user);
      setAuthOpen(false);
      setEmail("");
      setPassword("");
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Authentication was unsuccessful.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function signOut() {
    if (working) {
      return;
    }

    setWorking(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setAuthOpen(false);
      setEmail("");
      setPassword("");
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Sign out was unsuccessful.",
      );
    } finally {
      setWorking(false);
    }
  }

  function openAuthentication(mode: AuthMode) {
    setAuthMode(mode);
    setAuthOpen(true);
    setMessage("");
    setPassword("");
  }

  function closeAuthentication() {
    if (working) {
      return;
    }

    setAuthOpen(false);
    setMessage("");
    setPassword("");
  }

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#22170f]">
      <img
        src="/frontdoor.png"
        alt="The Smiling Monad front door"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute left-4 top-4 z-30 sm:left-6 sm:top-6">
        {!authLoading && user ? (
          <button
            type="button"
            onClick={signOut}
            disabled={working}
            className="
              rounded-full
              border
              border-white/40
              bg-black/45
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-lg
              backdrop-blur-md
              transition
              hover:bg-black/60
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {working ? "Signing out…" : "Sign out"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              openAuthentication("sign-in")
            }
            disabled={authLoading}
            className="
              rounded-full
              border
              border-white/40
              bg-black/45
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-lg
              backdrop-blur-md
              transition
              hover:bg-black/60
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {authLoading ? "Checking…" : "Sign in"}
          </button>
        )}
      </div>

      {!authLoading && user ? (
        <Link
          href="/office"
          aria-label="Enter the Smiling Monad Space"
          className="
            absolute
            inset-0
            z-10
            cursor-pointer
            outline-none
            focus-visible:ring-4
            focus-visible:ring-inset
            focus-visible:ring-white/70
          "
        />
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex justify-center px-5 sm:bottom-10">
        <div className="pointer-events-auto flex max-w-md flex-col items-center gap-3 text-center">
          {!authLoading && user ? (
            <>
              <Link
                href="/office"
                className="
                  rounded-full
                  border
                  border-[#f4e7cf]/60
                  bg-[#5a3826]/90
                  px-8
                  py-3.5
                  font-serif
                  text-lg
                  font-semibold
                  text-[#fffaf1]
                  shadow-xl
                  backdrop-blur-sm
                  transition
                  hover:bg-[#482c1e]
                "
              >
                Enter the Smiling Monad Space
              </Link>

              <p className="rounded-full bg-black/35 px-4 py-2 text-xs text-white/90 backdrop-blur-sm">
                Signed in as {user.email}
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  openAuthentication("sign-in")
                }
                disabled={authLoading}
                className="
                  rounded-full
                  border
                  border-[#f4e7cf]/60
                  bg-[#5a3826]/90
                  px-8
                  py-3.5
                  font-serif
                  text-lg
                  font-semibold
                  text-[#fffaf1]
                  shadow-xl
                  backdrop-blur-sm
                  transition
                  hover:bg-[#482c1e]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                Sign in to enter
              </button>

              <button
                type="button"
                onClick={() =>
                  openAuthentication(
                    "create-account",
                  )
                }
                disabled={authLoading}
                className="
                  rounded-full
                  border
                  border-white/35
                  bg-black/35
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  backdrop-blur-sm
                  transition
                  hover:bg-black/50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                Create account
              </button>
            </>
          )}

          {!authOpen && message ? (
            <p className="rounded-2xl bg-black/60 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-md">
              {message}
            </p>
          ) : null}
        </div>
      </div>

      {authOpen ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 px-5 backdrop-blur-sm">
          <section className="relative w-full max-w-md rounded-[28px] border border-[#d8c3a5] bg-[#f7efe2]/95 p-6 text-[#3f2c20] shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={closeAuthentication}
              disabled={working}
              aria-label="Close authentication"
              className="
                absolute
                right-4
                top-4
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                border
                border-[#8d735d]/35
                bg-white/45
                text-xl
                transition
                hover:bg-white/80
                disabled:opacity-50
              "
            >
              ×
            </button>

            <div className="pr-10">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#806650]">
                The Smiling Monad
              </p>

              <h1 className="mt-2 font-serif text-3xl">
                {authMode === "sign-in"
                  ? "Welcome home"
                  : "Create your account"}
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#675447]">
                {authMode === "sign-in"
                  ? "Sign in to enter your private Smiling Monad Space."
                  : "Create an account to begin using the Smiling Monad Space."}
              </p>
            </div>

            <form
              onSubmit={submitAuthentication}
              className="mt-6 space-y-4"
            >
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  Email
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                  className="
                    w-full
                    rounded-xl
                    border
                    border-[#a78e77]
                    bg-white/75
                    px-4
                    py-3
                    outline-none
                    transition
                    focus:border-[#65442f]
                    focus:ring-2
                    focus:ring-[#65442f]/20
                  "
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">
                  Password
                </span>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete={
                    authMode === "sign-in"
                      ? "current-password"
                      : "new-password"
                  }
                  minLength={6}
                  required
                  className="
                    w-full
                    rounded-xl
                    border
                    border-[#a78e77]
                    bg-white/75
                    px-4
                    py-3
                    outline-none
                    transition
                    focus:border-[#65442f]
                    focus:ring-2
                    focus:ring-[#65442f]/20
                  "
                />
              </label>

              {message ? (
                <p className="rounded-xl border border-[#b99d82]/45 bg-white/55 px-4 py-3 text-sm leading-5">
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={working}
                className="
                  w-full
                  rounded-xl
                  bg-[#60402d]
                  px-5
                  py-3.5
                  font-semibold
                  text-white
                  shadow-md
                  transition
                  hover:bg-[#4c3122]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {working
                  ? "Please wait…"
                  : authMode === "sign-in"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setAuthMode((currentMode) =>
                  currentMode === "sign-in"
                    ? "create-account"
                    : "sign-in",
                );
                setMessage("");
                setPassword("");
              }}
              disabled={working}
              className="mt-5 w-full text-sm font-semibold underline decoration-[#806650]/50 underline-offset-4"
            >
              {authMode === "sign-in"
                ? "Need an account? Create one"
                : "Already have an account? Sign in"}
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}