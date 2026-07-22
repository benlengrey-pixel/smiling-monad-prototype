import type { SecureAuditEvent } from "@/lib/circle/secure-audit-client";
import type { SecureCircleMemberRecord } from "@/lib/circle/secure-circle-operations-client";

export type DisplayAuditEvent =
  SecureAuditEvent & {
    actor_name: string;
  };

export function addAuditActorNames(
  events: SecureAuditEvent[],
  members: SecureCircleMemberRecord[],
  currentUserId: string,
): DisplayAuditEvent[] {
  const namesByUserId =
    new Map<string, string>();

  for (const member of members) {
    if (!member.user_id) {
      continue;
    }

    namesByUserId.set(
      member.user_id,
      member.display_name.trim() ||
        member.invited_email.trim() ||
        "Circle member",
    );
  }

  return events.map((event) => {
    let actorName = "System";

    if (event.actor_user_id) {
      actorName =
        namesByUserId.get(
          event.actor_user_id,
        ) ||
        (event.actor_user_id === currentUserId
          ? "You"
          : "Authorised Circle member");
    }

    return {
      ...event,
      actor_name: actorName,
    };
  });
}