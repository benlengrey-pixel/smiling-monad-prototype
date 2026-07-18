export type LiveAvatarProvider =
  | "browser-stage"
  | "tavus"
  | "custom";

export type LiveAvatarProviderMode =
  | "development"
  | "hosted";

export type LiveAvatarProviderConfig = {
  provider: LiveAvatarProvider;
  mode: LiveAvatarProviderMode;
  enabled: boolean;
};

const DEFAULT_PROVIDER_CONFIG:
  LiveAvatarProviderConfig = {
    provider: "browser-stage",
    mode: "development",
    enabled: true,
  };

function isLiveAvatarProvider(
  value: string | undefined,
): value is LiveAvatarProvider {
  return (
    value === "browser-stage" ||
    value === "tavus" ||
    value === "custom"
  );
}

export function getLiveAvatarProviderConfig():
  LiveAvatarProviderConfig {
  const configuredProvider =
    process.env.NEXT_PUBLIC_LIVE_AVATAR_PROVIDER;

  if (
    !isLiveAvatarProvider(
      configuredProvider,
    )
  ) {
    return DEFAULT_PROVIDER_CONFIG;
  }

  return {
    provider: configuredProvider,
    mode:
      configuredProvider === "browser-stage"
        ? "development"
        : "hosted",
    enabled: true,
  };
}

export function isHostedLiveAvatarProvider(
  config: LiveAvatarProviderConfig,
): boolean {
  return (
    config.enabled &&
    config.mode === "hosted"
  );
}