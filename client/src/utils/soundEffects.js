// Mesin Efek Suara Web Audio API untuk Rivora Quiz Battle
// Menghasilkan efek suara sintetis secara realtime tanpa file audio eksternal.

const SOUND_STORAGE_KEY = "rivora_sound";

let audioCtx = null;

export function isSoundEnabled() {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabledStorage(enabled) {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Abaikan jika localStorage tidak tersedia
  }
}

function getContext() {
  if (!isSoundEnabled()) return null;
  if (typeof window === "undefined") return null;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone({
  freq = 440,
  endFreq = null,
  type = "sine",
  duration = 0.1,
  delay = 0,
  volume = 0.12,
}) {
  const ctx = getContext();
  if (!ctx) return;

  try {
    const startTime = ctx.currentTime + delay;
    const stopTime = startTime + duration;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(endFreq, 20),
        stopTime
      );
    }

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(stopTime + 0.01);
  } catch {
    // Abaikan jika browser memblokir autoplay sebelum interaksi
  }
}

// Klik tombol UI taktil
export function playClick() {
  playTone({
    freq: 520,
    endFreq: 760,
    type: "triangle",
    duration: 0.06,
    volume: 0.1,
  });
}

// Efek pindah tab / pilih chip
export function playSelectChip() {
  playTone({
    freq: 640,
    endFreq: 880,
    type: "sine",
    duration: 0.075,
    volume: 0.11,
  });
}

// Suara langkah telemetri AI saat membuat soal
export function playAiPulse(stepIndex = 0) {
  const baseFreqs = [440, 523.25, 659.25, 783.99];
  const freq = baseFreqs[stepIndex % baseFreqs.length];
  playTone({
    freq,
    endFreq: freq * 1.15,
    type: "sine",
    duration: 0.12,
    volume: 0.08,
  });
}

// Suara berhasil masuk Lobby / Salin kode room
export function playLobbyChime() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    playTone({
      freq,
      type: "triangle",
      duration: 0.14,
      delay: idx * 0.065,
      volume: 0.12,
    });
  });
}

// Suara soal baru dimulai di PlayPage
export function playQuestionStart() {
  const notes = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
  notes.forEach((freq, idx) => {
    playTone({
      freq,
      type: "triangle",
      duration: 0.15,
      delay: idx * 0.06,
      volume: 0.13,
    });
  });
}

// Suara saat mengunci pilihan jawaban A / B / C / D
export function playAnswerLock(choiceIndex = 0) {
  const rootNotes = [523.25, 587.33, 659.25, 698.46]; // C5, D5, E5, F5
  const base = rootNotes[choiceIndex % rootNotes.length];
  playTone({
    freq: base,
    type: "triangle",
    duration: 0.09,
    delay: 0,
    volume: 0.14,
  });
  playTone({
    freq: base * 1.5,
    type: "sine",
    duration: 0.16,
    delay: 0.06,
    volume: 0.15,
  });
}

// Detak timer hitung mundur (makin mendesak saat <= 5 detik)
export function playCountdownTick(secondsLeft) {
  if (secondsLeft <= 0) return;

  if (secondsLeft <= 5) {
    // Double beep darurat
    playTone({
      freq: 880,
      endFreq: 980,
      type: "square",
      duration: 0.065,
      delay: 0,
      volume: 0.08,
    });
    playTone({
      freq: 1046.5,
      type: "square",
      duration: 0.075,
      delay: 0.08,
      volume: 0.09,
    });
  } else if (secondsLeft <= 10) {
    // Tick sedang
    playTone({
      freq: 660,
      type: "triangle",
      duration: 0.055,
      volume: 0.07,
    });
  } else {
    // Tick halus
    playTone({
      freq: 480,
      type: "sine",
      duration: 0.04,
      volume: 0.04,
    });
  }
}

// Suara waktu habis
export function playTimeUp() {
  playTone({
    freq: 340,
    endFreq: 180,
    type: "sawtooth",
    duration: 0.28,
    delay: 0,
    volume: 0.1,
  });
}

// Suara Reveal: Jawaban Benar vs Salah
export function playRevealSound(isCorrect) {
  if (isCorrect) {
    // Fanfare Jawaban Benar (C5 - E5 - G5 - C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      playTone({
        freq,
        type: "triangle",
        duration: idx === notes.length - 1 ? 0.32 : 0.14,
        delay: idx * 0.075,
        volume: 0.15,
      });
    });
  } else {
    // Buzzer lembut Jawaban Kurang Tepat
    playTone({
      freq: 311.13, // D#4
      endFreq: 261.63,
      type: "sawtooth",
      duration: 0.18,
      delay: 0,
      volume: 0.09,
    });
    playTone({
      freq: 233.08, // Bb3
      endFreq: 196.0,
      type: "sawtooth",
      duration: 0.28,
      delay: 0.15,
      volume: 0.1,
    });
  }
}

// Fanfare Juara di ResultPage
export function playVictoryFanfare() {
  const melody = [
    { freq: 523.25, delay: 0, duration: 0.13 }, // C5
    { freq: 659.25, delay: 0.11, duration: 0.13 }, // E5
    { freq: 783.99, delay: 0.22, duration: 0.13 }, // G5
    { freq: 1046.5, delay: 0.34, duration: 0.22 }, // C6
    { freq: 783.99, delay: 0.52, duration: 0.14 }, // G5
    { freq: 1046.5, delay: 0.65, duration: 0.42 }, // C6
  ];

  melody.forEach((note) => {
    playTone({
      freq: note.freq,
      type: "triangle",
      duration: note.duration,
      delay: note.delay,
      volume: 0.15,
    });
  });
}

