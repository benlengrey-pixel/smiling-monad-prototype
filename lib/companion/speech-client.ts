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

export function speakCompanionResponse(text: string): void {
  const content = text.trim();

  if (!content || !isCompanionSpeechAvailable()) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(content);

  utterance.lang = "en-AU";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}