"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";

import {
  createParticipantPrivacyConsent,
  readParticipantConsentGateStatus,
  withdrawParticipantPrivacyConsent,
  type ConsentAuthorityBasis,
  type ConsentInformationCategory,
  type ConsentPermittedRole,
  type ParticipantConsentGateStatus,
} from "@/lib/circle/privacy-consent-client";

import {
  sendIdentityEmailCode,
} from "@/lib/auth/identity-confirmation-client";

type ParticipantPrivacyGateProps = {
  participantId: string;
  circleId: string;
  participantName: string;
  children: ReactNode;
};

const informationOptions: Array<{
  value: ConsentInformationCategory;
  label: string;
}> = [
  {
    value: "identity",
    label: "Identity and preferred name",
  },
  {
    value: "goals",
    label: "Goals and aspirations",
  },
  {
    value: "communication",
    label: "Communication and decision support",
  },
  {
    value: "daily_life",
    label: "Daily life, routines and preferences",
  },
  {
    value: "support_notes",
    label: "Support notes",
  },
  {
    value: "contact",
    label: "Contact information",
  },
  {
    value: "health",
    label: "Health information",
  },
  {
    value: "medication",
    label: "Medication information",
  },
  {
    value: "behaviour",
    label: "Behaviour and incident information",
  },
  {
    value: "financial",
    label: "Financial information",
  },
  {
    value: "documents",
    label: "Documents and reports",
  },
  {
    value: "photos",
    label: "Photographs",
  },
];

const roleOptions: Array<{
  value: ConsentPermittedRole;
  label: string;
}> = [
  {
    value: "participant",
    label: "Participant",
  },
  {
    value: "nominee",
    label: "Nominee",
  },
  {
    value: "family",
    label: "Family",
  },
  {
    value: "support_worker",
    label: "Support workers",
  },
  {
    value: "support_coordinator",
    label: "Support coordinators",
  },
  {
    value: "professional",
    label: "Approved professionals",
  },
  {
    value: "circle_manager",
    label: "Circle manager",
  },
];

function todayValue(): string {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function toIsoOrNull(
  value: string,
): string | null {
  if (!value) {
    return null;
  }

  return new Date(
    `${value}T00:00:00`,
  ).toISOString();
}

export default function ParticipantPrivacyGate({
  participantId,
  circleId,
  participantName,
  children,
}: ParticipantPrivacyGateProps) {
  const [status, setStatus] =
    useState<ParticipantConsentGateStatus | null>(
      null,
    );

  const [checking, setChecking] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const confirmationMethod =
    "email_code" as const;

  const [emailCode, setEmailCode] =
    useState("");

  const [emailCodeSent, setEmailCodeSent] =
    useState(false);

  const [emailDestination, setEmailDestination] =
    useState("");

  const [givenByName, setGivenByName] =
    useState("");

  const [authorityBasis, setAuthorityBasis] =
    useState<ConsentAuthorityBasis>(
      "self",
    );

  const [purpose, setPurpose] =
    useState(
      "To create and test a secure person-centred Circle of Support profile.",
    );

  const [
    informationCategories,
    setInformationCategories,
  ] = useState<
    ConsentInformationCategory[]
  >([
    "identity",
    "goals",
    "communication",
    "daily_life",
  ]);

  const [
    permittedRoles,
    setPermittedRoles,
  ] = useState<ConsentPermittedRole[]>([
    "participant",
    "circle_manager",
  ]);

  const [restrictions, setRestrictions] =
    useState(
      "Do not add clinical documents, medication details, incident records, photographs or financial information during the initial practice period.",
    );

  const [evidenceNotes, setEvidenceNotes] =
    useState("");

  const [consentDate, setConsentDate] =
    useState(todayValue());

  const [reviewDate, setReviewDate] =
    useState("");

  const [expiryDate, setExpiryDate] =
    useState("");

  const [
    withdrawalReason,
    setWithdrawalReason,
  ] = useState("");

  async function refreshStatus() {
    setChecking(true);
    setMessage("");

    try {
      const nextStatus =
        await readParticipantConsentGateStatus(
          participantId,
          circleId,
        );

      setStatus(nextStatus);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Privacy consent could not be checked.",
      );
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, [participantId, circleId]);

  function toggleInformationCategory(
    category: ConsentInformationCategory,
  ) {
    setInformationCategories(
      (current) =>
        current.includes(category)
          ? current.filter(
              (item) =>
                item !== category,
            )
          : [...current, category],
    );
  }

  function toggleRole(
    role: ConsentPermittedRole,
  ) {
    setPermittedRoles(
      (current) =>
        current.includes(role)
          ? current.filter(
              (item) =>
                item !== role,
            )
          : [...current, role],
    );
  }

  async function sendEmailCode() {
    if (working) {
      return;
    }

    setWorking(true);
    setMessage("");

    try {
      const result =
        await sendIdentityEmailCode();

      setEmailDestination(
        result.email,
      );
      setEmailCodeSent(true);
      setMessage(
        `A six-digit code was sent to ${result.email}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The email code could not be sent.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function submitConsent(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !givenByName.trim() ||
      !purpose.trim() ||
      informationCategories.length === 0 ||
      permittedRoles.length === 0
    ) {
      setMessage(
        "Complete the required privacy consent details.",
      );
      return;
    }

    setWorking(true);
    setMessage("");

    try {
      await createParticipantPrivacyConsent({
        participantId,
        circleId,
        givenByUserId: null,
        givenByName,
        authorityBasis,
        purpose,
        informationScope:
          informationCategories.join(
            ", ",
          ),
        recipientScope:
          permittedRoles.join(", "),
        informationCategories,
        permittedRoles,
        restrictions,
        evidenceNotes,
        consentedAt:
          new Date(
            `${consentDate}T00:00:00`,
          ).toISOString(),
        validFrom:
          new Date(
            `${consentDate}T00:00:00`,
          ).toISOString(),
        validUntil:
          toIsoOrNull(expiryDate),
        reviewDueAt:
          toIsoOrNull(reviewDate),
      }, confirmationMethod === "email_code"
        ? {
            method: "email_code",
            code: emailCode,
          }
        : {
            method: "passkey",
          });

      setEmailCode("");
      setEmailCodeSent(false);

      setMessage(
        "Privacy consent recorded securely.",
      );

      await refreshStatus();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Privacy consent could not be recorded.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function withdrawConsent() {
    if (
      !status?.consent_id ||
      !withdrawalReason.trim() ||
      working
    ) {
      return;
    }

    setWorking(true);
    setMessage("");

    try {
      await withdrawParticipantPrivacyConsent(
        status.consent_id,
        withdrawalReason,
      );

      setWithdrawalReason("");

      setMessage(
        "Consent withdrawn. The profile is now locked.",
      );

      await refreshStatus();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Consent could not be withdrawn.",
      );
    } finally {
      setWorking(false);
    }
  }

  if (checking) {
    return (
      <div className="mt-6 rounded-[22px] border border-[#d8c7b1] bg-[#efe3d3] p-5">
        Checking privacy consent and secure access…
      </div>
    );
  }

  if (status?.allowed) {
    return (
      <>
        <section className="mt-6 rounded-[22px] border border-[#bfd0b5] bg-[#e8f0e3] p-5">
          <p className="font-semibold text-[#405237]">
            Privacy consent active
          </p>

          <p className="mt-2 text-sm leading-6 text-[#53634a]">
            The profile may be opened because active
            consent and Circle membership have been
            confirmed.
          </p>

          {status.restrictions ? (
            <p className="mt-3 rounded-2xl bg-white/60 px-4 py-3 text-sm leading-6">
              <strong>Restrictions:</strong>{" "}
              {status.restrictions}
            </p>
          ) : null}
        </section>

        {children}

        <section className="mt-6 rounded-[22px] border border-[#dfc9c2] bg-[#f4e3df] p-5">
          <p className="font-semibold text-[#733f35]">
            Withdraw consent
          </p>

          <p className="mt-2 text-sm leading-6 text-[#754f47]">
            Withdrawing consent requires confirmation
            using your fingerprint, face or device PIN.
          </p>

          <textarea
            value={withdrawalReason}
            onChange={(event) =>
              setWithdrawalReason(
                event.target.value,
              )
            }
            placeholder="Reason consent is being withdrawn"
            className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-[#d6bdb5] bg-white px-4 py-3"
          />

          <button
            type="button"
            onClick={() => {
              void withdrawConsent();
            }}
            disabled={
              working ||
              !withdrawalReason.trim()
            }
            className="mt-3 rounded-full bg-[#733f35] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {working
              ? "Confirming your identity…"
              : "Confirm and withdraw consent"}
          </button>
        </section>

        {message ? (
          <p className="mt-4 rounded-2xl bg-black/5 px-4 py-3 text-sm">
            {message}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <form
      onSubmit={submitConsent}
      className="mt-6 space-y-5"
    >
      <section className="rounded-[22px] border border-[#d8c7b1] bg-[#efe3d3] p-5">
        <p className="font-serif text-2xl">
          Privacy consent required
        </p>

        <p className="mt-3 leading-7 text-[#6a5b4e]">
          The profile for{" "}
          {participantName || "this person"}{" "}
          remains locked until valid consent is
          recorded.
        </p>
      </section>

      <label className="block">
        <span className="text-sm font-semibold">
          Person or authorised representative
        </span>

        <input
          value={givenByName}
          onChange={(event) =>
            setGivenByName(
              event.target.value,
            )
          }
          className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold">
          Authority basis
        </span>

        <select
          value={authorityBasis}
          onChange={(event) =>
            setAuthorityBasis(
              event.target
                .value as ConsentAuthorityBasis,
            )
          }
          className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
        >
          <option value="self">
            The person
          </option>

          <option value="supported_decision">
            Supported decision
          </option>

          <option value="nominee">
            Nominee
          </option>

          <option value="guardian">
            Guardian
          </option>

          <option value="parent">
            Parent
          </option>

          <option value="other">
            Other authority
          </option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-semibold">
          Purpose of collection
        </span>

        <textarea
          value={purpose}
          onChange={(event) =>
            setPurpose(
              event.target.value,
            )
          }
          className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-semibold">
          Information permitted
        </legend>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {informationOptions.map(
            (option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 rounded-2xl border border-[#ddcfbc] bg-white p-3"
              >
                <input
                  type="checkbox"
                  checked={informationCategories.includes(
                    option.value,
                  )}
                  onChange={() =>
                    toggleInformationCategory(
                      option.value,
                    )
                  }
                  className="mt-1"
                />

                <span className="text-sm">
                  {option.label}
                </span>
              </label>
            ),
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">
          People or roles permitted
        </legend>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {roleOptions.map(
            (option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 rounded-2xl border border-[#ddcfbc] bg-white p-3"
              >
                <input
                  type="checkbox"
                  checked={permittedRoles.includes(
                    option.value,
                  )}
                  onChange={() =>
                    toggleRole(
                      option.value,
                    )
                  }
                  className="mt-1"
                />

                <span className="text-sm">
                  {option.label}
                </span>
              </label>
            ),
          )}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className="text-sm font-semibold">
            Consent date
          </span>

          <input
            type="date"
            value={consentDate}
            onChange={(event) =>
              setConsentDate(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
          />
        </label>

        <label>
          <span className="text-sm font-semibold">
            Review date
          </span>

          <input
            type="date"
            value={reviewDate}
            onChange={(event) =>
              setReviewDate(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
          />
        </label>

        <label>
          <span className="text-sm font-semibold">
            Expiry date
          </span>

          <input
            type="date"
            value={expiryDate}
            onChange={(event) =>
              setExpiryDate(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold">
          Restrictions
        </span>

        <textarea
          value={restrictions}
          onChange={(event) =>
            setRestrictions(
              event.target.value,
            )
          }
          className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold">
          Evidence or notes
        </span>

        <textarea
          value={evidenceNotes}
          onChange={(event) =>
            setEvidenceNotes(
              event.target.value,
            )
          }
          placeholder="How consent was explained, communication support used, and how agreement was expressed."
          className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3"
        />
      </label>

      <section className="rounded-[22px] border border-[#bfd0b5] bg-[#e8f0e3] p-4 text-[#405237]">
        <p className="font-semibold">
          Confirm it&apos;s you
        </p>

        <p className="mt-2 text-sm leading-6">
          Send a six-digit code to the email address
          already linked to your signed-in account.
        </p>

        <div className="mt-4 rounded-2xl bg-white/70 p-4">
          {!emailCodeSent ? (
            <button
              type="button"
              onClick={() => {
                void sendEmailCode();
              }}
              disabled={working}
              className="w-full rounded-full border border-[#9bae90] bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {working
                ? "Sending code…"
                : "Send code to my email"}
            </button>
          ) : (
            <>
              <p className="text-sm leading-6">
                Enter the six-digit code sent to{" "}
                <strong>
                  {emailDestination}
                </strong>
                .
              </p>

              <input
                value={emailCode}
                onChange={(event) =>
                  setEmailCode(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6),
                  )
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Six-digit code"
                className="mt-3 w-full rounded-2xl border border-[#b9c8b0] bg-white px-4 py-3 text-center text-lg tracking-[0.35em]"
              />

              <button
                type="button"
                onClick={() => {
                  void sendEmailCode();
                }}
                disabled={working}
                className="mt-3 text-sm font-semibold underline"
              >
                Send a new code
              </button>
            </>
          )}
        </div>
      </section>

      <button
        type="submit"
        disabled={
          working ||
          emailCode.length !== 6
        }
        className="w-full rounded-full bg-[#60432f] px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {working
          ? "Confirming your identity…"
          : "Verify code and record consent"}
      </button>

      {message ? (
        <p className="rounded-2xl bg-[#f4e3df] px-4 py-3 text-sm leading-6 text-[#7b3f34]">
          {message}
        </p>
      ) : null}
    </form>
  );
}