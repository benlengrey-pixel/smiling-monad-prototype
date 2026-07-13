import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";

export async function registerPasskey() {
  const options = await fetch(
    "/api/auth/passkey/register-options",
    {
      method: "POST",
    }
  ).then((response) => response.json());

  return startRegistration({
    optionsJSON: options,
  });
}

export async function authenticatePasskey() {
  const options = await fetch(
    "/api/auth/passkey/login-options",
    {
      method: "POST",
    }
  ).then((response) => response.json());

  return startAuthentication({
    optionsJSON: options,
  });
}