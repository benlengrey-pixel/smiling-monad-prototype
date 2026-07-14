export type CompanionVoiceCallbacks = {
  onTranscript: (transcript: string) => void;
  onError: () => void;
  onEnd: () => void;
};

type SpeechRecognitionResultEvent = {
  results: ArrayLike<{
    0: {
      transcript: string;
    };
  }>;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function isCompanionVoiceAvailable(): boolean {
  return Boolean(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );
}

export function startCompanionVoiceRecognition({
  onTranscript,
  onError,
  onEnd,
}: CompanionVoiceCallbacks): void {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError();
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-AU";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const transcript =
      event.results[0]?.[0]?.transcript?.trim() || "";

    if (transcript) {
      onTranscript(transcript);
    }
  };

  recognition.onerror = () => {
    onError();
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.start();
}