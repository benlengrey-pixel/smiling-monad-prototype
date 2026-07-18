import {
  createBrowserAvatarAdapter,
} from "./browser-adapter";
import {
  getLiveAvatarProviderConfig,
  type LiveAvatarProvider,
} from "./provider-config";
import type {
  CompanionAvatarAdapter,
} from "./types";

function createUnavailableHostedAdapter(
  provider: LiveAvatarProvider,
): CompanionAvatarAdapter {
  let connected = false;

  return {
    async connect(container) {
      connected = true;

      container.dataset.avatarProvider =
        provider;

      container.dataset.avatarConnected =
        "false";

      container.dataset.avatarStatus =
        "offline";

      return {
        id: crypto.randomUUID(),
        provider,
        connected: false,
        status: "offline",
        expression: "neutral",
      };
    },

    async disconnect() {
      connected = false;
    },

    async send() {
      if (!connected) {
        return;
      }
    },

    getSession() {
      return null;
    },
  };
}

export function createCompanionAvatarAdapter():
  CompanionAvatarAdapter {
  const config =
    getLiveAvatarProviderConfig();

  if (
    config.provider === "browser-stage"
  ) {
    return createBrowserAvatarAdapter();
  }

  return createUnavailableHostedAdapter(
    config.provider,
  );
}