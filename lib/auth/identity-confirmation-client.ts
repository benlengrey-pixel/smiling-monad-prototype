"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type IdentityConfirmationResult = {
  userId: string;
  method: "passkey";
  enrolledNow: boolean;
};

function readablePasskeyError(
  error: unknown,
): string {
  if (
    error instanceof DOMException &&
    error.name === "NotAllowedError"
  ) {
    return "Identity confirmation was cancelled.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Your identity could not be confirmed.";
}

export async function confirmIdentityWithPasskey(): Promise<IdentityConfirmationResult> {
  const supabase =
    getSupabaseBrowserClient();

  const {
    data: { user: signedInUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !signedInUser) {
    throw new Error(
      "You must be signed in.",
    );
  }

  try {
    const {
      data: passkeys,
      error: listError,
    } =
      await supabase.auth.passkey.list();

    if (listError) {
      throw listError;
    }

    if (!passkeys?.length) {
      const {
        error: registrationError,
      } =
        await supabase.auth.registerPasskey();

      if (registrationError) {
        throw registrationError;
      }

      return {
        userId: signedInUser.id,
        method: "passkey",
        enrolledNow: true,
      };
    }

    const {
      data,
      error: authenticationError,
    } =
      await supabase.auth.signInWithPasskey();

    if (authenticationError) {
      throw authenticationError;
    }

    if (
      !data.user ||
      data.user.id !== signedInUser.id
    ) {
      throw new Error(
        "The confirmed passkey belongs to a different account.",
      );
    }

    return {
      userId: data.user.id,
      method: "passkey",
      enrolledNow: false,
    };
  } catch (error) {
    throw new Error(
      readablePasskeyError(error),
    );
  }
}