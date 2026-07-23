"use client";

import type {
  SecureCircleMemberRecord,
  SecureMemberRole,
} from "@/lib/circle/secure-circle-operations-client";

type MembersPanelProps = {
  members: SecureCircleMemberRecord[];
  loading: boolean;
  workingId: string;
  message: string;
  name: string;
  email: string;
  role: SecureMemberRole;
  relationship: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (
    value: SecureMemberRole,
  ) => void;
  onRelationshipChange: (
    value: string,
  ) => void;
  onAddMember: () => void;
  onRemoveMember: (
    memberId: string,
  ) => void;
};

export default function MembersPanel({
  members,
  loading,
  workingId,
  message,
  name,
  email,
  role,
  relationship,
  onNameChange,
  onEmailChange,
  onRoleChange,
  onRelationshipChange,
  onAddMember,
  onRemoveMember,
}: MembersPanelProps) {
  return (
    <>
      <p className="pr-12 text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
        People and relationships
      </p>

      <h1 className="mt-3 font-serif text-3xl">
        Circle members
      </h1>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <input
          value={name}
          onChange={(event) =>
            onNameChange(event.target.value)
          }
          placeholder="Name"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />

        <input
          type="email"
          value={email}
          onChange={(event) =>
            onEmailChange(event.target.value)
          }
          placeholder="Email"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />

        <select
          value={role}
          onChange={(event) =>
            onRoleChange(
              event.target
                .value as SecureMemberRole,
            )
          }
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        >
          <option value="circle_member">
            Circle member
          </option>
          <option value="family">Family</option>
          <option value="support_worker">
            Support worker
          </option>
          <option value="support_coordinator">
            Support coordinator
          </option>
          <option value="professional">
            Professional
          </option>
          <option value="nominee">
            Nominee
          </option>
          <option value="circle_manager">
            Circle manager
          </option>
        </select>

        <input
          value={relationship}
          onChange={(event) =>
            onRelationshipChange(
              event.target.value,
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onAddMember();
            }
          }}
          placeholder="Relationship"
          className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />
      </div>

      <button
        type="button"
        onClick={onAddMember}
        disabled={
          workingId === "member-new" ||
          !name.trim() ||
          !email.trim()
        }
        className="mt-3 w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728] disabled:cursor-not-allowed disabled:opacity-55"
      >
        {workingId === "member-new"
          ? "Saving invitation…"
          : "Invite circle member"}
      </button>

      {message && (
        <p className="mt-3 rounded-[16px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm leading-6 text-[#6d5e50]">
          {message}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {loading ? (
          <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151] sm:col-span-2">
            Loading secure Circle members…
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#cdbba4] bg-[#f7efe4] p-5 text-[#756151] sm:col-span-2">
            No circle members have been
            added yet.
          </div>
        ) : (
          members.map((member) => (
            <article
              key={member.id}
              className="rounded-[20px] border border-[#dfd2c1] bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#60432f] font-serif text-lg text-white">
                  {member.display_name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onRemoveMember(member.id)
                  }
                  className="text-sm text-[#98765e]"
                >
                  Remove
                </button>
              </div>

              <p className="mt-3 font-serif text-xl">
                {member.display_name}
              </p>

              <p className="mt-1 text-sm text-[#756151]">
                {member.role}
              </p>

              <p className="mt-2 text-sm text-[#8a786a]">
                {member.relationship}
              </p>
            </article>
          ))
        )}
      </div>
    </>
  );
}