const digitWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

export function canUseSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function announceVoiceEnabled() {
  return speakText("Voice announcements enabled. Ready orders will be called out.");
}

export function announceReadyOrder(ticketNumber: number) {
  playReadyChime();
  window.setTimeout(() => {
    speakText(`Order number ${speakableTicketNumber(ticketNumber)} is ready for collection.`);
  }, 280);
}

export function announceReadyList(ticketNumbers: number[]) {
  if (ticketNumbers.length === 0) {
    speakText("There are no ready orders right now.");
    return;
  }

  const numbers = ticketNumbers.map(speakableTicketNumber).join(", ");
  playReadyChime();
  window.setTimeout(() => {
    speakText(`Ready for collection. Order number ${numbers}.`);
  }, 280);
}

function speakText(text: string) {
  if (!canUseSpeech()) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voice = chooseVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
  return true;
}

function chooseVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en") && /female|samantha|google|zira/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
    voices[0]
  );
}

function speakableTicketNumber(ticketNumber: number) {
  return String(ticketNumber)
    .split("")
    .map((digit) => digitWords[Number(digit)] ?? digit)
    .join(" ");
}

function playReadyChime() {
  try {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const gain = audioContext.createGain();
    gain.gain.value = 0.08;
    gain.connect(audioContext.destination);

    [660, 880].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      const start = audioContext.currentTime + index * 0.13;
      oscillator.start(start);
      oscillator.stop(start + 0.11);
    });

    window.setTimeout(() => void audioContext.close(), 650);
  } catch {
    // Voice still works if the browser blocks the chime.
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
