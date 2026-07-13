export type StoredPasskey = {
  id: string;
  userId: string;
  publicKey: string;
  counter: number;
};

let registrationChallenge = "";
let authenticationChallenge = "";

const passkeys = new Map<string, StoredPasskey>();

export function saveRegistrationChallenge(challenge: string) {
  registrationChallenge = challenge;
}

export function getRegistrationChallenge() {
  return registrationChallenge;
}

export function saveAuthenticationChallenge(challenge: string) {
  authenticationChallenge = challenge;
}

export function getAuthenticationChallenge() {
  return authenticationChallenge;
}

export function savePasskey(passkey: StoredPasskey) {
  passkeys.set(passkey.id, passkey);
}

export function getPasskey(id: string) {
  return passkeys.get(id);
}

export function getAllPasskeys() {
  return Array.from(passkeys.values());
}