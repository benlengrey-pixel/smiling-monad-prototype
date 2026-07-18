"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  finishLiveAvatarSession,
  getActiveLiveAvatarSession,
  startLiveAvatarSession,
  type LiveAvatarSession,
} from "./live-avatar-session-client";

export type UseLiveAvatarSessionResult = {
  session: LiveAvatarSession | null;
  active: boolean;
  blocked: boolean;
  message: string;
  start: () => LiveAvatarSession;
  finish: () => LiveAvatarSession | null;
};

export function useLiveAvatarSession():
  UseLiveAvatarSessionResult {
  const [session, setSession] =
    useState<LiveAvatarSession | null>(
      null,
    );

  useEffect(() => {
    setSession(
      getActiveLiveAvatarSession(),
    );

    return () => {
      const currentSession =
        getActiveLiveAvatarSession();

      if (
        currentSession?.state === "active"
      ) {
        finishLiveAvatarSession();
      }
    };
  }, []);

  const start = useCallback(() => {
    const nextSession =
      startLiveAvatarSession();

    setSession(nextSession);

    return nextSession;
  }, []);

  const finish = useCallback(() => {
    const finishedSession =
      finishLiveAvatarSession();

    setSession(null);

    return finishedSession;
  }, []);

  return {
    session,
    active:
      session?.state === "active",
    blocked:
      session?.state === "blocked",
    message:
      session?.message ?? "",
    start,
    finish,
  };
}