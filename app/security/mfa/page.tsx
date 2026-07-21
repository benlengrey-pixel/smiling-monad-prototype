"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PageStatus =
  | "checking"
  | "enrol"
  | "verify"
  | "complete"
  | "error";

type TotpEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

function getReturnPath(): string {
  if (typeof window === "undefined") {
    return "/office";
  }

  const parameters =
    new URLSearchParams(
      window.location.search,
    );

  const returnTo =
    parameters.get("returnTo");

  if (
    returnTo &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//") &&
    returnTo !== "/security/mfa"
  ) {
    return returnTo;
  }

  return "/office";
}

export default function MfaSecurityPage() {
  const router = useRouter();

  const [status, setStatus] =
    useState<PageStatus>("checking");

  const [enrollment, setEnrollment] =
    useState<TotpEnrollment | null>(null);

  const [
    existingFactorId,
    setExistingFactorId,
  ] = useState("");

  const [code, setCode] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [working, setWorking] =
    useState(false);

  async function inspectFactors() {
    const supabase =
      getSupabaseBrowserClient();

    const {
      data: factors,
      error,
    } =
      await supabase.auth.mfa
        .listFactors();

    if (error) {
      throw error;
    }

    const verifiedFactor =
      factors.totp.find(
        (factor) =>
          factor.status === "verified",
      );

    if (verifiedFactor) {
      setExistingFactorId(
        verifiedFactor.id,
      );
      setEnrollment(null);
      setStatus("verify");
      return;
    }

    if (factors.totp.length > 0) {
      setExistingFactorId(
        factors.totp[0].id,
      );

      setMessage(
        "An unfinished authenticator setup was found. Reset it before setting up the authenticator again.",
      );

      setStatus("enrol");
      return;
    }

    setExistingFactorId("");
    setMessage("");
    setStatus("enrol");
  }

  useEffect(() => {
    let active = true;

    async function checkMfa() {
      try {
        const supabase =
          getSupabaseBrowserClient();

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (userError || !user) {
          router.replace(
            `/sign-in?returnTo=${encodeURIComponent(
              window.location.pathname +
                window.location.search,
            )}`,
          );
          return;
        }

        const {
          data: assurance,
          error: assuranceError,
        } =
          await supabase.auth.mfa
            .getAuthenticatorAssuranceLevel();

        if (assuranceError) {
          throw assuranceError;
        }

        if (
          assurance.currentLevel ===
          "aal2"
        ) {
          setStatus("complete");

          window.setTimeout(() => {
            router.replace(
              getReturnPath(),
            );
          }, 800);

          return;
        }

        await inspectFactors();
      } catch (error) {
        if (!active) {
          return;
        }

        setMessage(
          error instanceof Error
            ? error.message
            : "MFA security could not be checked.",
        );

        setStatus("error");
      }
    }

    void checkMfa();

    return () => {
      active = false;
    };
  }, [router]);

  async function resetAuthenticator() {
    if (
      working ||
      !existingFactorId
    ) {
      return;
    }

    setWorking(true);
    setMessage("");

    try {
      const supabase =
        getSupabaseBrowserClient();

      const { error } =
        await supabase.auth.mfa
          .unenroll({
            factorId:
              existingFactorId,
          });

      if (error) {
        throw error;
      }

      setExistingFactorId("");
      setEnrollment(null);
      setCode("");
      setMessage(
        "The old authenticator setup was removed. You can now set it up again.",
      );
      setStatus("enrol");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The authenticator could not be reset.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function beginEnrollment() {
    if (working) {
      return;
    }

    if (existingFactorId) {
      setMessage(
        "Reset the existing authenticator before creating a new one.",
      );
      return;
    }

    setWorking(true);
    setMessage("");
    setEnrollment(null);

    try {
      const supabase =
        getSupabaseBrowserClient();

      const { data, error } =
        await supabase.auth.mfa
          .enroll({
            factorType: "totp",
            friendlyName:
              "Smiling Monad authenticator",
          });

      if (error) {
        throw error;
      }

      setEnrollment({
        factorId: data.id,
        qrCode:
          data.totp.qr_code,
        secret:
          data.totp.secret,
      });

      setExistingFactorId(
        data.id,
      );
      setStatus("verify");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Authenticator setup could not begin.",
      );

      setStatus("enrol");
    } finally {
      setWorking(false);
    }
  }

  async function verifyCode(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanCode =
      code
        .replace(/\s/g, "")
        .trim();

    const factorId =
      enrollment?.factorId ||
      existingFactorId;

    if (
      !factorId ||
      cleanCode.length !== 6
    ) {
      setMessage(
        "Enter the six-digit code from your authenticator app.",
      );
      return;
    }

    setWorking(true);
    setMessage("");

    try {
      const supabase =
        getSupabaseBrowserClient();

      const { error } =
        await supabase.auth.mfa
          .challengeAndVerify({
            factorId,
            code: cleanCode,
          });

      if (error) {
        throw error;
      }

      setStatus("complete");
      setCode("");

      window.setTimeout(() => {
        router.replace(
          getReturnPath(),
        );
      }, 800);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The authenticator code could not be verified.",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-5 py-10 text-[#2c2a26]">
      <section className="w-full max-w-lg rounded-[2rem] border border-black/10 bg-white/85 p-7 shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/45">
          Smiling Monad Security
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Protect participant information
        </h1>

        <p className="mt-4 leading-7 text-black/60">
          Use an authenticator app as a second
          security check before opening participant
          information.
        </p>

        {status === "checking" ? (
          <p className="mt-7 rounded-2xl bg-black/5 px-4 py-3">
            Checking account security…
          </p>
        ) : null}

        {status === "enrol" ? (
          <div className="mt-7 space-y-3">
            {existingFactorId ? (
              <button
                type="button"
                onClick={() => {
                  void resetAuthenticator();
                }}
                disabled={working}
                className="w-full rounded-full border border-[#60432f] px-6 py-3 font-semibold text-[#60432f] disabled:opacity-50"
              >
                {working
                  ? "Resetting authenticator…"
                  : "Reset existing authenticator"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  void beginEnrollment();
                }}
                disabled={working}
                className="w-full rounded-full bg-[#60432f] px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {working
                  ? "Preparing authenticator…"
                  : "Set up authenticator"}
              </button>
            )}
          </div>
        ) : null}

        {status === "verify" ? (
          <>
            {enrollment ? (
              <div className="mt-7 rounded-3xl border border-black/10 bg-white p-5">
                <p className="font-semibold">
                  Scan this QR code
                </p>

                <img
                  src={enrollment.qrCode}
                  alt="Authenticator QR code"
                  className="mx-auto mt-5 h-56 w-56"
                />

                <p className="mt-5 text-sm leading-6 text-black/55">
                  Or enter this setup key manually:
                </p>

                <code className="mt-2 block break-all rounded-xl bg-black/5 p-3 text-sm">
                  {enrollment.secret}
                </code>
              </div>
            ) : (
              <p className="mt-7 rounded-2xl bg-black/5 px-4 py-3 leading-6">
                Open your authenticator app and enter
                the current code for Smiling Monad.
              </p>
            )}

            <form
              onSubmit={verifyCode}
              className="mt-6"
            >
              <label className="block">
                <span className="text-sm font-semibold">
                  Six-digit code
                </span>

                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-center text-2xl tracking-[0.35em] outline-none focus:border-black/40"
                />
              </label>

              <button
                type="submit"
                disabled={
                  working ||
                  code.length !== 6
                }
                className="mt-4 w-full rounded-full bg-[#60432f] px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {working
                  ? "Verifying…"
                  : "Verify and continue"}
              </button>
            </form>

            {!enrollment ? (
              <button
                type="button"
                onClick={() => {
                  void resetAuthenticator();
                }}
                disabled={working}
                className="mt-3 w-full rounded-full border border-black/15 px-6 py-3 font-semibold"
              >
                Reset authenticator
              </button>
            ) : null}
          </>
        ) : null}

        {status === "complete" ? (
          <p className="mt-7 rounded-2xl bg-[#e8f0e3] px-4 py-4 font-semibold text-[#405237]">
            Two-step security is active. Opening the
            Smiling Monad Space…
          </p>
        ) : null}

        {status === "error" ? (
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="mt-7 w-full rounded-full bg-[#60432f] px-6 py-3 font-semibold text-white"
          >
            Check security again
          </button>
        ) : null}

        {message ? (
          <p className="mt-5 rounded-2xl bg-[#f4e3df] px-4 py-3 text-sm leading-6 text-[#7b3f34]">
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}