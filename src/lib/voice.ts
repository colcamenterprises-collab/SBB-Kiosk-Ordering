const digitWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
let cachedVoice: SpeechSynthesisVoice | null = null;

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
  }, 320);
}

export function announceReadyList(ticketNumbers: number[]) {
  if (ticketNumbers.length === 0) {
    speakText("There are no ready orders right now.");
    return;
  }

  const orderWord = ticketNumbers.length === 1 ? "Order number" : "Order numbers";
  const numbers = ticketNumbers.map(speakableTicketNumber).join(", ");
  playReadyChime();
  window.setTimeout(() => {
    speakText(`Ready for collection. ${orderWord} ${numbers}.`);
  }, 320);
}

function speakText(text: string) {
  if (!canUseSpeech()) return false;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voice = chooseVoice();
  if (voice) utterance.voice = voice;

  // Chrome/Android can occasionally leave synthesis paused after tab changes.
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  window.speechSynthesis.speak(utterance);
  window.setTimeout(() => window.speechSynthesis.resume(), 80);
  window.setTimeout(() => window.speechSynthesis.resume(), 300);
  return true;
}

function chooseVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return cachedVoice;

  cachedVoice = (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en") && /female|samantha|google|zira/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
    voices[0]
  );

  return cachedVoice;
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
    void audioContext.resume();
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

    window.setTimeout(() => void audioContext.close(), 700);
  } catch {
    // Voice still works if the browser blocks the chime.
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
