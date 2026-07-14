let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
let activeRequest: AbortController | null = null;
let speechSequence = 0;

export function isCompanionSpeechAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.fetch === "function" &&
    typeof window.Audio === "function"
  );
}

function releaseActiveAudio(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
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

  releaseActiveAudio();

  if (
    typeof window !== "undefined" &&
    "speechSynthesis" in window
  ) {
    window.speechSynthesis.cancel();
  }
}

function speakWithBrowserFallback(text: string): void {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    !("SpeechSynthesisUtterance" in window)
  ) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-AU";
  utterance.rate = 0.94;
  utterance.pitch = 1.05;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();

  const preferredVoice =
    voices.find((voice) =>
      /natasha|sonia|libby|karen|samantha/i.test(
        voice.name
      )
    ) ??
    voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en-au")
    ) ??
    voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en")
    );

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
}

async function generateAndPlaySpeech(
  text: string,
  sequence: number
): Promise<void> {
  const controller = new AbortController();
  activeRequest = controller;

  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        "Kimi's generated voice was unavailable."
      );
    }

    const audioBlob = await response.blob();

    if (
      controller.signal.aborted ||
      sequence !== speechSequence
    ) {
      return;
    }

    releaseActiveAudio();

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    activeAudioUrl = audioUrl;
    activeAudio = audio;

    audio.preload = "auto";

    audio.onended = () => {
      if (activeAudio === audio) {
        releaseActiveAudio();
      }
    };

    audio.onerror = () => {
      if (activeAudio === audio) {
        releaseActiveAudio();
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

    console.error("Kimi speech playback error:", error);

    releaseActiveAudio();
    speakWithBrowserFallback(text);
  } finally {
    if (activeRequest === controller) {
      activeRequest = null;
    }
  }
}

export function speakCompanionResponse(text: string): void {
  const content = text.trim();

  if (!content || !isCompanionSpeechAvailable()) {
    return;
  }

  stopCompanionSpeech();

  const sequence = speechSequence;

  void generateAndPlaySpeech(content, sequence);
}