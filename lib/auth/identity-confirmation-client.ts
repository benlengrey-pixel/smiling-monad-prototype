"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type IdentityConfirmationResult = {
  userId: string;
  method: "passkey" | "email_code";
  enrolledNow: boolean;
};

export type SignedInIdentity = {
  userId: string;
  email: string;
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

export async function readSignedInIdentity(): Promise<SignedInIdentity> {
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

  if (!user.email) {
    throw new Error(
      "This account does not have a confirmed email address.",
    );
  }

  return {
    userId: user.id,
    email: user.email,
  };
}

export async function confirmIdentityWithPasskey(): Promise<IdentityConfirmationResult> {
  const identity =
    await readSignedInIdentity();

  const supabase =
    getSupabaseBrowserClient();

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
        userId: identity.userId,
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
      data.user.id !== identity.userId
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

export async function sendIdentityEmailCode(): Promise<{
  email: string;
}> {
  const identity =
    await readSignedInIdentity();

  const supabase =
    getSupabaseBrowserClient();

  const { error } =
    await supabase.auth.signInWithOtp({
      email: identity.email,
      options: {
        shouldCreateUser: false,
      },
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    email: identity.email,
  };
}

export async function confirmIdentityWithEmailCode(
  code: string,
): Promise<IdentityConfirmationResult> {
  const cleanCode =
    code.replace(/\s/g, "");

  if (!/^\d{6}$/.test(cleanCode)) {
    throw new Error(
      "Enter the six-digit code sent to your email.",
    );
  }

  const identity =
    await readSignedInIdentity();

  const supabase =
    getSupabaseBrowserClient();

  const { data, error } =
    await supabase.auth.verifyOtp({
      email: identity.email,
      token: cleanCode,
      type: "email",
    });

  if (error) {
    throw new Error(error.message);
  }

  if (
    !data.user ||
    data.user.id !== identity.userId
  ) {
    throw new Error(
      "The email confirmation did not match the signed-in account.",
    );
  }

  return {
    userId: data.user.id,
    method: "email_code",
    enrolledNow: false,
  };
}