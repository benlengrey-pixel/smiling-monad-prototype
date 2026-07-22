"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  readDeviceConfirmationStatus,
  registerDevicePasskey,
  type DeviceConfirmationStatus,
} from "@/lib/auth/identity-confirmation-client";

export default function DeviceSecurityPage() {
  const [status, setStatus] =
    useState<DeviceConfirmationStatus | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const refreshStatus =
    useCallback(async () => {
      setLoading(true);
      setMessage("");

      try {
        const nextStatus =
          await readDeviceConfirmationStatus();

        setStatus(nextStatus);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Security status could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function setUpDevice() {
    if (working) {
      return;
    }

    setWorking(true);
    setMessage("");

    try {
      const nextStatus =
        await registerDevicePasskey();

      setStatus(nextStatus);
      setMessage(
        "Fingerprint, face or device PIN is ready.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Device confirmation could not be set up.",
      );
    } finally {
      setWorking(false);
    }
  }

  const needsExistingMfa =
    status?.nextLevel === "aal2" &&
    status.currentLevel !== "aal2";

  return (
    <main className="min-h-screen bg-[#17120f] px-4 py-8 text-[#3f342d]">
      <section className="mx-auto w-full max-w-xl rounded-[32px] border border-white/30 bg-[#f7f1e7] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#708064]">
              Account security
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              Set up this device
            </h1>
          </div>

          <Link
            href="/office"
            className="rounded-full border border-[#cbbca9] bg-white px-4 py-2 text-sm font-semibold"
          >
            Back
          </Link>
        </div>

        <p className="mt-5 leading-7 text-[#63574e]">
          Set up fingerprint, facial recognition or
          your device PIN once. After setup, you can
          use it to confirm sensitive actions such as
          recording or withdrawing privacy consent.
        </p>

        <div className="mt-6 rounded-[24px] border border-[#c7d4bd] bg-[#eaf1e5] p-5">
          {loading ? (
            <p className="font-semibold">
              Checking this device…
            </p>
          ) : status?.ready ? (
            <>
              <p className="text-lg font-semibold text-[#405237]">
                Device confirmation is ready
              </p>

              <p className="mt-2 leading-6 text-[#53634b]">
                This account has{" "}
                {status.passkeyCount} registered{" "}
                {status.passkeyCount === 1
                  ? "passkey"
                  : "passkeys"}.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-[#405237]">
                Device confirmation is not set up
              </p>

              <p className="mt-2 leading-6 text-[#53634b]">
                Your phone or computer will use its
                normal fingerprint, face or PIN
                security.
              </p>
            </>
          )}
        </div>

        {!loading && !status?.ready ? (
          <div className="mt-6">
            {needsExistingMfa ? (
              <div className="rounded-[22px] border border-[#dfc7a9] bg-[#fff3df] p-4 leading-6 text-[#6d4d2d]">
                Complete the existing two-step
                security check for this account,
                then return here and set up this
                device.
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                void setUpDevice();
              }}
              disabled={
                working ||
                needsExistingMfa
              }
              className="mt-4 w-full rounded-full bg-[#405237] px-6 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {working
                ? "Setting up device…"
                : "Set up fingerprint, face or PIN"}
            </button>
          </div>
        ) : null}

        {message ? (
          <div
            className={`mt-5 rounded-[20px] px-4 py-3 leading-6 ${
              status?.ready
                ? "border border-[#bdd0b3] bg-[#edf5e9] text-[#405237]"
                : "border border-[#e2bdb5] bg-[#fae8e4] text-[#7b4038]"
            }`}
          >
            {message}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void refreshStatus();
          }}
          disabled={loading || working}
          className="mt-5 w-full rounded-full border border-[#cbbca9] bg-white px-5 py-3 font-semibold disabled:opacity-50"
        >
          Refresh security status
        </button>
      </section>
    </main>
  );
}