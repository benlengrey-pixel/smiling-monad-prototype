export function isCompanionSpeechAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

export function stopCompanionSpeech(): void {
  if (!isCompanionSpeechAvailable()) return;

  window.speechSynthesis.cancel();
}

function findBestVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();

  const preferred = [
    "Microsoft Natasha",
    "Microsoft Sonia",
    "Microsoft Libby",
    "Google UK English Female",
    "Google US English",
    "Karen",
    "Samantha",
  ];

  for (const name of preferred) {
    const voice = voices.find((v) =>
      v.name.includes(name)
    );

    if (voice) {
      return voice;
    }
  }

  const female = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      /(female|natasha|sonia|libby|samantha|karen)/i.test(v.name)
  );

  if (female) {
    return female;
  }

  return voices.find((v) => v.lang.startsWith("en")) ?? null;
}

export function speakCompanionResponse(text: string): void {
  const content = text.trim();

  if (!content || !isCompanionSpeechAvailable()) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(content);

  utterance.lang = "en-AU";
  utterance.rate = 0.94;
  utterance.pitch = 1.05;
  utterance.volume = 1;

  const voice = findBestVoice();

  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
}