"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createParticipantSecureCircle,
  type CreateParticipantSecureCircleInput,
  type ParticipantCircleAuthorityType,
  type ParticipantCircleCreatorRole,
  type SecureCircleDirectoryEntry,
} from "@/lib/circle/secure-circle-directory-client";
import {
  acceptSecureCircleInvitation,
  declineSecureCircleInvitation,
  readMySecureCircleInvitations,
  type SecureCircleInvitation,
} from "@/lib/circle/secure-invitations-client";

type CircleDirectoryProps = {
  entries: SecureCircleDirectoryEntry[];
  loading: boolean;
  creating: boolean;
  openingCircleId: string;
  message: string;
  onCreateOwnCircle: () => void;
  onOpenCircle: (
    circleId: string,
  ) => void;
};

const emptyParticipantCircleForm:
  CreateParticipantSecureCircleInput = {
    fullName: "",
    preferredName: "",
    circleName: "",
    creatorRole: "circle_manager",
    relationship: "",
    authorityType:
      "participant_request",
    authorityBasis: "",
    authorityConfirmed: false,
  };

function roleLabel(
  role: SecureCircleDirectoryEntry["membership"]["role"],
): string {
  switch (role) {
    case "participant":
      return "Participant";

    case "nominee":
      return "Nominee";

    case "family":
      return "Family";

    case "support_worker":
      return "Support worker";

    case "support_coordinator":
      return "Support coordinator";

    case "professional":
      return "Professional";

    case "circle_manager":
      return "Circle manager";

    default:
      return "Circle member";
  }
}

function participantName(
  entry: SecureCircleDirectoryEntry,
): string {
  return (
    entry.participant.preferred_name.trim() ||
    entry.participant.full_name.trim() ||
    entry.circle.name
  );
}

function invitationRoleLabel(
  role: SecureCircleInvitation["role"],
): string {
  return role
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function alreadyBelongsToCircle(
  message: string,
): boolean {
  const normalised =
    message.toLowerCase();

  return (
    normalised.includes(
      "already belongs",
    ) ||
    normalised.includes(
      "already a member",
    ) ||
    normalised.includes(
      "already active",
    )
  );
}

function CircleCard({
  entry,
  opening,
  onOpen,
}: {
  entry: SecureCircleDirectoryEntry;
  opening: boolean;
  onOpen: () => void;
}) {
  return (
    <article className="rounded-[22px] border border-[#decfba] bg-white p-5 shadow-[0_12px_28px_rgba(71,49,32,0.08)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
            {entry.is_owned_circle
              ? "My own Circle"
              : roleLabel(
                  entry.membership.role,
                )}
          </p>

          <h2 className="mt-2 font-serif text-2xl text-[#3f2d20]">
            {participantName(entry)}
          </h2>

          <p className="mt-1 text-sm font-medium text-[#6c594a]">
            {entry.circle.name}
          </p>

          {entry.membership.relationship ? (
            <p className="mt-3 text-sm text-[#7a6859]">
              Relationship:{" "}
              {
                entry.membership
                  .relationship
              }
            </p>
          ) : null}

          {entry.circle.purpose ? (
            <p className="mt-3 max-w-2xl leading-7 text-[#6b5d50]">
              {entry.circle.purpose}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onOpen}
          disabled={opening}
          className="shrink-0 rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {opening
            ? "Opening…"
            : "Enter Circle"}
        </button>
      </div>
    </article>
  );
}

export default function CircleDirectory({
  entries,
  loading,
  creating,
  openingCircleId,
  message,
  onCreateOwnCircle,
  onOpenCircle,
}: CircleDirectoryProps) {
  const ownedCircles = entries.filter(
    (entry) => entry.is_owned_circle,
  );

  const supportedCircles =
    entries.filter(
      (entry) =>
        !entry.is_owned_circle,
    );

  const [
    participantCircleOpen,
    setParticipantCircleOpen,
  ] = useState(false);

  const [
    participantCircleForm,
    setParticipantCircleForm,
  ] = useState(
    emptyParticipantCircleForm,
  );

  const [
    participantCircleCreating,
    setParticipantCircleCreating,
  ] = useState(false);

  const [
    participantCircleMessage,
    setParticipantCircleMessage,
  ] = useState("");

  const [
    invitations,
    setInvitations,
  ] = useState<
    SecureCircleInvitation[]
  >([]);

  const [
    invitationsLoading,
    setInvitationsLoading,
  ] = useState(true);

  const [
    invitationWorkingId,
    setInvitationWorkingId,
  ] = useState("");

  const [
    invitationMessage,
    setInvitationMessage,
  ] = useState("");

  const visibleInvitations =
    invitations.filter(
      (invitation) =>
        !entries.some(
          (entry) =>
            entry.circle.id ===
              invitation.circle_id &&
            entry.membership
              .membership_status ===
              "active",
        ),
    );

  async function loadInvitations() {
    setInvitationsLoading(true);
    setInvitationMessage("");

    try {
      const records =
        await readMySecureCircleInvitations();

      setInvitations(records);
    } catch (error) {
      setInvitationMessage(
        error instanceof Error
          ? error.message
          : "Circle invitations could not be loaded.",
      );
    } finally {
      setInvitationsLoading(false);
    }
  }

  useEffect(() => {
    void loadInvitations();
  }, []);

  function updateParticipantCircleForm<
    Key extends keyof CreateParticipantSecureCircleInput,
  >(
    key: Key,
    value:
      CreateParticipantSecureCircleInput[Key],
  ) {
    setParticipantCircleForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  }

  async function submitParticipantCircle(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (participantCircleCreating) {
      return;
    }

    setParticipantCircleCreating(
      true,
    );
    setParticipantCircleMessage("");

    try {
      const result =
        await createParticipantSecureCircle(
          participantCircleForm,
        );

      setParticipantCircleForm(
        emptyParticipantCircleForm,
      );

      setParticipantCircleMessage(
        "The participant Circle has been created securely.",
      );

      window.location.assign(
        `/circle?circleId=${encodeURIComponent(
          result.circle.id,
        )}`,
      );
    } catch (error) {
      setParticipantCircleMessage(
        error instanceof Error
          ? error.message
          : "The participant Circle could not be created.",
      );

      setParticipantCircleCreating(
        false,
      );
    }
  }

  async function respondToInvitation(
    invitationId: string,
    response: "accept" | "decline",
  ) {
    if (invitationWorkingId) {
      return;
    }

    setInvitationWorkingId(
      invitationId,
    );
    setInvitationMessage("");

    try {
      if (response === "accept") {
        const accepted =
          await acceptSecureCircleInvitation(
            invitationId,
          );

        setInvitations((current) =>
          current.filter(
            (invitation) =>
              invitation.id !==
              invitationId,
          ),
        );

        setInvitationMessage(
          "Invitation accepted. Refreshing My Circles…",
        );

        window.location.assign(
          `/circle?circleId=${encodeURIComponent(
            accepted.circle_id,
          )}`,
        );

        return;
      }

      await declineSecureCircleInvitation(
        invitationId,
      );

      setInvitations((current) =>
        current.filter(
          (invitation) =>
            invitation.id !==
            invitationId,
        ),
      );

      setInvitationMessage(
        "Invitation declined.",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "The Circle invitation could not be updated.";

      if (
        response === "accept" &&
        alreadyBelongsToCircle(
          errorMessage,
        )
      ) {
        setInvitations((current) =>
          current.filter(
            (invitation) =>
              invitation.id !==
              invitationId,
          ),
        );

        setInvitationMessage(
          "You already belong to this Circle. Choose it from My Circles below.",
        );
      } else {
        setInvitationMessage(
          errorMessage,
        );
      }
    } finally {
      setInvitationWorkingId("");
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl rounded-[28px] border border-[#d9c7ad] bg-[rgba(255,250,241,0.98)] p-5 shadow-[0_30px_70px_rgba(25,18,12,0.32)] sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#decfba] pb-4">
        <Link
          href="/office"
          className="inline-flex items-center rounded-full border border-[#bfa98d] bg-white px-4 py-2 text-sm font-semibold text-[#533d2d] transition hover:bg-[#fffaf3]"
        >
          ← Back to Office
        </Link>

        <p className="text-sm font-medium text-[#8b745d]">
          Office&nbsp;&nbsp;›&nbsp;&nbsp;Circle
          Centre
        </p>
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        Circle of Support Centre
      </p>

      <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl leading-tight text-[#3f2d20] sm:text-4xl">
            Choose a Circle
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-[#68584a]">
            Select a Circle below to enter its
            private room. Invitations appear
            only when they still need your
            response.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="rounded-full border border-[#bfa98d] bg-white px-5 py-3 text-sm font-medium text-[#533d2d] transition hover:bg-[#fffaf3]"
          >
            Refresh Circles
          </button>

          <button
            type="button"
            onClick={() => {
              setParticipantCircleOpen(
                (current) => !current,
              );
            }}
            className="rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
          >
            {participantCircleOpen
              ? "Close new Circle form"
              : "Create a Circle for someone"}
          </button>

          {ownedCircles.length === 0 ? (
            <button
              type="button"
              onClick={onCreateOwnCircle}
              disabled={creating}
              className="rounded-full border border-[#bfa98d] bg-[#efe3d2] px-6 py-3 font-medium text-[#533d2d] transition hover:bg-[#e6d6c0] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {creating
                ? "Creating…"
                : "Create my own Circle"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onOpenCircle(
                  ownedCircles[0].circle.id,
                );
              }}
              disabled={
                openingCircleId ===
                ownedCircles[0].circle.id
              }
              className="rounded-full border border-[#bfa98d] bg-[#efe3d2] px-6 py-3 font-medium text-[#533d2d] transition hover:bg-[#e6d6c0] disabled:cursor-not-allowed disabled:opacity-55"
            >
              Enter my own Circle
            </button>
          )}
        </div>
      </div>

      {message ? (
        <p className="mt-5 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
          {message}
        </p>
      ) : null}

      {participantCircleOpen ? (
        <form
          onSubmit={
            submitParticipantCircle
          }
          className="mt-7 rounded-[24px] border border-[#d7c5ae] bg-[#f4eadc] p-5 sm:p-6"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a725d]">
              New participant Circle
            </p>

            <h2 className="mt-2 font-serif text-2xl text-[#3f2d20]">
              Create a Circle for someone else
            </h2>

            <p className="mt-3 leading-7 text-[#6b5c4e]">
              Start with only the person’s name
              and the reason you are authorised
              to establish the Circle. More
              personal information should be
              added later by authorised Circle
              members.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-[#594536]">
                Participant’s full name
              </span>

              <input
                value={
                  participantCircleForm.fullName
                }
                onChange={(event) =>
                  updateParticipantCircleForm(
                    "fullName",
                    event.target.value,
                  )
                }
                required
                maxLength={160}
                autoComplete="off"
                className="mt-2 w-full rounded-[16px] border border-[#cdb9a1] bg-white px-4 py-3 outline-none transition focus:border-[#795b43] focus:ring-4 focus:ring-[#795b43]/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#594536]">
                Preferred name
              </span>

              <input
                value={
                  participantCircleForm.preferredName ??
                  ""
                }
                onChange={(event) =>
                  updateParticipantCircleForm(
                    "preferredName",
                    event.target.value,
                  )
                }
                maxLength={120}
                autoComplete="off"
                className="mt-2 w-full rounded-[16px] border border-[#cdb9a1] bg-white px-4 py-3 outline-none transition focus:border-[#795b43] focus:ring-4 focus:ring-[#795b43]/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#594536]">
                Circle name
              </span>

              <input
                value={
                  participantCircleForm.circleName ??
                  ""
                }
                onChange={(event) =>
                  updateParticipantCircleForm(
                    "circleName",
                    event.target.value,
                  )
                }
                maxLength={180}
                placeholder="Created automatically when left blank"
                autoComplete="off"
                className="mt-2 w-full rounded-[16px] border border-[#cdb9a1] bg-white px-4 py-3 outline-none transition focus:border-[#795b43] focus:ring-4 focus:ring-[#795b43]/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#594536]">
                Your role in this Circle
              </span>

              <select
                value={
                  participantCircleForm.creatorRole
                }
                onChange={(event) =>
                  updateParticipantCircleForm(
                    "creatorRole",
                    event.target
                      .value as ParticipantCircleCreatorRole,
                  )
                }
                className="mt-2 w-full rounded-[16px] border border-[#cdb9a1] bg-white px-4 py-3 outline-none transition focus:border-[#795b43] focus:ring-4 focus:ring-[#795b43]/10"
              >
                <option value="circle_manager">
                  Circle manager
                </option>
                <option value="nominee">
                  Nominee
                </option>
                <option value="family">
                  Family
                </option>
                <option value="support_worker">
                  Support worker
                </option>
                <option value="support_coordinator">
                  Support coordinator
                </option>
                <option value="professional">
                  Professional
                </option>
                <option value="circle_member">
                  Circle member
                </option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#594536]">
                Your relationship to the person
              </span>

              <input
                value={
                  participantCircleForm.relationship
                }
                onChange={(event) =>
                  updateParticipantCircleForm(
                    "relationship",
                    event.target.value,
                  )
                }
                required
                maxLength={160}
                placeholder="For example: support worker"
                autoComplete="off"
                className="mt-2 w-full rounded-[16px] border border-[#cdb9a1] bg-white px-4 py-3 outline-none transition focus:border-[#795b43] focus:ring-4 focus:ring-[#795b43]/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#594536]">
                How was this Circle authorised?
              </span>

              <select
                value={
                  participantCircleForm.authorityType
                }
                onChange={(event) =>
                  updateParticipantCircleForm(
                    "authorityType",
                    event.target
                      .value as ParticipantCircleAuthorityType,
                  )
                }
                className="mt-2 w-full rounded-[16px] border border-[#cdb9a1] bg-white px-4 py-3 outline-none transition focus:border-[#795b43] focus:ring-4 focus:ring-[#795b43]/10"
              >
                <option value="participant_request">
                  Requested by the participant
                </option>
                <option value="nominee_authority">
                  Nominee authority
                </option>
                <option value="family_agreement">
                  Family agreement
                </option>
                <option value="support_setup_request">
                  Requested for support setup
                </option>
                <option value="other">
                  Other authority or agreement
                </option>
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-[#594536]">
              Participant request, consent or
              authority basis
            </span>

            <textarea
              value={
                participantCircleForm.authorityBasis
              }
              onChange={(event) =>
                updateParticipantCircleForm(
                  "authorityBasis",
                  event.target.value,
                )
              }
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              placeholder="Record who requested or authorised the Circle and the basis for creating it."
              className="mt-2 w-full resize-y rounded-[16px] border border-[#cdb9a1] bg-white px-4 py-3 outline-none transition focus:border-[#795b43] focus:ring-4 focus:ring-[#795b43]/10"
            />
          </label>

          <label className="mt-4 flex items-start gap-3 rounded-[18px] border border-[#d2bea5] bg-[#fffaf3] p-4">
            <input
              type="checkbox"
              checked={
                participantCircleForm.authorityConfirmed
              }
              onChange={(event) =>
                updateParticipantCircleForm(
                  "authorityConfirmed",
                  event.target.checked,
                )
              }
              required
              className="mt-1 h-5 w-5"
            />

            <span className="text-sm leading-6 text-[#665548]">
              I confirm that the participant,
              nominee or other authorised person
              has requested or authorised this
              Circle, and that I have accurately
              recorded the basis above.
            </span>
          </label>

          {participantCircleMessage ? (
            <p className="mt-4 rounded-[16px] border border-[#d5c3ad] bg-white px-4 py-3 text-sm leading-6 text-[#69594b]">
              {participantCircleMessage}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={
                participantCircleCreating
              }
              className="rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {participantCircleCreating
                ? "Creating Circle…"
                : "Create participant Circle"}
            </button>

            <button
              type="button"
              onClick={() => {
                setParticipantCircleOpen(
                  false,
                );
                setParticipantCircleMessage(
                  "",
                );
              }}
              disabled={
                participantCircleCreating
              }
              className="rounded-full border border-[#bfa98d] bg-white px-6 py-3 font-medium text-[#533d2d] transition hover:bg-[#fffaf3] disabled:opacity-55"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {invitationsLoading ||
      visibleInvitations.length > 0 ||
      invitationMessage ? (
      <section className="mt-8 rounded-[24px] border border-[#d9c7ad] bg-[#efe4d4] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-[#3f2d20]">
              Circle invitations
            </h2>

            <p className="mt-2 leading-7 text-[#6b5d50]">
              Invitations sent to the email
              address used for this account appear
              here. Accepting one adds that Circle
              to My Circles.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadInvitations();
            }}
            disabled={
              invitationsLoading
            }
            className="shrink-0 rounded-full border border-[#bca78d] bg-white px-5 py-3 text-sm font-medium text-[#594536] transition hover:bg-[#fffaf3] disabled:opacity-55"
          >
            {invitationsLoading
              ? "Checking…"
              : "Check invitations"}
          </button>
        </div>

        {invitationMessage ? (
          <p className="mt-4 rounded-[16px] border border-[#d5c3ad] bg-white px-4 py-3 text-sm leading-6 text-[#69594b]">
            {invitationMessage}
          </p>
        ) : null}

        <div className="mt-5 space-y-3">
          {invitationsLoading ? (
            <div className="rounded-[18px] border border-dashed border-[#c7b49d] bg-white/65 p-5 text-[#756151]">
              Checking for Circle
              invitations…
            </div>
          ) : visibleInvitations.length ===
            0 ? (
            <div className="rounded-[18px] border border-dashed border-[#c7b49d] bg-white/65 p-5 text-[#756151]">
              No pending Circle invitations were
              found for this account.
            </div>
          ) : (
            visibleInvitations.map(
              (invitation) => (
                <article
                  key={invitation.id}
                  className="rounded-[18px] border border-[#d8c7b2] bg-white p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-serif text-xl text-[#3f2d20]">
                        {invitation.circle
                          ?.name ||
                          invitation.display_name ||
                          "Circle invitation"}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[#746254]">
                        {invitationRoleLabel(
                          invitation.role,
                        )}

                        {invitation.relationship
                          ? ` · ${invitation.relationship}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void respondToInvitation(
                            invitation.id,
                            "accept",
                          );
                        }}
                        disabled={Boolean(
                          invitationWorkingId,
                        )}
                        className="rounded-full bg-[#60432f] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {invitationWorkingId ===
                        invitation.id
                          ? "Working…"
                          : "Accept"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void respondToInvitation(
                            invitation.id,
                            "decline",
                          );
                        }}
                        disabled={Boolean(
                          invitationWorkingId,
                        )}
                        className="rounded-full border border-[#c7b49d] bg-[#f7efe4] px-5 py-2.5 text-sm font-semibold text-[#604b3b] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </article>
              ),
            )
          )}
        </div>

      </section>
      ) : null}

      {loading ? (
        <div className="mt-7 rounded-[20px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-6 text-[#756151]">
          Loading your Circles…
        </div>
      ) : (
        <>
          <div className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-2xl text-[#3f2d20]">
                My own Circle
              </h2>

              <span className="text-sm text-[#8a786a]">
                {ownedCircles.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {ownedCircles.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-6 text-[#756151]">
                  You have not created your own
                  Circle yet.
                </div>
              ) : (
                ownedCircles.map(
                  (entry) => (
                    <CircleCard
                      key={entry.circle.id}
                      entry={entry}
                      opening={
                        openingCircleId ===
                        entry.circle.id
                      }
                      onOpen={() =>
                        onOpenCircle(
                          entry.circle.id,
                        )
                      }
                    />
                  ),
                )
              )}
            </div>
          </div>

          <div className="mt-9">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-2xl text-[#3f2d20]">
                Circles I support
              </h2>

              <span className="text-sm text-[#8a786a]">
                {supportedCircles.length}
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-[#78685a]">
              This includes participant Circles
              you created in a support role and
              Circles you joined by invitation.
            </p>

            <div className="mt-4 space-y-3">
              {supportedCircles.length ===
              0 ? (
                <div className="rounded-[20px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-6 text-[#756151]">
                  No participant Circles are
                  currently connected to this
                  account.
                </div>
              ) : (
                supportedCircles.map(
                  (entry) => (
                    <CircleCard
                      key={entry.circle.id}
                      entry={entry}
                      opening={
                        openingCircleId ===
                        entry.circle.id
                      }
                      onOpen={() =>
                        onOpenCircle(
                          entry.circle.id,
                        )
                      }
                    />
                  ),
                )
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}