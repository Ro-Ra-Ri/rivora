import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  IconBolt,
  IconClock,
  IconLock,
  IconSparkle,
} from "../components/Icons";
import Mascot from "../components/Mascot";
import { useTheme } from "../context/ThemeContext";
import { emitSubmitAnswer } from "../socket";
import {
  answerLocked,
  answerSubmissionFailed,
} from "../store/gameSlice";
import { getSkin } from "../theme/skin";
import {
  playAnswerLock,
  playCountdownTick,
  playQuestionStart,
  playTimeUp,
} from "../utils/soundEffects";

const OPTION_KEYS = ["A", "B", "C", "D"];

// 4 Warna Pilihan Khas Plop (Playful, High Contrast, Solid Tactile Borders)
const PLOP_OPTIONS = [
  {
    bg: "#C5F23A", // Lime
    text: "#0E1236",
    badgeBg: "#0E1236",
    badgeText: "#C5F23A",
  },
  {
    bg: "#8B9CFF", // Periwinkle
    text: "#0E1236",
    badgeBg: "#0E1236",
    badgeText: "#8B9CFF",
  },
  {
    bg: "#FF7A66", // Coral
    text: "#FFFFFF",
    badgeBg: "#0E1236",
    badgeText: "#FFFFFF",
  },
  {
    bg: "#FFC93C", // Sunflower Gold
    text: "#0E1236",
    badgeBg: "#0E1236",
    badgeText: "#FFC93C",
  },
];

export default function PlayPage() {
  const { isDark } = useTheme();
  const skin = getSkin(isDark);
  const dispatch = useDispatch();

  const {
    currentQuestion,
    room,
    player,
    selectedChoice,
    answerSubmitted,
    config,
  } =
    useSelector((state) => state.game);

  const durationMs =
    currentQuestion?.durationMs ||
    (config.answerDurationSec ? config.answerDurationSec * 1000 : 20000);

  const [remainingMs, setRemainingMs] = useState(durationMs);
  const lastTickSecondRef = useRef(null);

  // Play sound when new question arrives
  useEffect(() => {
    if (currentQuestion) {
      playQuestionStart();
      lastTickSecondRef.current = null;
    }
  }, [currentQuestion?.index, currentQuestion]);

  // High-frequency countdown timer
  useEffect(() => {
    const startedAt = currentQuestion?.startedAt
      ? new Date(currentQuestion.startedAt).getTime()
      : Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(durationMs - elapsed, 0);
      setRemainingMs(left);

      const sec = Math.ceil(left / 1000);
      if (sec <= 5 && sec > 0 && lastTickSecondRef.current !== sec) {
        lastTickSecondRef.current = sec;
        playCountdownTick(sec);
      }
      if (left === 0 && lastTickSecondRef.current !== 0) {
        lastTickSecondRef.current = 0;
        playTimeUp();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [durationMs, currentQuestion?.startedAt, currentQuestion?.index]);

  const handleChoose = (choiceIndex) => {
    if (answerSubmitted || remainingMs <= 0 || !room?.code || !player?.id) {
      return;
    }

    playAnswerLock();
    dispatch(answerLocked(choiceIndex));

    emitSubmitAnswer({
      code: room.code,
      choice: choiceIndex,
    }).then((response) => {
      if (!response) dispatch(answerSubmissionFailed());
    });
  };

  if (!currentQuestion) {
    return null;
  }

  const options = currentQuestion.options || [];
  const questionIndex = (currentQuestion.index ?? 0) + 1;
  const totalQuestions = currentQuestion.total || room?.questionCount || 5;
  const secondsLeft = Math.ceil(remainingMs / 1000);
  const progressPercent = Math.min(
    Math.max((remainingMs / durationMs) * 100, 0),
    100
  );

  // Mascot dynamic mood
  let mascotMood = "idle";
  if (answerSubmitted) {
    mascotMood = "happy";
  } else if (secondsLeft <= 5) {
    mascotMood = "shock";
  } else if (secondsLeft <= 10) {
    mascotMood = "thinking";
  }

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* ======================================================== */}
      {/* TOP HUD BAR: High-Contrast Tactile Bar                   */}
      {/* ======================================================== */}
      <section
        className="rounded-[32px] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
        style={{
          backgroundColor: skin.cardBg,
          borderColor: skin.cardBorder,
          borderWidth: "3px",
          boxShadow: skin.cardShadow,
          color: skin.cardText,
        }}
      >
        {/* Left: Mascot & Question Counter */}
        <div className="flex items-center gap-3.5">
          <Mascot variant="face" size={68} mood={mascotMood} />
          <div>
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-display font-bold uppercase tracking-wider border-2 border-[#0E1236] shadow-[0_2.5px_0_#0E1236]"
                style={{ backgroundColor: skin.lime, color: skin.navy }}
              >
                Soal {questionIndex} / {totalQuestions}
              </span>
              <span className="text-xs font-sans font-bold opacity-75">
                {room?.topic || "Kuis"}
              </span>
            </div>
            <p className="text-xs font-display font-bold opacity-70 mt-1">
              {answerSubmitted
                ? "✓ Jawabanmu sudah terkunci! Menunggu ronde usai..."
                : "Pilih 1 jawaban paling tepat sebelum waktu habis!"}
            </p>
          </div>
        </div>

        {/* Right: Digital Timer Counter (Chunky Box) */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 border-2.5 border-[#0E1236] transition-all duration-200 ${
              secondsLeft <= 5 ? "animate-heartbeat" : ""
            }`}
            style={{
              backgroundColor: secondsLeft <= 5 ? skin.coral : skin.navy,
              color: "#FFFFFF",
              boxShadow: "0 4px 0 #0E1236",
            }}
          >
            <IconClock size={18} />
            <span className="font-display font-bold text-2xl tracking-tight">
              {secondsLeft}s
            </span>
          </div>

          <div
            className="px-3.5 py-2 rounded-2xl flex items-center gap-1.5 border-2"
            style={{
              backgroundColor: isDark ? "#0A0D28" : "#F4E7C5",
              borderColor: skin.cardBorder,
              boxShadow: `0 3px 0 ${skin.cardBorder}`,
            }}
          >
            <IconBolt size={16} />
            <span className="font-display font-bold text-xs">
              Maks 1000 Pts
            </span>
          </div>
        </div>
      </section>

      {/* Timer Progress Bar (Thick border) */}
      <div
        className="w-full h-4 rounded-full overflow-hidden p-0.5 border-2 border-[#0E1236]"
        style={{
          backgroundColor: isDark ? "#0A0D28" : "#E8DFC5",
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-100 ease-linear"
          style={{
            width: `${progressPercent}%`,
            backgroundColor:
              secondsLeft <= 5 ? skin.coral : secondsLeft <= 10 ? "#FFC93C" : skin.lime,
          }}
        />
      </div>

      {/* ======================================================== */}
      {/* QUESTION CARD: High-Contrast Big Typography              */}
      {/* ======================================================== */}
      <section
        className="rounded-[36px] p-7 sm:p-10 flex flex-col items-center text-center relative overflow-hidden transition-all"
        style={{
          backgroundColor: skin.cardBg,
          borderColor: skin.cardBorder,
          borderWidth: "3px",
          boxShadow: skin.cardShadow,
          color: skin.cardText,
        }}
      >
        {/* Subtle decorative bubbles */}
        <div
          aria-hidden="true"
          className="absolute -top-8 -left-8 w-24 h-24 rounded-full pointer-events-none opacity-40 border-2 border-[#0E1236]/20"
          style={{ backgroundColor: skin.lime }}
        />
        <div
          aria-hidden="true"
          className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none opacity-40 border-2 border-[#0E1236]/20"
          style={{ backgroundColor: skin.periwinkle }}
        />

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider mb-4 border-2 border-[#0E1236] shadow-[0_2.5px_0_#0E1236]"
          style={{ backgroundColor: skin.periwinkle, color: skin.navy }}
        >
          <IconSparkle size={14} />
          <span>Pertanyaan #{questionIndex}</span>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold leading-relaxed max-w-2xl">
          {currentQuestion.text}
        </h2>
      </section>

      {/* ======================================================== */}
      {/* 4 CHUNKY 3D TACTILE OPTION BUTTONS (A, B, C, D)          */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((optionText, index) => {
          const optStyle = PLOP_OPTIONS[index % PLOP_OPTIONS.length];
          const isSelected = selectedChoice === index;
          const letter = OPTION_KEYS[index] || `${index + 1}`;

          return (
            <button
              key={index}
              type="button"
              disabled={answerSubmitted || remainingMs <= 0}
              onClick={() => handleChoose(index)}
              className="group rounded-3xl p-5 sm:p-6 flex items-center gap-4 text-left font-display font-bold transition-all duration-150 cursor-pointer disabled:cursor-not-allowed select-none hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
              style={{
                backgroundColor: optStyle.bg,
                color: optStyle.text,
                border: "3px solid #0E1236",
                boxShadow: isSelected
                  ? "0 2px 0 #0E1236"
                  : "0 6px 0 #0E1236",
                transform: isSelected
                  ? "translateY(4px)"
                  : "none",
                opacity: answerSubmitted && !isSelected ? 0.45 : 1,
              }}
            >
              {/* Option Letter Badge (Chunky 3D square) */}
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-xl flex-shrink-0 border-2 border-[#0E1236] shadow-[0_3px_0_#0E1236] transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: optStyle.badgeBg,
                  color: optStyle.badgeText,
                }}
              >
                {letter}
              </span>

              {/* Option Text */}
              <div className="flex-1 min-w-0">
                <span className="text-base sm:text-lg leading-snug line-clamp-3 font-display">
                  {optionText}
                </span>
              </div>

              {/* Locked Badge if chosen */}
              {isSelected && (
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-display font-bold flex items-center gap-1.5 flex-shrink-0 border-2 border-[#0E1236]"
                  style={{
                    backgroundColor: skin.navy,
                    color: skin.lime,
                  }}
                >
                  <IconLock size={12} />
                  <span>KUNCI</span>
                </div>
              )}
            </button>
          );
        })}
      </section>

      {/* Bottom Status Feedback */}
      <div className="text-center font-sans font-bold text-xs">
        {answerSubmitted ? (
          <span className="inline-block px-4 py-2 rounded-full bg-[#0E1236] text-[#C5F23A] border-2 border-[#0E1236] shadow-[0_3px_0_#0E1236]">
            ✓ Pilihanmu sudah tersimpan! Jawaban benar akan dibuka saat timer habis.
          </span>
        ) : (
          <span className="opacity-75">
            Klik salah satu tombol opsi di atas untuk mengunci jawabanmu sebelum waktu habis.
          </span>
        )}
      </div>
    </main>
  );
}
