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

export type DeviceConfirmationStatus = {
  ready: boolean;
  currentLevel: string | null;
  nextLevel: string | null;
  passkeyCount: number;
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

export async function readDeviceConfirmationStatus(): Promise<DeviceConfirmationStatus> {
  await readSignedInIdentity();

  const supabase =
    getSupabaseBrowserClient();

  const [
    assuranceResult,
    passkeyResult,
  ] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.passkey.list(),
  ]);

  if (assuranceResult.error) {
    throw new Error(
      assuranceResult.error.message,
    );
  }

  if (passkeyResult.error) {
    throw new Error(
      passkeyResult.error.message,
    );
  }

  const passkeyCount =
    passkeyResult.data?.length ?? 0;

  return {
    ready: passkeyCount > 0,
    currentLevel:
      assuranceResult.data.currentLevel,
    nextLevel:
      assuranceResult.data.nextLevel,
    passkeyCount,
  };
}

export async function registerDevicePasskey(): Promise<DeviceConfirmationStatus> {
  await readSignedInIdentity();

  const supabase =
    getSupabaseBrowserClient();

  const {
    data: assurance,
    error: assuranceError,
  } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError) {
    throw new Error(
      assuranceError.message,
    );
  }

  if (
    assurance.nextLevel === "aal2" &&
    assurance.currentLevel !== "aal2"
  ) {
    throw new Error(
      "Complete your existing two-step security check before setting up fingerprint, face or device PIN.",
    );
  }

  try {
    const {
      error: registrationError,
    } =
      await supabase.auth.registerPasskey();

    if (registrationError) {
      throw registrationError;
    }
  } catch (error) {
    throw new Error(
      readablePasskeyError(error),
    );
  }

  return readDeviceConfirmationStatus();
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
      throw new Error(
        "Fingerprint, face or device PIN has not been set up for this account yet.",
      );
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