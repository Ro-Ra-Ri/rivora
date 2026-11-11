import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";
import { emitSubmitAnswer } from "../socket";
import { answerLocked } from "../store/gameSlice";
import {
  playAnswerLock,
  playCountdownTick,
  playQuestionStart,
  playTimeUp,
} from "../utils/soundEffects";

const OPTION_KEYS = ["A", "B", "C", "D"];

// Desain Kartu Opsi 4 Warna Mencolok (Tactile 3D Arcade Cards)
const OPTION_STYLES = [
  {
    // A: Indigo
    cardDark:
      "bg-[#1a1d3a] border-2 border-b-4 border-indigo-400/80 hover:bg-[#22264d] hover:border-indigo-300 text-white shadow-[0_12px_30px_rgba(79,70,229,0.2)]",
    cardLight:
      "bg-indigo-50/90 border-2 border-b-4 border-indigo-400 hover:bg-indigo-100/90 hover:border-indigo-600 text-indigo-950 shadow-sm",
    badge: "bg-indigo-600 border-2 border-indigo-300 text-white",
    selectedDark:
      "bg-indigo-600/40 border-2 border-b-4 border-indigo-300 ring-4 ring-indigo-500/40 text-white shadow-[0_0_32px_rgba(99,102,241,0.5)]",
    selectedLight:
      "bg-indigo-600 border-2 border-b-4 border-indigo-900 ring-4 ring-indigo-400/40 text-white shadow-md",
  },
  {
    // B: Sky / Cyan
    cardDark:
      "bg-[#15283d] border-2 border-b-4 border-sky-400/80 hover:bg-[#1b3450] hover:border-sky-300 text-white shadow-[0_12px_30px_rgba(14,165,233,0.2)]",
    cardLight:
      "bg-sky-50/90 border-2 border-b-4 border-sky-400 hover:bg-sky-100/90 hover:border-sky-600 text-sky-950 shadow-sm",
    badge: "bg-sky-600 border-2 border-sky-300 text-white",
    selectedDark:
      "bg-sky-600/40 border-2 border-b-4 border-sky-300 ring-4 ring-sky-500/40 text-white shadow-[0_0_32px_rgba(14,165,233,0.5)]",
    selectedLight:
      "bg-sky-600 border-2 border-b-4 border-sky-900 ring-4 ring-sky-400/40 text-white shadow-md",
  },
  {
    // C: Amber / Gold
    cardDark:
      "bg-[#2d2214] border-2 border-b-4 border-amber-400/80 hover:bg-[#3d2e1a] hover:border-amber-300 text-white shadow-[0_12px_30px_rgba(245,158,11,0.2)]",
    cardLight:
      "bg-amber-50/90 border-2 border-b-4 border-amber-400 hover:bg-amber-100/90 hover:border-amber-600 text-amber-950 shadow-sm",
    badge: "bg-amber-500 border-2 border-amber-200 text-zinc-950",
    selectedDark:
      "bg-amber-500/40 border-2 border-b-4 border-amber-300 ring-4 ring-amber-500/40 text-white shadow-[0_0_32px_rgba(245,158,11,0.5)]",
    selectedLight:
      "bg-amber-500 border-2 border-b-4 border-amber-800 ring-4 ring-amber-400/40 text-white shadow-md",
  },
  {
    // D: Emerald
    cardDark:
      "bg-[#132c27] border-2 border-b-4 border-emerald-400/80 hover:bg-[#193b34] hover:border-emerald-300 text-white shadow-[0_12px_30px_rgba(16,185,129,0.2)]",
    cardLight:
      "bg-emerald-50/90 border-2 border-b-4 border-emerald-400 hover:bg-emerald-100/90 hover:border-emerald-600 text-emerald-950 shadow-sm",
    badge: "bg-emerald-600 border-2 border-emerald-300 text-white",
    selectedDark:
      "bg-emerald-600/40 border-2 border-b-4 border-emerald-300 ring-4 ring-emerald-500/40 text-white shadow-[0_0_32px_rgba(16,185,129,0.5)]",
    selectedLight:
      "bg-emerald-600 border-2 border-b-4 border-emerald-900 ring-4 ring-emerald-400/40 text-white shadow-md",
  },
];

export default function PlayPage() {
  const { isDark } = useTheme();
  const dispatch = useDispatch();
  const {
    room,
    player,
    currentQuestion,
    questionStartedAt,
    selectedChoice,
    answerSubmitted,
    answerProgress,
    config,
  } = useSelector((state) => state.game);

  const durationMs =
    currentQuestion?.durationMs || config.questionTimeMs || 20000;

  const [remainingMs, setRemainingMs] = useState(durationMs);
  const lastBeepSecondRef = useRef(null);

  // Suara saat soal baru muncul
  useEffect(() => {
    if (currentQuestion) {
      lastBeepSecondRef.current = null;
      playQuestionStart();
    }
  }, [currentQuestion?.index, currentQuestion]);

  useEffect(() => {
    const startAt = questionStartedAt || Date.now();

    function updateClock() {
      const elapsed = Date.now() - startAt;
      const left = Math.max(durationMs - elapsed, 0);
      setRemainingMs(left);
    }

    updateClock();
    const interval = setInterval(updateClock, 100);
    return () => clearInterval(interval);
  }, [questionStartedAt, durationMs, currentQuestion?.index]);

  const secondsLeft = Math.ceil(remainingMs / 1000);
  const isTimeUp = remainingMs <= 0;
  const isLocked = answerSubmitted || isTimeUp;
  const roomCode = room?.code;
  const playerId = player?.id;

  // Efek suara detak timer setiap pergantian detik
  useEffect(() => {
    if (!currentQuestion) return;
    if (lastBeepSecondRef.current === secondsLeft) return;
    lastBeepSecondRef.current = secondsLeft;

    if (secondsLeft === 0 && !answerSubmitted) {
      playTimeUp();
    } else if (secondsLeft > 0 && secondsLeft <= 10 && !answerSubmitted) {
      playCountdownTick(secondsLeft);
    }
  }, [secondsLeft, answerSubmitted, currentQuestion]);

  const handleSelectOption = useCallback(
    (choiceIndex) => {
      if (isLocked) return;

      playAnswerLock(choiceIndex);
      dispatch(answerLocked(choiceIndex));

      if (roomCode && playerId) {
        emitSubmitAnswer({
          code: roomCode,
          playerId,
          choice: choiceIndex,
        });
      }
    },
    [isLocked, dispatch, roomCode, playerId]
  );

  useEffect(() => {
    function handleKeyDown(e) {
      if (isLocked) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      if (key === "1" || key === "A") handleSelectOption(0);
      if (key === "2" || key === "B") handleSelectOption(1);
      if (key === "3" || key === "C") handleSelectOption(2);
      if (key === "4" || key === "D") handleSelectOption(3);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, handleSelectOption]);

  if (!currentQuestion) {
    return null;
  }

  const progressPercent = Math.min(
    Math.max((remainingMs / durationMs) * 100, 0),
    100
  );

  const hudSurface = isDark
    ? "bg-[#161829] border-2 border-[#3a3f66] shadow-[0_20px_50px_rgba(0,0,0,0.75)]"
    : "bg-white border-2 border-slate-300 shadow-[0_14px_36px_rgba(30,41,59,0.08)]";

  const questionCardSurface = isDark
    ? "bg-[#181b30] border-2 border-indigo-400/75 shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(99,102,241,0.22)]"
    : "bg-white border-2 border-indigo-400 shadow-[0_18px_45px_rgba(79,70,229,0.12)]";

  let timerBadgeClass = isDark
    ? "bg-[#20233a] border-2 border-indigo-400/60 text-white"
    : "bg-indigo-50 border-2 border-indigo-300 text-indigo-950";
  let timerBarClass = "bg-indigo-500";

  if (secondsLeft <= 5) {
    timerBadgeClass = isDark
      ? "bg-rose-950 border-2 border-rose-400 text-rose-200 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.45)]"
      : "bg-rose-100 border-2 border-rose-500 text-rose-900 animate-pulse";
    timerBarClass = "bg-rose-500";
  } else if (secondsLeft <= 10) {
    timerBadgeClass = isDark
      ? "bg-amber-950/80 border-2 border-amber-400 text-amber-200"
      : "bg-amber-100 border-2 border-amber-400 text-amber-900";
    timerBarClass = "bg-amber-500";
  }

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-14 flex flex-col gap-6">
      {/* HUD Atas: Nomor Soal, Topik, Progres Jawaban, dan Hitung Mundur */}
      <section
        aria-label="Status soal berjalan"
        className={`rounded-2xl p-4 sm:px-5 flex flex-col gap-3.5 ${hudSurface}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center flex-wrap gap-2">
            <span
              className={`px-3.5 py-1.5 rounded-xl font-['JetBrains_Mono',monospace] text-xs font-bold tracking-wider border-2 ${
                isDark
                  ? "bg-indigo-600 border-indigo-300 text-white"
                  : "bg-indigo-600 border-indigo-800 text-white"
              }`}
            >
              SOAL {currentQuestion.number} / {currentQuestion.total}
            </span>
            {room?.topic && (
              <span
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 ${
                  isDark
                    ? "bg-[#20233a] border-[#3d426b] text-zinc-100"
                    : "bg-slate-100 border-slate-300 text-slate-800"
                }`}
              >
                {room.topic}
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {answerProgress && (
              <div
                aria-live="polite"
                title="Jumlah pemain yang sudah mengunci jawaban"
                className={`px-3.5 py-1.5 rounded-xl border-2 text-xs font-bold tabular-nums inline-flex items-center gap-2 ${
                  isDark
                    ? "bg-[#20233a] border-emerald-400/60 text-emerald-200"
                    : "bg-emerald-50 border-emerald-300 text-emerald-900"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                />
                <span>
                  {answerProgress.answeredCount}/{answerProgress.totalPlayers}{" "}
                  menjawab
                </span>
              </div>
            )}

            <div
              role="timer"
              aria-label={`Sisa waktu ${secondsLeft} detik`}
              className={`min-w-[92px] px-4 py-1.5 rounded-xl font-['JetBrains_Mono',monospace] text-base sm:text-lg font-bold tabular-nums inline-flex items-center justify-center gap-2 ${timerBadgeClass}`}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{secondsLeft}s</span>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className={`w-full h-2.5 rounded-full overflow-hidden border ${
            isDark
              ? "bg-[#0d0e1a] border-[#343859]"
              : "bg-slate-200 border-slate-300"
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-100 ease-linear ${timerBarClass}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* Kartu Pertanyaan Utama Mencolok */}
      <section
        aria-labelledby="question-text"
        className={`rounded-3xl p-6 sm:p-9 relative overflow-hidden ${questionCardSurface}`}
      >
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-2 bg-indigo-500"
        />
        <span
          className={`inline-block font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider mb-2 ${
            isDark ? "text-indigo-300" : "text-indigo-700"
          }`}
        >
          PERTANYAAN #{currentQuestion.number}
        </span>
        <h1
          id="question-text"
          className="font-['Space_Grotesk',sans-serif] font-bold text-xl sm:text-2xl md:text-3xl leading-snug tracking-tight"
        >
          {currentQuestion.text}
        </h1>
      </section>

      {/* 4 Kartu Pilihan Jawaban 4-Warna Kontras Tinggi */}
      <section
        role="group"
        aria-label="Pilihan jawaban"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {(currentQuestion.options || []).map((optionText, index) => {
          const isSelected = selectedChoice === index;
          const letter = OPTION_KEYS[index] || String(index + 1);
          const style = OPTION_STYLES[index % OPTION_STYLES.length];

          let cardClass = isDark ? style.cardDark : style.cardLight;
          if (isSelected) {
            cardClass = isDark ? style.selectedDark : style.selectedLight;
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectOption(index)}
              disabled={isLocked}
              aria-pressed={isSelected}
              className={`min-h-[92px] p-4 sm:p-5 rounded-2xl text-left flex items-center gap-4 transition-all duration-200 cursor-pointer ${
                !isLocked
                  ? "hover:-translate-y-1 active:translate-y-0"
                  : ""
              } ${cardClass} ${
                isLocked && !isSelected ? "opacity-45 cursor-not-allowed" : ""
              }`}
            >
              <span
                aria-hidden="true"
                className={`w-12 h-12 rounded-xl font-['Space_Grotesk',sans-serif] text-lg font-bold inline-flex items-center justify-center shrink-0 shadow-sm ${style.badge}`}
              >
                {letter}
              </span>
              <span className="flex-1 text-base sm:text-lg font-bold leading-snug">
                {optionText}
              </span>
              <span
                aria-hidden="true"
                className={`font-['JetBrains_Mono',monospace] text-xs font-bold px-2.5 py-1 rounded-lg border-2 shrink-0 ${
                  isSelected
                    ? "bg-white text-zinc-950 border-white"
                    : isDark
                      ? "bg-[#0d0e1a]/80 border-white/25 text-zinc-200"
                      : "bg-white/90 border-slate-300 text-slate-700"
                }`}
              >
                {isSelected ? "TERKUNCI" : `[${index + 1}]`}
              </span>
            </button>
          );
        })}
      </section>

      {/* Status Bar Jawaban Terkirim / Waktu Habis */}
      <section aria-live="polite">
        {answerSubmitted ? (
          <div
            className={`p-4 sm:px-5 rounded-2xl border-2 flex items-center gap-3.5 ${
              isDark
                ? "bg-indigo-950/80 border-indigo-400 text-indigo-100"
                : "bg-indigo-50 border-indigo-400 text-indigo-950"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="text-indigo-400 shrink-0"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div className="text-xs sm:text-sm">
              <strong className="block font-bold">
                Jawaban {OPTION_KEYS[selectedChoice]} berhasil dikunci!
              </strong>
              <span className="font-medium opacity-90">
                Menunggu pemain lain selesai menjawab atau waktu berakhir...
              </span>
            </div>
          </div>
        ) : isTimeUp ? (
          <div
            className={`p-4 sm:px-5 rounded-2xl border-2 flex items-center gap-3.5 ${
              isDark
                ? "bg-amber-950/80 border-amber-400 text-amber-100"
                : "bg-amber-50 border-amber-400 text-amber-950"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="text-amber-400 shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="text-xs sm:text-sm">
              <strong className="block font-bold">Waktu menjawab habis</strong>
              <span className="font-medium opacity-90">
                Menyiapkan kunci jawaban dan klasemen sementara...
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`text-center text-xs font-semibold ${
              isDark ? "text-zinc-300" : "text-slate-600"
            }`}
          >
            <span>
              Klik salah satu kartu warna di atas atau tekan tombol{" "}
              <kbd
                className={`font-['JetBrains_Mono',monospace] text-[11px] font-bold px-2 py-0.5 rounded border-2 ${
                  isDark
                    ? "bg-[#161829] border-indigo-400/60 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              >
                1
              </kbd>{" "}
              –{" "}
              <kbd
                className={`font-['JetBrains_Mono',monospace] text-[11px] font-bold px-2 py-0.5 rounded border-2 ${
                  isDark
                    ? "bg-[#161829] border-indigo-400/60 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              >
                4
              </kbd>{" "}
              di keyboard.
            </span>
          </div>
        )}
      </section>
    </main>
  );
}
