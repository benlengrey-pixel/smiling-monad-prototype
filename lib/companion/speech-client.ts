export type CompanionSpeechStatus =
  | "idle"
  | "loading"
  | "speaking"
  | "error";

type CompanionSpeechStatusListener = (
  status: CompanionSpeechStatus,
) => void;

let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
let activeRequest: AbortController | null = null;
let speechSequence = 0;

const statusListeners =
  new Set<CompanionSpeechStatusListener>();

let currentStatus: CompanionSpeechStatus =
  "idle";

function setSpeechStatus(
  status: CompanionSpeechStatus,
): void {
  if (currentStatus === status) {
    return;
  }

  currentStatus = status;

  statusListeners.forEach((listener) => {
    listener(status);
  });
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

export function isCompanionSpeechAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.fetch === "function" &&
    typeof window.Audio === "function"
  );
}

function releaseAudio(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.removeAttribute("src");
    activeAudio.load();
    activeAudio = null;
  }

  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
  }
}

export function stopCompanionSpeech(): void {
  speechSequence += 1;

  activeRequest?.abort();
  activeRequest = null;

  releaseAudio();
  setSpeechStatus("idle");
}

async function playGeneratedSpeech(
  text: string,
  sequence: number,
): Promise<void> {
  const controller = new AbortController();
  activeRequest = controller;

  setSpeechStatus("loading");

  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => null)) as {
        error?: string;
      } | null;

      throw new Error(
        errorData?.error ||
          "Kimi's voice could not be generated.",
      );
    }

    const audioBlob = await response.blob();

    if (
      controller.signal.aborted ||
      sequence !== speechSequence
    ) {
      return;
    }

    releaseAudio();

    const audioUrl =
      URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);

    activeAudioUrl = audioUrl;
    activeAudio = audio;
    audio.preload = "auto";

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
      console.error(
        "Kimi audio playback failed.",
      );

      if (activeAudio === audio) {
        releaseAudio();
        setSpeechStatus("error");
      }
    };

    await audio.play();
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
    if (activeRequest === controller) {
      activeRequest = null;
    }
  }
}

export function speakCompanionResponse(
  text: string,
): void {
  const content = text.trim();

  if (
    !content ||
    !isCompanionSpeechAvailable()
  ) {
    return;
  }

  stopCompanionSpeech();

  const sequence = speechSequence;

  void playGeneratedSpeech(
    content,
    sequence,
  );
}