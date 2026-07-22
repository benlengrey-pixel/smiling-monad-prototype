"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type PrivacyNotice = {
  id: string;
  notice_key: string;
  title: string;
  version: string;
  notice_text: string;
  effective_at: string;
  retired_at: string | null;
  active: boolean;
  approved_by_user_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PrivacyNoticeAcceptance = {
  id: string;
  notice_id: string;
  user_id: string;
  participant_id: string | null;
  circle_id: string | null;
  accepted_at: string;
  acceptance_method:
    | "in_app"
    | "written"
    | "verbal_recorded"
    | "representative";
  representative_name: string;
  evidence_reference: string;
  created_at: string;
};

async function requireSignedInUserId(): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in.");
  }

  return user.id;
}

export async function readActivePrivacyNotice(
  noticeKey: string,
): Promise<PrivacyNotice | null> {
  await requireSignedInUserId();

  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("privacy_notices")
    .select("*")
    .eq("notice_key", noticeKey)
    .eq("active", true)
    .lte(
      "effective_at",
      new Date().toISOString(),
    )
    .order("effective_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as PrivacyNotice | null;
}

export async function readMyPrivacyNoticeAcceptance(
  noticeId: string,
  participantId?: string | null,
  circleId?: string | null,
): Promise<PrivacyNoticeAcceptance | null> {
  const userId =
    await requireSignedInUserId();

  const supabase = getSupabaseBrowserClient();

  let query = supabase
    .from("privacy_notice_acceptances")
    .select("*")
    .eq("notice_id", noticeId)
    .eq("user_id", userId);

  query = participantId
    ? query.eq("participant_id", participantId)
    : query.is("participant_id", null);

  query = circleId
    ? query.eq("circle_id", circleId)
    : query.is("circle_id", null);

  const { data, error } =
    await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as PrivacyNoticeAcceptance | null;
}

export async function acceptPrivacyNotice(input: {
  noticeId: string;
  participantId?: string | null;
  circleId?: string | null;
  acceptanceMethod?:
    | "in_app"
    | "written"
    | "verbal_recorded"
    | "representative";
  representativeName?: string;
  evidenceReference?: string;
}): Promise<PrivacyNoticeAcceptance> {
  const userId =
    await requireSignedInUserId();

  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("privacy_notice_acceptances")
    .upsert(
      {
        notice_id: input.noticeId,
        user_id: userId,
        participant_id:
          input.participantId ?? null,
        circle_id: input.circleId ?? null,
        acceptance_method:
          input.acceptanceMethod ?? "in_app",
        representative_name:
          input.representativeName?.trim() ??
          "",
        evidence_reference:
          input.evidenceReference?.trim() ??
          "",
        accepted_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "notice_id,user_id,participant_id,circle_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PrivacyNoticeAcceptance;
}