import { generateAuthenticationOptions } from "@simplewebauthn/server";

export async function POST() {
  const options = await generateAuthenticationOptions({
    rpID: "localhost",
    userVerification: "required",
  });

  return Response.json(options);
}