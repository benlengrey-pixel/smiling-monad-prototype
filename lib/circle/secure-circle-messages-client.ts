"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SecureCircleMessage = {
  id: string;
  circle_id: string;
  sender_user_id: string;
  sender_name: string;
  message_body: string;
  message_status: "active" | "archived";
  created_at: string;
  archived_at: string | null;
};

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "The Circle conversation request could not be completed.";
}

async function requireSignedInUser() {
  const supabase =
    getSupabaseBrowserClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(
      "You must be signed in to use the Circle conversation.",
    );
  }

  return user;
}

export async function readSecureCircleMessages(
  circleId: string,
): Promise<SecureCircleMessage[]> {
  const cleanCircleId = circleId.trim();

  if (!cleanCircleId) {
    throw new Error(
      "A Circle must be selected.",
    );
  }

  await requireSignedInUser();

  const supabase =
    getSupabaseBrowserClient();

  const { data, error } =
    await supabase
      .from("circle_messages")
      .select("*")
      .eq("circle_id", cleanCircleId)
      .eq("message_status", "active")
      .order("created_at", {
        ascending: true,
      })
      .limit(200);

  if (error) {
    throw new Error(
      describeError(error),
    );
  }

  return (
    data ?? []
  ) as unknown as SecureCircleMessage[];
}

export async function sendSecureCircleMessage(
  input: {
    circleId: string;
    senderName: string;
    messageBody: string;
  },
): Promise<SecureCircleMessage> {
  const cleanCircleId =
    input.circleId.trim();
  const cleanSenderName =
    input.senderName.trim();
  const cleanMessageBody =
    input.messageBody.trim();

  if (!cleanCircleId) {
    throw new Error(
      "A Circle must be selected.",
    );
  }

  if (!cleanSenderName) {
    throw new Error(
      "Your display name is required.",
    );
  }

  if (!cleanMessageBody) {
    throw new Error(
      "Enter a message.",
    );
  }

  if (cleanMessageBody.length > 4000) {
    throw new Error(
      "Circle messages must be 4,000 characters or fewer.",
    );
  }

  const user =
    await requireSignedInUser();

  const supabase =
    getSupabaseBrowserClient();

  const { data, error } =
    await supabase
      .from("circle_messages")
      .insert({
        circle_id: cleanCircleId,
        sender_user_id: user.id,
        sender_name: cleanSenderName,
        message_body: cleanMessageBody,
        message_status: "active",
      })
      .select("*")
      .single();

  if (error) {
    throw new Error(
      describeError(error),
    );
  }

  return data as unknown as SecureCircleMessage;
}