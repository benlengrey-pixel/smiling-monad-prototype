"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SecureCircleMessage = {
  id: string;
  circle_id: string;
  sender_user_id: string;
  sender_name: string;
  message_text: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
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
      "You must be signed in.",
    );
  }

  return user;
}

export async function readSecureCircleMessages(
  circleId: string,
): Promise<SecureCircleMessage[]> {
  const cleanCircleId =
    circleId.trim();

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
      .select(
        [
          "id",
          "circle_id",
          "sender_user_id",
          "sender_name",
          "message_text",
          "created_at",
          "edited_at",
          "deleted_at",
        ].join(","),
      )
      .eq("circle_id", cleanCircleId)
      .is("deleted_at", null)
      .order("created_at", {
        ascending: true,
      });

  if (error) {
    throw new Error(
      describeError(error),
    );
  }

  return (
    data ?? []
  ) as SecureCircleMessage[];
}

export async function sendSecureCircleMessage(
  circleId: string,
  senderName: string,
  messageText: string,
): Promise<SecureCircleMessage> {
  const cleanCircleId =
    circleId.trim();

  const cleanSenderName =
    senderName.trim();

  const cleanMessageText =
    messageText.trim();

  if (!cleanCircleId) {
    throw new Error(
      "A Circle must be selected.",
    );
  }

  if (!cleanMessageText) {
    throw new Error(
      "Write a message before sending.",
    );
  }

  if (cleanMessageText.length > 5000) {
    throw new Error(
      "Circle messages must be 5,000 characters or fewer.",
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
        sender_name:
          cleanSenderName ||
          user.email ||
          "Circle member",
        message_text: cleanMessageText,
      })
      .select(
        [
          "id",
          "circle_id",
          "sender_user_id",
          "sender_name",
          "message_text",
          "created_at",
          "edited_at",
          "deleted_at",
        ].join(","),
      )
      .single();

  if (error) {
    throw new Error(
      describeError(error),
    );
  }

  if (!data) {
    throw new Error(
      "The Circle message could not be sent.",
    );
  }

  return data as SecureCircleMessage;
}