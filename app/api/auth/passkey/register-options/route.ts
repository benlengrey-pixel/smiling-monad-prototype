import { generateRegistrationOptions } from "@simplewebauthn/server";
import { saveRegistrationChallenge } from "@/lib/passkey-store";

export async function POST() {
  const options = await generateRegistrationOptions({
    rpName: "Smiling Monad",
    rpID: "localhost",
    userName: "local-user",
    userDisplayName: "Smiling Monad User",
    userID: new TextEncoder().encode("local-user"),
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
  });

  saveRegistrationChallenge(options.challenge);

  return Response.json(options);
}