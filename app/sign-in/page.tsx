"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

export default function SignInPage() {
  const [mode, setMode] =
    useState<Mode>("sign-in");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [signedInEmail, setSignedInEmail] =
    useState<string | null>(null);

  useEffect(() => {
    const supabase =
      getSupabaseBrowserClient();

    let active = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) {
          return;
        }

        setSignedInEmail(
          data.user?.email ?? null,
        );
      });

    const {
      data: subscription,
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSignedInEmail(
          session?.user.email ?? null,
        );
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanedEmail =
      email.trim().toLowerCase();

    if (!cleanedEmail) {
      setMessage(
        "Enter your email address.",
      );
      return;
    }

    if (password.length < 8) {
      setMessage(
        "Use a password with at least 8 characters.",
      );
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const supabase =
        getSupabaseBrowserClient();

      if (mode === "sign-up") {
        const { data, error } =
          await supabase.auth.signUp({
            email: cleanedEmail,
            password,
          });

        if (error) {
          throw error;
        }

        if (data.session) {
          setMessage(
            "Your account has been created and you are signed in.",
          );
        } else {
          setMessage(
            "Your account has been created. Check your email and confirm your address before signing in.",
          );
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword(
            {
              email: cleanedEmail,
              password,
            },
          );

        if (error) {
          throw error;
        }

        setMessage(
          "You are signed in.",
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Authentication failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setMessage("");

    try {
      const supabase =
        getSupabaseBrowserClient();

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setMessage(
        "You are signed out.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign out.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <div className="mx-auto max-w-xl">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm sm:p-9">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/50">
            Smiling Monad
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Secure account
          </h1>

          <p className="mt-4 leading-7 text-black/65">
            Sign in before training records are
            saved to the secure Smiling Monad
            database.
          </p>

          {signedInEmail ? (
            <div className="mt-7 rounded-3xl border border-[#b8c7a8] bg-[#eef3e8] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-black/45">
                Signed in
              </p>

              <p className="mt-2 break-all text-lg font-semibold">
                {signedInEmail}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/circle"
                  className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
                >
                  Open Circle Centre
                </Link>

                <button
                  type="button"
                  onClick={signOut}
                  disabled={busy}
                  className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold disabled:opacity-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-7 grid grid-cols-2 rounded-full bg-black/5 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setMode("sign-in")
                  }
                  className={`rounded-full px-4 py-3 text-sm font-semibold ${
                    mode === "sign-in"
                      ? "bg-white shadow-sm"
                      : "text-black/55"
                  }`}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMode("sign-up")
                  }
                  className={`rounded-full px-4 py-3 text-sm font-semibold ${
                    mode === "sign-up"
                      ? "bg-white shadow-sm"
                      : "text-black/55"
                  }`}
                >
                  Create account
                </button>
              </div>

              <form
                onSubmit={submit}
                className="mt-6 space-y-4"
              >
                <label className="block">
                  <span className="text-sm font-semibold">
                    Email address
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    autoComplete="email"
                    className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">
                    Password
                  </span>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    autoComplete={
                      mode === "sign-up"
                        ? "new-password"
                        : "current-password"
                    }
                    className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black/40"
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-[#2c2a26] px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {busy
                    ? "Please wait…"
                    : mode === "sign-up"
                      ? "Create secure account"
                      : "Sign in"}
                </button>
              </form>
            </>
          )}

          {message ? (
            <p className="mt-5 rounded-2xl bg-black/5 px-4 py-3 text-sm leading-6">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}