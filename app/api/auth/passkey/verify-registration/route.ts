import { verifyRegistrationResponse } from "@simplewebauthn/server";
import {
  getRegistrationChallenge,
  savePasskey,
} from "@/lib/passkey-store";

export async function POST(request: Request) {
  try {
    const response = await request.json();
    const challenge = getRegistrationChallenge();

    if (!challenge) {
      throw new Error("Registration challenge is missing.");
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: "http://localhost:3000",
      expectedRPID: "localhost",
      requireUserVerification: true,
    });

    if (
      verification.verified &&
      verification.registrationInfo
    ) {
      const credential =
        verification.registrationInfo.credential;

      savePasskey({
        id: credential.id,
        userId: "local-user",
        publicKey: Buffer.from(
          credential.publicKey
        ).toString("base64url"),
        counter: credential.counter,
      });
    }

    return Response.json({
      success: verification.verified,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Registration failed.",
      },
      { status: 400 }
    );
  }
}