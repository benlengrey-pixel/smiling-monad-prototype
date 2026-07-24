export type CompanionVoiceCallbacks = {
  onTranscript: (transcript: string) => void;
  onError: () => void;
  onEnd: () => void;
};

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]:
    SpeechRecognitionAlternative;
};

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results:
    ArrayLike<SpeechRecognitionResult>;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    (
      (
        event:
          SpeechRecognitionResultEvent,
      ) => void
    ) |
    null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
};

type SpeechRecognitionConstructor =
  new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?:
      SpeechRecognitionConstructor;
    webkitSpeechRecognition?:
      SpeechRecognitionConstructor;
  }
}

const SPEECH_PAUSE_MS = 700;

function readTranscript(
  results:
    ArrayLike<SpeechRecognitionResult>,
): string {
  const transcriptParts: string[] = [];

  for (
    let index = 0;
    index < results.length;
    index += 1
  ) {
    const transcript =
      results[index]?.[0]?.transcript
        ?.trim() ?? "";

    if (transcript) {
      transcriptParts.push(
        transcript,
      );
    }
  }

  return transcriptParts
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCompanionVoiceAvailable(): boolean {
  return Boolean(
    window.SpeechRecognition ||
      window.webkitSpeechRecognition,
  );
}

export function startCompanionVoiceRecognition({
  onTranscript,
  onError,
  onEnd,
}: CompanionVoiceCallbacks): void {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError();
    return;
  }

  const recognition =
    new SpeechRecognition();

  let latestTranscript = "";
  let transcriptSent = false;
  let recognitionEnded = false;
  let pauseTimer:
    ReturnType<typeof setTimeout> |
    null = null;

  function clearPauseTimer() {
    if (!pauseTimer) {
      return;
    }

    clearTimeout(pauseTimer);
    pauseTimer = null;
  }

  function sendTranscript() {
    if (
      transcriptSent ||
      !latestTranscript
    ) {
      return;
    }

    transcriptSent = true;
    onTranscript(latestTranscript);
  }

  function finishRecognition() {
    clearPauseTimer();
    sendTranscript();

    if (recognitionEnded) {
      return;
    }

    try {
      recognition.stop();
    } catch {
      // The browser may already be stopping.
    }
  }

  function scheduleFastFinish() {
    clearPauseTimer();

    pauseTimer = setTimeout(
      finishRecognition,
      SPEECH_PAUSE_MS,
    );
  }

  recognition.lang = "en-AU";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const transcript =
      readTranscript(event.results);

    if (transcript) {
      latestTranscript = transcript;
    }

    let finalResultReceived = false;

    for (
      let index =
        event.resultIndex;
      index < event.results.length;
      index += 1
    ) {
      if (
        event.results[index]?.isFinal
      ) {
        finalResultReceived = true;
        break;
      }
    }

    if (finalResultReceived) {
      finishRecognition();
      return;
    }

    if (latestTranscript) {
      scheduleFastFinish();
    }
  };

  recognition.onspeechend = () => {
    finishRecognition();
  };

  recognition.onerror = () => {
    clearPauseTimer();

    if (!transcriptSent) {
      onError();
    }
  };

  recognition.onend = () => {
    recognitionEnded = true;
    clearPauseTimer();
    sendTranscript();
    onEnd();
  };

  recognition.start();
}