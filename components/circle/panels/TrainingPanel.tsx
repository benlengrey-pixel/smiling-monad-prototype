"use client";

import Link from "next/link";

import type { SecureCircleMemberRecord } from "@/lib/circle/secure-circle-operations-client";
import {
  canMemberJoinCircle,
  type CircleTrainingAudience,
  type CircleTrainingRequirement,
  type ParticipantSpecificTrainingModule,
} from "@/lib/training/circle-modules";

type TrainingPanelProps = {
  personDisplayName: string;
  members: SecureCircleMemberRecord[];
  activeModule: ParticipantSpecificTrainingModule | null;
  requirements: CircleTrainingRequirement[];
  completedCount: number;
  pendingCount: number;
  memberId: string;
  memberEmail: string;
  audience: CircleTrainingAudience;
  message: string;
  onMemberIdChange: (value: string) => void;
  onMemberEmailChange: (
    value: string,
  ) => void;
  onAudienceChange: (
    value: CircleTrainingAudience,
  ) => void;
  onAssignTraining: () => void;
};

export default function TrainingPanel({
  personDisplayName,
  members,
  activeModule,
  requirements,
  completedCount,
  pendingCount,
  memberId,
  memberEmail,
  audience,
  message,
  onMemberIdChange,
  onMemberEmailChange,
  onAudienceChange,
  onAssignTraining,
}: TrainingPanelProps) {
  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        Participant-controlled trust
      </p>

      <h1 className="mt-3 font-serif text-3xl">
        Circle training
      </h1>

      <p className="mt-3 max-w-3xl leading-7 text-[#6b5d50]">
        The participant can ask workers to
        complete the main Smiling Monad
        training and can also require every
        worker, provider or professional to
        complete a personalised module before
        joining this Circle.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={`/circle/my-training?circleId=primary-circle&participantId=participant&participantName=${encodeURIComponent(
            personDisplayName,
          )}`}
          className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5 transition hover:bg-[#ede0cd]"
        >
          <p className="font-serif text-xl">
            My mandatory module
          </p>

          <p className="mt-2 text-sm leading-6 text-[#6c594a]">
            Create or manage the training
            that everyone must complete before
            entering this Circle.
          </p>
        </Link>

        <Link
          href={`/circle/training-invitations?circleId=primary-circle&participantId=participant&participantName=${encodeURIComponent(
            personDisplayName,
          )}`}
          className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5 transition hover:bg-[#ede0cd]"
        >
          <p className="font-serif text-xl">
            Invite a worker
          </p>

          <p className="mt-2 text-sm leading-6 text-[#6c594a]">
            Ask a worker to complete the main
            Smiling Monad training pathway.
          </p>
        </Link>

        <Link
          href="/circle/training-review?circleId=primary-circle"
          className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5 transition hover:bg-[#ede0cd]"
        >
          <p className="font-serif text-xl">
            Review responses
          </p>

          <p className="mt-2 text-sm leading-6 text-[#6c594a]">
            Approve understanding or request
            changes before Circle access is
            granted.
          </p>
        </Link>

        <div className="rounded-[20px] border border-[#decfba] bg-[#f4eadc] p-5">
          <p className="text-3xl font-semibold">
            {completedCount}
          </p>

          <p className="mt-2 text-sm text-[#6c594a]">
            Members who completed mandatory
            Circle training
          </p>
        </div>
      </div>

      <div className="mt-7 rounded-[22px] border border-[#d8c7b1] bg-[#efe3d3] p-5 sm:p-6">
        <p className="font-serif text-2xl">
          Active mandatory module
        </p>

        {activeModule ? (
          <>
            <p className="mt-3 text-lg font-medium">
              {activeModule.title}
            </p>

            <p className="mt-2 leading-7 text-[#6a5b4e]">
              {activeModule.purpose}
            </p>

            <p className="mt-3 text-sm text-[#756151]">
              Version {activeModule.version} ·
              Participant approval{" "}
              {activeModule.participantApprovalRequired
                ? "required"
                : "not required"}
            </p>
          </>
        ) : (
          <p className="mt-3 leading-7 text-[#6a5b4e]">
            No mandatory participant-specific
            module is active yet. Create one
            before assigning training to
            Circle members.
          </p>
        )}
      </div>

      <div className="mt-7 rounded-[22px] border border-[#d8c7b1] bg-white p-5 sm:p-6">
        <p className="font-serif text-2xl">
          Assign mandatory training
        </p>

        <p className="mt-2 text-sm leading-6 text-[#756151]">
          Choose an existing Circle member,
          enter their email and identify their
          role. They will remain training
          pending until the module is complete
          and approved.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <select
            value={memberId}
            onChange={(event) =>
              onMemberIdChange(
                event.target.value,
              )
            }
            className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          >
            <option value="">
              Choose Circle member
            </option>

            {members.map((member) => (
              <option
                key={member.id}
                value={member.id}
              >
                {member.display_name}
              </option>
            ))}
          </select>

          <input
            type="email"
            value={memberEmail}
            onChange={(event) =>
              onMemberEmailChange(
                event.target.value,
              )
            }
            placeholder="Member email"
            className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />

          <select
            value={audience}
            onChange={(event) =>
              onAudienceChange(
                event.target
                  .value as CircleTrainingAudience,
              )
            }
            className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          >
            <option value="worker">
              Support worker
            </option>
            <option value="provider">
              Provider
            </option>
            <option value="support-coordinator">
              Support coordinator
            </option>
            <option value="therapist">
              Therapist
            </option>
            <option value="family-member">
              Family member
            </option>
            <option value="other-circle-member">
              Other Circle member
            </option>
          </select>
        </div>

        <button
          type="button"
          onClick={onAssignTraining}
          className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
        >
          Assign mandatory module
        </button>

        {message ? (
          <p className="mt-4 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
            {message}
          </p>
        ) : null}
      </div>

      <div className="mt-7 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-serif text-2xl">
            Member training status
          </p>

          <p className="text-sm text-[#756151]">
            {pendingCount} pending
          </p>
        </div>

        {requirements.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151]">
            No mandatory Circle training has
            been assigned yet.
          </div>
        ) : (
          requirements.map((requirement) => (
            <article
              key={requirement.id}
              className="rounded-[20px] border border-[#dfd2c1] bg-white p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-serif text-xl">
                    {
                      requirement.memberDisplayName
                    }
                  </p>

                  <p className="mt-1 text-sm capitalize text-[#756151]">
                    {requirement.audience.replaceAll(
                      "-",
                      " ",
                    )}
                  </p>

                  <p className="mt-2 text-sm text-[#8a786a]">
                    {canMemberJoinCircle(
                      "primary-circle",
                      requirement.memberId,
                    )
                      ? "Circle access ready"
                      : "Circle access blocked until training is complete"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#efe3d2] px-4 py-2 text-sm capitalize text-[#533d2d]">
                    {requirement.status.replaceAll(
                      "-",
                      " ",
                    )}
                  </span>

                  <Link
                    href={`/circle/training/${requirement.id}?requirementId=${encodeURIComponent(
                      requirement.id,
                    )}`}
                    className="rounded-full border border-[#d6c6b1] bg-white px-4 py-2 text-sm text-[#533d2d]"
                  >
                    Open module
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}