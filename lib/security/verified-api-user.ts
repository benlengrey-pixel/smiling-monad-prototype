const VERIFIED_USER_HEADER =
  "x-smiling-monad-auth-user";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class VerifiedApiUserError
  extends Error {
  readonly status = 401;
  readonly code =
    "VERIFIED_USER_MISSING";

  constructor() {
    super(
      "Your authenticated session could not be verified.",
    );

    this.name =
      "VerifiedApiUserError";
  }
}

export function isVerifiedApiUserError(
  error: unknown,
): error is VerifiedApiUserError {
  return (
    error instanceof
    VerifiedApiUserError
  );
}

export function requireVerifiedApiUserId(
  request: Request,
): string {
  const userId =
    request.headers
      .get(
        VERIFIED_USER_HEADER,
      )
      ?.trim() ?? "";

  if (
    !UUID_PATTERN.test(
      userId,
    )
  ) {
    throw new VerifiedApiUserError();
  }

  return userId;
}