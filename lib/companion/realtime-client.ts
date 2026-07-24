import {
  clearCompanionAccessTokenCache,
  readCompanionAccessToken,
} from "@/lib/auth/companion-access-token-cache";

import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

export type KimiLiveSessionStatus =
  | "connecting"
  | "ready"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"
  | "closed";

export type KimiAppToolResult = {
  success: boolean;
  message: string;
  data?: unknown;
};

export type KimiLiveSessionCallbacks = {
  onStatusChange?: (
    status: KimiLiveSessionStatus,
  ) => void;

  onUserTranscriptChange?: (
    completeTranscript: string,
    newText: string,
  ) => void;

  onUserTranscriptComplete?: (
    transcript: string,
  ) => void;

  onKimiTranscriptChange?: (
    completeTranscript: string,
    newText: string,
  ) => void;

  onKimiTranscriptComplete?: (
    transcript: string,
  ) => void;

  onAppToolCall?: (
    request: string,
  ) => Promise<KimiAppToolResult>;

  onError?: (
    message: string,
  ) => void;
};

export type KimiLiveSession = {
  disconnect: () => void;

  setMicrophoneMuted: (
    muted: boolean,
  ) => void;

  isMicrophoneMuted: () => boolean;
};

type RealtimeEvent =
  Record<string, unknown>;

const REALTIME_SESSION_URL =
  "/api/gateway/realtime/session";

const DATA_CHANNEL_OPEN_TIMEOUT_MS =
  15_000;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readString(
  value: unknown,
): string {
  return (
    typeof value === "string"
      ? value
      : ""
  );
}

function readRealtimeEvent(
  value: string,
): RealtimeEvent | null {
  try {
    const parsedValue =
      JSON.parse(value) as unknown;

    return isRecord(parsedValue)
      ? parsedValue
      : null;
  } catch {
    return null;
  }
}

function createHiddenAudioElement():
  HTMLAudioElement {
  const audioElement =
    document.createElement("audio");

  audioElement.autoplay =
    true;

  audioElement.setAttribute(
    "playsinline",
    "",
  );

  audioElement.style.display =
    "none";

  audioElement.setAttribute(
    "aria-hidden",
    "true",
  );

  document.body.appendChild(
    audioElement,
  );

  return audioElement;
}

function createMicrophoneConstraints():
  MediaStreamConstraints {
  return {
    audio: {
      echoCancellation:
        true,

      noiseSuppression:
        true,

      autoGainControl:
        true,

      channelCount:
        1,
    },
  };
}

function waitForDataChannelOpen(
  dataChannel: RTCDataChannel,
): Promise<void> {
  if (
    dataChannel.readyState ===
    "open"
  ) {
    return Promise.resolve();
  }

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const timeout =
        window.setTimeout(
          () => {
            removeListeners();

            reject(
              new Error(
                "Kimi's live connection timed out.",
              ),
            );
          },
          DATA_CHANNEL_OPEN_TIMEOUT_MS,
        );

      function removeListeners() {
        window.clearTimeout(
          timeout,
        );

        dataChannel.removeEventListener(
          "open",
          handleOpen,
        );

        dataChannel.removeEventListener(
          "close",
          handleClose,
        );

        dataChannel.removeEventListener(
          "error",
          handleError,
        );
      }

      function handleOpen() {
        removeListeners();
        resolve();
      }

      function handleClose() {
        removeListeners();

        reject(
          new Error(
            "Kimi's live connection closed before it was ready.",
          ),
        );
      }

      function handleError() {
        removeListeners();

        reject(
          new Error(
            "Kimi's live connection could not be opened.",
          ),
        );
      }

      dataChannel.addEventListener(
        "open",
        handleOpen,
      );

      dataChannel.addEventListener(
        "close",
        handleClose,
      );

      dataChannel.addEventListener(
        "error",
        handleError,
      );
    },
  );
}

async function refreshAccessToken():
  Promise<string> {
  clearCompanionAccessTokenCache();

  try {
    const supabase =
      getSupabaseBrowserClient();

    const {
      data: {
        session,
      },
      error,
    } =
      await supabase.auth
        .refreshSession();

    const accessToken =
      session?.access_token
        ?.trim() ?? "";

    if (
      error ||
      !accessToken
    ) {
      throw new Error(
        "The session could not be refreshed.",
      );
    }

    return accessToken;
  } catch {
    throw new Error(
      "Your sign-in session has expired. Please sign out and sign in again.",
    );
  }
}

async function requestRealtimeAnswer({
  offerSdp,
  accessToken,
}: {
  offerSdp: string;
  accessToken: string;
}): Promise<Response> {
  return fetch(
    REALTIME_SESSION_URL,
    {
      method:
        "POST",

      headers: {
        Accept:
          "application/sdp",

        "Content-Type":
          "application/sdp",

        Authorization:
          `Bearer ${accessToken}`,
      },

      body:
        offerSdp,
    },
  );
}

async function readResponseError(
  response: Response,
): Promise<string> {
  try {
    const body =
      (await response.json()) as
        unknown;

    if (
      isRecord(body) &&
      typeof body.error ===
        "string" &&
      body.error.trim()
    ) {
      return body.error.trim();
    }
  } catch {
    // The response may be plain text.
  }

  return (
    response.status ===
    401
      ? "Your sign-in session could not be verified."
      : "Kimi's live connection could not be established."
  );
}

async function createRealtimeAnswer(
  offerSdp: string,
): Promise<string> {
  const accessToken =
    await readCompanionAccessToken();

  let response =
    await requestRealtimeAnswer({
      offerSdp,
      accessToken,
    });

  if (
    response.status ===
    401
  ) {
    const refreshedAccessToken =
      await refreshAccessToken();

    response =
      await requestRealtimeAnswer({
        offerSdp,
        accessToken:
          refreshedAccessToken,
      });
  }

  if (!response.ok) {
    if (
      response.status ===
        401 ||
      response.status ===
        403
    ) {
      clearCompanionAccessTokenCache();
    }

    throw new Error(
      await readResponseError(
        response,
      ),
    );
  }

  const answerSdp =
    await response.text();

  if (!answerSdp.trim()) {
    throw new Error(
      "Kimi's live connection returned an empty answer.",
    );
  }

  return answerSdp;
}

function readFunctionCalls(
  event: RealtimeEvent,
): RealtimeEvent[] {
  const response =
    event.response;

  if (!isRecord(response)) {
    return [];
  }

  const output =
    response.output;

  if (!Array.isArray(output)) {
    return [];
  }

  return output.filter(
    (
      item,
    ): item is RealtimeEvent =>
      isRecord(item) &&
      item.type ===
        "function_call",
  );
}

function normaliseError(
  error: unknown,
): Error {
  return (
    error instanceof Error
      ? error
      : new Error(
          "Kimi's live connection failed.",
        )
  );
}

export async function startKimiLiveSession(
  callbacks:
    KimiLiveSessionCallbacks = {},
): Promise<KimiLiveSession> {
  if (
    typeof window ===
      "undefined" ||
    typeof RTCPeerConnection ===
      "undefined" ||
    !navigator.mediaDevices
      ?.getUserMedia
  ) {
    throw new Error(
      "This browser does not support Kimi's live voice connection.",
    );
  }

  let currentStatus:
    KimiLiveSessionStatus =
      "connecting";

  let disconnected =
    false;

  let microphoneMuted =
    false;

  let userTranscript =
    "";

  let kimiTranscript =
    "";

  let completedKimiTranscript =
    "";

  const handledToolCalls =
    new Set<string>();

  const peerConnection =
    new RTCPeerConnection();

  const dataChannel =
    peerConnection.createDataChannel(
      "oai-events",
    );

  const audioElement =
    createHiddenAudioElement();

  let microphoneStream:
    MediaStream | null =
      null;

  function setStatus(
    status: KimiLiveSessionStatus,
  ) {
    if (
      currentStatus ===
      status
    ) {
      return;
    }

    currentStatus =
      status;

    callbacks.onStatusChange?.(
      status,
    );
  }

  function sendEvent(
    event: RealtimeEvent,
  ) {
    if (
      dataChannel.readyState !==
      "open"
    ) {
      throw new Error(
        "Kimi's live connection is not ready.",
      );
    }

    dataChannel.send(
      JSON.stringify(event),
    );
  }

  function dispose(
    notifyClosed:
      boolean,
  ) {
    if (disconnected) {
      return;
    }

    disconnected =
      true;

    try {
      dataChannel.close();
    } catch {
      // The channel may already be closed.
    }

    microphoneStream
      ?.getTracks()
      .forEach(
        (track) => {
          track.stop();
        },
      );

    microphoneStream =
      null;

    try {
      peerConnection.close();
    } catch {
      // The peer may already be closed.
    }

    audioElement.pause();
    audioElement.srcObject =
      null;
    audioElement.remove();

    if (notifyClosed) {
      setStatus(
        "closed",
      );
    }
  }

  function reportError(
    error: unknown,
  ) {
    const normalisedError =
      normaliseError(error);

    setStatus(
      "error",
    );

    callbacks.onError?.(
      normalisedError.message,
    );

    return normalisedError;
  }

  function completeKimiTranscript(
    transcript: string,
  ) {
    const completedTranscript =
      transcript.trim();

    if (
      !completedTranscript ||
      completedTranscript ===
        completedKimiTranscript
    ) {
      return;
    }

    completedKimiTranscript =
      completedTranscript;

    callbacks
      .onKimiTranscriptComplete?.(
        completedTranscript,
      );
  }

  async function handleAppToolCall(
    event: RealtimeEvent,
  ) {
    const callId =
      readString(
        event.call_id,
      ).trim();

    const toolName =
      readString(
        event.name,
      ).trim();

    if (
      !callId ||
      toolName !==
        "use_smiling_monad_app" ||
      handledToolCalls.has(
        callId,
      )
    ) {
      return;
    }

    handledToolCalls.add(
      callId,
    );

    setStatus(
      "thinking",
    );

    let toolResult:
      KimiAppToolResult;

    try {
      const rawArguments =
        readString(
          event.arguments,
        );

      const parsedArguments =
        JSON.parse(
          rawArguments ||
            "{}",
        ) as unknown;

      const request =
        isRecord(
          parsedArguments,
        )
          ? readString(
              parsedArguments.request,
            ).trim()
          : "";

      if (!request) {
        throw new Error(
          "Kimi did not provide an application request.",
        );
      }

      toolResult =
        callbacks.onAppToolCall
          ? await callbacks
              .onAppToolCall(
                request,
              )
          : {
              success:
                false,

              message:
                "The Smiling Monad application tool is not connected yet.",
            };
    } catch (
      error
    ) {
      toolResult = {
        success:
          false,

        message:
          normaliseError(
            error,
          ).message,
      };
    }

    if (
      disconnected ||
      dataChannel.readyState !==
        "open"
    ) {
      return;
    }

    sendEvent({
      type:
        "conversation.item.create",

      item: {
        type:
          "function_call_output",

        call_id:
          callId,

        output:
          JSON.stringify(
            toolResult,
          ),
      },
    });

    sendEvent({
      type:
        "response.create",
    });
  }

  function handleRealtimeEvent(
    event: RealtimeEvent,
  ) {
    const eventType =
      readString(
        event.type,
      );

    switch (
      eventType
    ) {
      case "session.created":
      case "session.updated":
        setStatus(
          "ready",
        );
        break;

      case "input_audio_buffer.speech_started":
        userTranscript =
          "";

        setStatus(
          "listening",
        );
        break;

      case "input_audio_buffer.speech_stopped":
        setStatus(
          "thinking",
        );
        break;

      case "conversation.item.input_audio_transcription.delta": {
        const delta =
          readString(
            event.delta,
          );

        if (!delta) {
          break;
        }

        userTranscript +=
          delta;

        callbacks
          .onUserTranscriptChange?.(
            userTranscript,
            delta,
          );

        break;
      }

      case "conversation.item.input_audio_transcription.completed": {
        const transcript =
          readString(
            event.transcript,
          ).trim() ||
          userTranscript.trim();

        if (transcript) {
          userTranscript =
            transcript;

          callbacks
            .onUserTranscriptComplete?.(
              transcript,
            );
        }

        break;
      }

      case "response.created":
        kimiTranscript =
          "";

        completedKimiTranscript =
          "";

        setStatus(
          "thinking",
        );
        break;

      case "response.output_audio.delta":
        setStatus(
          "speaking",
        );
        break;

      case "response.output_audio_transcript.delta": {
        const delta =
          readString(
            event.delta,
          );

        if (!delta) {
          break;
        }

        kimiTranscript +=
          delta;

        setStatus(
          "speaking",
        );

        callbacks
          .onKimiTranscriptChange?.(
            kimiTranscript,
            delta,
          );

        break;
      }

      case "response.output_audio_transcript.done": {
        const transcript =
          readString(
            event.transcript,
          ).trim() ||
          kimiTranscript.trim();

        if (transcript) {
          kimiTranscript =
            transcript;

          completeKimiTranscript(
            transcript,
          );
        }

        break;
      }

      case "response.function_call_arguments.done":
        void handleAppToolCall(
          event,
        );
        break;

      case "response.done": {
        const functionCalls =
          readFunctionCalls(
            event,
          );

        functionCalls.forEach(
          (functionCall) => {
            void handleAppToolCall(
              functionCall,
            );
          },
        );

        if (
          functionCalls.length ===
          0
        ) {
          completeKimiTranscript(
            kimiTranscript,
          );

          setStatus(
            "ready",
          );
        }

        break;
      }

      case "error": {
        const errorValue =
          event.error;

        const message =
          isRecord(
            errorValue,
          )
            ? readString(
                errorValue.message,
              ).trim()
            : "";

        reportError(
          new Error(
            message ||
              "Kimi's live connection reported an error.",
          ),
        );

        break;
      }

      default:
        break;
    }
  }

  callbacks.onStatusChange?.(
    "connecting",
  );

  peerConnection.ontrack =
    (
      event,
    ) => {
      const remoteStream =
        event.streams[0] ??
        new MediaStream([
          event.track,
        ]);

      audioElement.srcObject =
        remoteStream;

      void audioElement
        .play()
        .catch(() => {
          // Autoplay normally succeeds because the session starts
          // from a user gesture. A later UI action can retry playback.
        });
    };

  peerConnection
    .onconnectionstatechange =
      () => {
        if (
          peerConnection
            .connectionState ===
          "failed"
        ) {
          reportError(
            new Error(
              "Kimi's live connection was interrupted.",
            ),
          );

          dispose(
            false,
          );
        }
      };

  dataChannel.onmessage =
    (
      messageEvent,
    ) => {
      if (
        typeof messageEvent.data !==
        "string"
      ) {
        return;
      }

      const event =
        readRealtimeEvent(
          messageEvent.data,
        );

      if (event) {
        handleRealtimeEvent(
          event,
        );
      }
    };

  dataChannel.onclose =
    () => {
      if (!disconnected) {
        dispose(
          true,
        );
      }
    };

  try {
    microphoneStream =
      await navigator.mediaDevices
        .getUserMedia(
          createMicrophoneConstraints(),
        );

    microphoneStream
      .getAudioTracks()
      .forEach(
        (track) => {
          peerConnection.addTrack(
            track,
            microphoneStream as
              MediaStream,
          );
        },
      );

    const offer =
      await peerConnection
        .createOffer();

    await peerConnection
      .setLocalDescription(
        offer,
      );

    const offerSdp =
      peerConnection
        .localDescription
        ?.sdp ??
      offer.sdp ??
      "";

    if (!offerSdp) {
      throw new Error(
        "Kimi's live connection could not create an audio offer.",
      );
    }

    const answerSdp =
      await createRealtimeAnswer(
        offerSdp,
      );

    await peerConnection
      .setRemoteDescription({
        type:
          "answer",

        sdp:
          answerSdp,
      });

    await waitForDataChannelOpen(
      dataChannel,
    );

    sendEvent({
      type:
        "session.update",

      session: {
        type:
          "realtime",

        audio: {
          input: {
            transcription: {
              model:
                "gpt-4o-mini-transcribe",

              language:
                "en",
            },
          },
        },
      },
    });

    setStatus(
      "ready",
    );
  } catch (
    error
  ) {
    const normalisedError =
      reportError(
        error,
      );

    dispose(
      false,
    );

    throw normalisedError;
  }

  return {
    disconnect:
      () => {
        dispose(
          true,
        );
      },

    setMicrophoneMuted:
      (
        muted,
      ) => {
        microphoneMuted =
          muted;

        microphoneStream
          ?.getAudioTracks()
          .forEach(
            (track) => {
              track.enabled =
                !muted;
            },
          );
      },

    isMicrophoneMuted:
      () =>
        microphoneMuted,
  };
}