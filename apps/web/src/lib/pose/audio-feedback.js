const DEFAULT_COOLDOWN_MS = 3000;

const CORRECTION_TONES = {
  'hips-low': [220, 330],
  'hips-high': [330, 220],
  'shoulder-forward': [220, 440],
  'shoulder-back': [440, 220],
  tracking: [330, 247, 185],
};

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Context = window.AudioContext || window.webkitAudioContext;
  return Context ? new Context() : null;
}

function tone(context, frequency, start, duration, type = 'square', gainValue = 0.035) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.volume = 0.65;
  window.speechSynthesis.speak(utterance);
}

export function createAudioFeedback({ cooldownMs = DEFAULT_COOLDOWN_MS } = {}) {
  let context = null;
  let muted = false;
  let lastCorrection = '';
  let lastCorrectionAt = -Infinity;
  let promptTimer = null;

  async function initialize() {
    if (!context) context = getAudioContext();
    if (context?.state === 'suspended') await context.resume();
    return Boolean(context);
  }

  function playFrequencies(frequencies, spacing = 0.1) {
    if (muted || !context || context.state === 'closed') return;
    const start = context.currentTime + 0.01;
    frequencies.forEach((frequency, index) => tone(context, frequency, start + index * spacing, 0.08));
  }

  function correction(correction, now = Date.now()) {
    if (muted || !correction) return false;
    const key = correction.kind || correction.label;
    if (key === lastCorrection && now - lastCorrectionAt < cooldownMs) return false;
    lastCorrection = key;
    lastCorrectionAt = now;
    playFrequencies(CORRECTION_TONES[key] || [260, 210]);
    clearTimeout(promptTimer);
    promptTimer = setTimeout(() => {
      if (!muted && lastCorrection === key) speak(correction.voice || correction.label);
    }, 1200);
    return true;
  }

  function valid() {
    playFrequencies([392, 523], 0.13);
  }

  function complete() {
    playFrequencies([392, 494, 587, 784], 0.1);
  }

  function test() {
    playFrequencies([330, 440], 0.13);
  }

  function setMuted(value) {
    muted = Boolean(value);
    if (muted) {
      clearTimeout(promptTimer);
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    }
  }

  function dispose() {
    clearTimeout(promptTimer);
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    if (context && context.state !== 'closed') void context.close();
    context = null;
  }

  return { initialize, correction, valid, complete, test, setMuted, dispose, get muted() { return muted; } };
}

