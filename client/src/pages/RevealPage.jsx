import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import BlobAvatar from "../components/BlobAvatar";
import {
  IconAlert,
  IconCheck,
  IconClock,
  IconCrown,
  IconSparkle,
} from "../components/Icons";
import Mascot from "../components/Mascot";
import { useTheme } from "../context/ThemeContext";
import { colorFor, getSkin } from "../theme/skin";
import { playRevealSound } from "../utils/soundEffects";

const OPTION_KEYS = ["A", "B", "C", "D"];

export default function RevealPage() {
  const { isDark } = useTheme();
  const skin = getSkin(isDark);
  const { player, currentQuestion, selectedChoice, revealData, config } =
    useSelector((state) => state.game);

  const revealDurationMs = config.revealTimeMs || 8000;
  const [remainingMs, setRemainingMs] = useState(revealDurationMs);

  const correctIndex = revealData?.correctIndex;
  const results = revealData?.results || [];
  const selfResult = results.find((item) => item.playerId === player?.id);
  const myChoice =
    selfResult?.choice !== undefined ? selfResult.choice : selectedChoice;
  const isCorrect =
    selfResult !== undefined
      ? selfResult.correct
      : myChoice !== null && myChoice === correctIndex;

  useEffect(() => {
    if (revealData) {
      playRevealSound(Boolean(isCorrect));
    }
  }, [revealData?.index, revealData, isCorrect]);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setRemainingMs(Math.max(revealDurationMs - elapsed, 0));
    }, 100);

    return () => clearInterval(interval);
  }, [revealDurationMs, revealData?.index]);

  if (!revealData) {
    return null;
  }

  const options = currentQuestion?.options || [];
  const leaderboard = revealData.leaderboard || [];
  const earnedPoints = selfResult?.points ?? 0;
  const secondsLeft = Math.ceil(remainingMs / 1000);
  const progressPercent = Math.min(
    Math.max((remainingMs / revealDurationMs) * 100, 0),
    100
  );

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* ======================================================== */}
      {/* TOP EVALUATION HERO CARD: Result Mood + Mascot          */}
      {/* ======================================================== */}
      <section
        className="animate-pop-in rounded-[36px] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden transition-all"
        style={{
          backgroundColor: isCorrect ? skin.lime : skin.cardBg,
          borderColor: isCorrect ? "#0E1236" : skin.cardBorder,
          borderWidth: "3px",
          color: isCorrect ? skin.navy : skin.cardText,
          boxShadow: isCorrect ? skin.limeCardShadow : skin.cardShadow,
        }}
      >
        <div className="flex items-center gap-5">
          <Mascot
            variant="face"
            size={100}
            mood={isCorrect ? "happy" : "sad"}
          />
          <div>
            <div className="flex items-center gap-2">
              <span
                className="px-3.5 py-1 rounded-full text-xs font-display font-bold uppercase tracking-wider border-2 border-[#0E1236] shadow-[0_2.5px_0_#0E1236]"
                style={{
                  backgroundColor: isCorrect ? skin.navy : skin.coral,
                  color: "#FFFFFF",
                }}
              >
                {isCorrect ? "JAWABAN TEPAT!" : "KURANG TEPAT"}
              </span>
              <span className="text-xs font-sans font-bold opacity-80">
                {earnedPoints > 0 ? `+${earnedPoints} Poin` : "+0 Poin"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-bold mt-2">
              {isCorrect
                ? "Luar biasa! Refleksmu sangat cepat!"
                : myChoice === null || myChoice === undefined
                ? "Waktu habis sebelum memilih jawaban!"
                : "Jawabanmu belum tepat di ronde ini."}
            </h1>
          </div>
        </div>

        {/* Countdown to Next Round Pill */}
        <div
          className="px-5 py-3 rounded-2xl flex items-center gap-2.5 font-display font-bold text-xs border-2 border-[#0E1236] shadow-[0_3px_0_#0E1236]"
          style={{
            backgroundColor: isCorrect ? skin.navy : skin.periwinkle,
            color: isCorrect ? skin.lime : skin.navy,
          }}
        >
          <IconClock size={16} />
          <span>Ronde berikutnya dalam {secondsLeft}s</span>
        </div>
      </section>

      {/* Countdown Progress Bar */}
      <div
        className="w-full h-3 rounded-full overflow-hidden border-2 border-[#0E1236]"
        style={{
          backgroundColor: isDark ? "#0A0D28" : "#E8DFC5",
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-100 ease-linear"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: skin.lime,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* KOLOM KIRI: Question Review & AI Explanation (7 cols)    */}
        {/* ======================================================== */}
        <section
          aria-labelledby="review-title"
          className="lg:col-span-7 rounded-[36px] p-6 sm:p-8 flex flex-col gap-5"
          style={{
            backgroundColor: skin.cardBg,
            borderColor: skin.cardBorder,
            borderWidth: "3px",
            boxShadow: skin.cardShadow,
            color: skin.cardText,
          }}
        >
          <div>
            <span className="text-xs font-display font-bold uppercase tracking-wider opacity-70">
              Evaluasi Soal #{((currentQuestion?.index ?? 0) + 1)}
            </span>
            <h2 id="review-title" className="text-lg sm:text-xl font-display font-bold mt-1">
              {currentQuestion?.text}
            </h2>
          </div>

          {/* Options Breakdown (High Contrast) */}
          <div className="flex flex-col gap-3">
            {options.map((optionText, idx) => {
              const isOptionCorrect = idx === correctIndex;
              const isOptionMine = idx === myChoice;
              const letter = OPTION_KEYS[idx] || `${idx + 1}`;

              let optBg = isDark ? "#0A0D28" : "#F8F9FA";
              let optBorder = skin.cardBorder;
              let optText = skin.cardText;

              if (isOptionCorrect) {
                optBg = skin.lime;
                optBorder = "#0E1236";
                optText = skin.navy;
              } else if (isOptionMine && !isOptionCorrect) {
                optBg = skin.coral;
                optBorder = "#0E1236";
                optText = "#FFFFFF";
              }

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl flex items-center justify-between gap-3 font-display font-bold transition-all border-2"
                  style={{
                    backgroundColor: optBg,
                    borderColor: optBorder,
                    color: optText,
                    boxShadow: isOptionCorrect || isOptionMine ? "0 3.5px 0 #0E1236" : "none",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 border-[#0E1236]"
                      style={{
                        backgroundColor: isOptionCorrect
                          ? skin.navy
                          : isOptionMine
                          ? "#FFFFFF"
                          : skin.cardBorder,
                        color: isOptionCorrect
                          ? skin.lime
                          : isOptionMine
                          ? skin.coral
                          : skin.cardText,
                      }}
                    >
                      {letter}
                    </span>
                    <span className="text-sm truncate font-display">{optionText}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isOptionCorrect && (
                      <span className="px-3 py-1 rounded-full text-[10px] bg-[#0E1236] text-[#C5F23A] border border-[#0E1236] flex items-center gap-1">
                        <IconCheck size={12} />
                        KUNCI BENAR
                      </span>
                    )}
                    {isOptionMine && !isOptionCorrect && (
                      <span className="px-3 py-1 rounded-full text-[10px] bg-white text-[#FF7A66] border border-[#0E1236] flex items-center gap-1 font-bold">
                        <IconAlert size={12} />
                        PILIHANMU
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Explanation Card */}
          {currentQuestion?.explanation && (
            <div
              className="p-5 rounded-3xl flex items-start gap-3 mt-2 border-2.5 border-[#0E1236] shadow-[0_4px_0_#0E1236]"
              style={{
                backgroundColor: isDark ? "#1C235A" : "#EDF0FF",
              }}
            >
              <div
                className="p-2.5 rounded-xl text-white flex-shrink-0 border-2 border-[#0E1236]"
                style={{ backgroundColor: skin.navy }}
              >
                <IconSparkle size={18} />
              </div>
              <div className="text-xs">
                <span className="font-display font-bold uppercase tracking-wider block text-xs text-[#0E1236] dark:text-[#FFF8E7]">
                  Penjelasan Cerdas AI
                </span>
                <p className="mt-1 font-sans font-bold opacity-85 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* KOLOM KANAN: Live Round Leaderboard (5 cols)             */}
        {/* ======================================================== */}
        <section
          aria-labelledby="leaderboard-title"
          className="lg:col-span-5 rounded-[36px] p-6 sm:p-7 flex flex-col gap-4"
          style={{
            backgroundColor: skin.cardBg,
            borderColor: skin.cardBorder,
            borderWidth: "3px",
            boxShadow: skin.cardShadow,
            color: skin.cardText,
          }}
        >
          <div
            className="flex items-center justify-between border-b-2 pb-3"
            style={{ borderColor: skin.cardBorder }}
          >
            <h3 id="leaderboard-title" className="font-display font-bold text-base">
              Klasemen Sementara
            </h3>
            <span className="text-xs font-sans font-bold opacity-70">Ronde Ini</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {leaderboard.map((entry, rankIdx) => {
              const isYou = entry.playerId === player?.id;
              const avatarColor = colorFor(entry.playerId || entry.name || rankIdx);
              const rank = rankIdx + 1;

              return (
                <div
                  key={entry.playerId || rankIdx}
                  className="p-3 rounded-2xl flex items-center justify-between gap-3 transition-transform hover:scale-[1.01] border-2"
                  style={{
                    backgroundColor: isDark
                      ? isYou
                        ? "#1F255A"
                        : "#0A0D28"
                      : isYou
                      ? "#F3FBD4"
                      : "#FFFFFF",
                    borderColor: isYou ? skin.lime : skin.cardBorder,
                    boxShadow: isYou ? `0 3.5px 0 ${skin.cardBorder}` : "none",
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center font-display font-bold text-xs border border-[#0E1236]"
                      style={{
                        backgroundColor:
                          rank === 1
                            ? "#FFC93C"
                            : rank === 2
                            ? "#CBD5E1"
                            : rank === 3
                            ? "#F6AD55"
                            : "transparent",
                        color: rank <= 3 ? skin.navy : skin.cardText,
                      }}
                    >
                      {rank === 1 ? <IconCrown size={12} /> : rank}
                    </span>

                    <BlobAvatar
                      name={entry.name}
                      color={avatarColor}
                      size={34}
                      isYou={isYou}
                    />

                    <div className="min-w-0">
                      <span className="font-display font-bold text-xs truncate block">
                        {entry.name} {isYou && "(Kamu)"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-display font-bold text-sm">
                      {entry.totalScore ?? entry.score ?? 0}
                    </span>
                    <span className="text-[10px] font-sans font-bold opacity-60">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
