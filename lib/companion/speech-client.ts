export type CompanionSpeechStatus =
  | "idle"
  | "loading"
  | "speaking"
  | "error";

type CompanionSpeechStatusListener = (
  status: CompanionSpeechStatus,
) => void;

const STREAMING_AUDIO_TYPE =
  "audio/mpeg";

let activeAudio:
  HTMLAudioElement | null = null;

let activeAudioUrl:
  string | null = null;

let activeMediaSource:
  MediaSource | null = null;

let activeRequest:
  AbortController | null = null;

let speechSequence =
  0;

const statusListeners =
  new Set<CompanionSpeechStatusListener>();

let currentStatus:
  CompanionSpeechStatus = "idle";

function setSpeechStatus(
  status: CompanionSpeechStatus,
): void {
  if (currentStatus === status) {
    return;
  }

  currentStatus = status;

  statusListeners.forEach(
    (listener) => {
      listener(status);
    },
  );
}

export function getCompanionSpeechStatus():
  CompanionSpeechStatus {
  return currentStatus;
}

export function subscribeToCompanionSpeechStatus(
  listener: CompanionSpeechStatusListener,
): () => void {
  statusListeners.add(listener);
  listener(currentStatus);

  return () => {
    statusListeners.delete(listener);
  };
}

function canStreamGeneratedSpeech():
  boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaSource ===
      "function" &&
    typeof MediaSource.isTypeSupported ===
      "function" &&
    MediaSource.isTypeSupported(
      STREAMING_AUDIO_TYPE,
    )
  );
}

export function isCompanionSpeechAvailable():
  boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.fetch === "function" &&
    typeof window.Audio === "function"
  );
}

function releaseAudio(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.removeAttribute(
      "src",
    );
    activeAudio.load();
    activeAudio = null;
  }

  if (activeAudioUrl) {
    URL.revokeObjectURL(
      activeAudioUrl,
    );
    activeAudioUrl = null;
  }

  activeMediaSource = null;
}

export function stopCompanionSpeech():
  void {
  speechSequence += 1;

  activeRequest?.abort();
  activeRequest = null;

  releaseAudio();
  setSpeechStatus("idle");
}

function attachAudioEvents(
  audio: HTMLAudioElement,
  sequence: number,
): void {
  audio.onplay = () => {
    if (
      sequence === speechSequence &&
      activeAudio === audio
    ) {
      setSpeechStatus("speaking");
    }
  };

  audio.onended = () => {
    if (activeAudio === audio) {
      releaseAudio();
      setSpeechStatus("idle");
    }
  };

  audio.onerror = () => {
    if (
      sequence !== speechSequence ||
      activeAudio !== audio
    ) {
      return;
    }

    console.error(
      "Kimi audio playback failed.",
    );

    activeRequest?.abort();
    releaseAudio();
    setSpeechStatus("error");
  };
}

function waitForMediaSource(
  mediaSource: MediaSource,
  signal: AbortSignal,
): Promise<void> {
  return new Promise(
    (resolve, reject) => {
      function cleanup() {
        mediaSource.removeEventListener(
          "sourceopen",
          handleOpen,
        );

        mediaSource.removeEventListener(
          "error",
          handleError,
        );

        signal.removeEventListener(
          "abort",
          handleAbort,
        );
      }

      function handleOpen() {
        cleanup();
        resolve();
      }

      function handleError() {
        cleanup();

        reject(
          new Error(
            "Kimi's voice stream could not be opened.",
          ),
        );
      }

      function handleAbort() {
        cleanup();

        reject(
          new Error(
            "Kimi's voice playback was cancelled.",
          ),
        );
      }

      if (signal.aborted) {
        handleAbort();
        return;
      }

      mediaSource.addEventListener(
        "sourceopen",
        handleOpen,
      );

      mediaSource.addEventListener(
        "error",
        handleError,
      );

      signal.addEventListener(
        "abort",
        handleAbort,
        {
          once:
            true,
        },
      );
    },
  );
}

function appendAudioChunk(
  sourceBuffer: SourceBuffer,
  chunk: Uint8Array,
  signal: AbortSignal,
): Promise<void> {
  return new Promise(
    (resolve, reject) => {
      function cleanup() {
        sourceBuffer.removeEventListener(
          "updateend",
          handleUpdateEnd,
        );

        sourceBuffer.removeEventListener(
          "error",
          handleError,
        );

        signal.removeEventListener(
          "abort",
          handleAbort,
        );
      }

      function handleUpdateEnd() {
        cleanup();
        resolve();
      }

      function handleError() {
        cleanup();

        reject(
          new Error(
            "Kimi's voice stream could not be decoded.",
          ),
        );
      }

      function handleAbort() {
        cleanup();

        reject(
          new Error(
            "Kimi's voice playback was cancelled.",
          ),
        );
      }

      if (signal.aborted) {
        handleAbort();
        return;
      }

      sourceBuffer.addEventListener(
        "updateend",
        handleUpdateEnd,
      );

      sourceBuffer.addEventListener(
        "error",
        handleError,
      );

      signal.addEventListener(
        "abort",
        handleAbort,
        {
          once:
            true,
        },
      );

      try {
        const safeChunk =
          new Uint8Array(
            chunk.byteLength,
          );

        safeChunk.set(chunk);

        sourceBuffer.appendBuffer(
          safeChunk,
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    },
  );
}

function beginAudioPlayback(
  audio: HTMLAudioElement,
  controller: AbortController,
  sequence: number,
): void {
  void audio.play().catch(
    (error) => {
      if (
        controller.signal.aborted ||
        sequence !== speechSequence ||
        activeAudio !== audio
      ) {
        return;
      }

      console.error(
        "Kimi audio playback failed:",
        error,
      );

      controller.abort();
      releaseAudio();
      setSpeechStatus("error");
    },
  );
}

async function playStreamingSpeech(
  response: Response,
  controller: AbortController,
  sequence: number,
): Promise<void> {
  if (!response.body) {
    throw new Error(
      "Kimi's voice stream was empty.",
    );
  }

  releaseAudio();

  const mediaSource =
    new MediaSource();

  const audioUrl =
    URL.createObjectURL(
      mediaSource,
    );

  const audio =
    new Audio(audioUrl);

  activeMediaSource =
    mediaSource;
  activeAudioUrl =
    audioUrl;
  activeAudio =
    audio;

  audio.preload =
    "auto";

  attachAudioEvents(
    audio,
    sequence,
  );

  await waitForMediaSource(
    mediaSource,
    controller.signal,
  );

  if (
    controller.signal.aborted ||
    sequence !== speechSequence
  ) {
    return;
  }

  const sourceBuffer =
    mediaSource.addSourceBuffer(
      STREAMING_AUDIO_TYPE,
    );

  const reader =
    response.body.getReader();

  let receivedAudio =
    false;

  try {
    while (true) {
      const {
        done,
        value,
      } = await reader.read();

      if (
        controller.signal.aborted ||
        sequence !== speechSequence
      ) {
        await reader.cancel();
        return;
      }

      if (done) {
        break;
      }

      if (!value?.byteLength) {
        continue;
      }

      await appendAudioChunk(
        sourceBuffer,
        value,
        controller.signal,
      );

      if (!receivedAudio) {
        receivedAudio =
          true;

        beginAudioPlayback(
          audio,
          controller,
          sequence,
        );
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!receivedAudio) {
    throw new Error(
      "Kimi's voice stream was empty.",
    );
  }

  if (
    mediaSource.readyState ===
      "open" &&
    !sourceBuffer.updating
  ) {
    mediaSource.endOfStream();
  }
}

async function playBufferedSpeech(
  response: Response,
  controller: AbortController,
  sequence: number,
): Promise<void> {
  const audioBlob =
    await response.blob();

  if (
    controller.signal.aborted ||
    sequence !== speechSequence
  ) {
    return;
  }

  releaseAudio();

  const audioUrl =
    URL.createObjectURL(
      audioBlob,
    );

  const audio =
    new Audio(audioUrl);

  activeAudioUrl =
    audioUrl;
  activeAudio =
    audio;

  audio.preload =
    "auto";

  attachAudioEvents(
    audio,
    sequence,
  );

  await audio.play();
}

async function playGeneratedSpeech(
  text: string,
  sequence: number,
): Promise<void> {
  const controller =
    new AbortController();

  activeRequest =
    controller;

  setSpeechStatus(
    "loading",
  );

  try {
    const response =
      await fetch(
        "/api/speech",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              text,
            }),

          signal:
            controller.signal,
        },
      );

    if (!response.ok) {
      const errorData =
        (await response
          .json()
          .catch(
            () => null,
          )) as {
          error?: string;
        } | null;

      throw new Error(
        errorData?.error ||
          "Kimi's voice could not be generated.",
      );
    }

    if (
      canStreamGeneratedSpeech() &&
      response.body
    ) {
      await playStreamingSpeech(
        response,
        controller,
        sequence,
      );
    } else {
      await playBufferedSpeech(
        response,
        controller,
        sequence,
      );
    }
  } catch (error) {
    if (
      controller.signal.aborted ||
      sequence !== speechSequence
    ) {
      return;
    }

    console.error(
      "Kimi voice error:",
      error,
    );

    releaseAudio();
    setSpeechStatus("error");
  } finally {
    if (
      activeRequest ===
      controller
    ) {
      activeRequest = null;
    }
  }
}

export function speakCompanionResponse(
  text: string,
): void {
  const content =
    text.trim();

  if (
    !content ||
    !isCompanionSpeechAvailable()
  ) {
    return;
  }

  stopCompanionSpeech();

  const sequence =
    speechSequence;

  void playGeneratedSpeech(
    content,
    sequence,
  );
}