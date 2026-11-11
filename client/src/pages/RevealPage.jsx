import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";
import { playRevealSound } from "../utils/soundEffects";

const OPTION_KEYS = ["A", "B", "C", "D"];

export default function RevealPage() {
  const { isDark } = useTheme();
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

  const pointsByPlayerId = new Map(
    results.map((item) => [item.playerId, item])
  );

  const secondsLeft = Math.ceil(remainingMs / 1000);
  const progressPercent = Math.min(
    Math.max((remainingMs / revealDurationMs) * 100, 0),
    100
  );

  const primaryCardSurface = isDark
    ? "bg-[#161829] border-2 border-[#3a3f66] shadow-[0_24px_60px_rgba(0,0,0,0.8)]"
    : "bg-white border-2 border-slate-300 shadow-[0_18px_45px_rgba(30,41,59,0.1)]";

  const subSurface = isDark
    ? "bg-[#20233a] border-2 border-[#3b4068]"
    : "bg-slate-50 border-2 border-slate-200";

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Kolom Kiri: Jawaban Benar & Penjelasan AI */}
      <section
        aria-labelledby="reveal-heading"
        className={`lg:col-span-6 rounded-3xl p-6 sm:p-7 flex flex-col gap-5 relative overflow-hidden ${primaryCardSurface}`}
      >
        <div
          aria-hidden="true"
          className={`absolute top-0 inset-x-0 h-2 ${
            isCorrect ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />

        <div className="flex items-center justify-between flex-wrap gap-2.5 pt-1">
          <span
            className={`px-3.5 py-1 rounded-xl font-['JetBrains_Mono',monospace] text-xs font-bold tracking-wider border-2 ${
              isDark
                ? "bg-[#20233a] border-[#3d426b] text-zinc-100"
                : "bg-slate-100 border-slate-300 text-slate-800"
            }`}
          >
            PEMBAHASAN SOAL {revealData.number} / {revealData.total}
          </span>

          <div
            className={`px-3.5 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1.5 border-2 ${
              isCorrect
                ? isDark
                  ? "bg-emerald-500/25 border-emerald-400 text-emerald-200"
                  : "bg-emerald-100 border-emerald-500 text-emerald-900"
                : isDark
                  ? "bg-rose-500/25 border-rose-400 text-rose-200"
                  : "bg-rose-100 border-rose-500 text-rose-900"
            }`}
          >
            {isCorrect ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Benar · +{earnedPoints} Poin</span>
              </>
            ) : myChoice === null || myChoice === undefined ? (
              <span>Waktu Habis · +0 Poin</span>
            ) : (
              <span>Kurang Tepat · +0 Poin</span>
            )}
          </div>
        </div>

        {currentQuestion?.text && (
          <h1
            id="reveal-heading"
            className="font-['Space_Grotesk',sans-serif] font-bold text-xl sm:text-2xl leading-snug tracking-tight"
          >
            {currentQuestion.text}
          </h1>
        )}

        {/* Daftar Opsi dengan Penanda Kunci Jawaban Kontras Tinggi */}
        {options.length > 0 && (
          <div
            aria-label="Evaluasi opsi jawaban"
            className="flex flex-col gap-3"
          >
            {options.map((optText, index) => {
              const isAnswer = index === correctIndex;
              const isPicked = index === myChoice;

              let rowClasses = subSurface;
              if (isAnswer) {
                rowClasses = isDark
                  ? "bg-[#132c27] border-2 border-b-4 border-emerald-400 text-white shadow-[0_0_24px_rgba(16,185,129,0.25)]"
                  : "bg-emerald-50 border-2 border-b-4 border-emerald-500 text-emerald-950";
              } else if (isPicked) {
                rowClasses = isDark
                  ? "bg-[#2e1621] border-2 border-b-4 border-rose-400 text-white"
                  : "bg-rose-50 border-2 border-b-4 border-rose-500 text-rose-950";
              }

              return (
                <div
                  key={index}
                  className={`p-4 rounded-2xl flex items-center gap-3.5 transition-all ${rowClasses}`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-10 h-10 rounded-xl font-['Space_Grotesk',sans-serif] font-bold text-sm inline-flex items-center justify-center shrink-0 border-2 ${
                      isAnswer
                        ? "bg-emerald-500 border-emerald-300 text-white"
                        : isPicked
                          ? "bg-rose-500 border-rose-300 text-white"
                          : isDark
                            ? "bg-[#121424] border-[#3d426b] text-white"
                            : "bg-white border-slate-300 text-slate-900"
                    }`}
                  >
                    {OPTION_KEYS[index]}
                  </span>
                  <span className="flex-1 font-bold text-sm sm:text-base">
                    {optText}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPicked && (
                      <span
                        className={`font-['JetBrains_Mono',monospace] text-[10px] font-bold px-2.5 py-1 rounded-lg border-2 ${
                          isDark
                            ? "bg-[#121424] border-white/30 text-white"
                            : "bg-white border-slate-400 text-slate-800"
                        }`}
                      >
                        Pilihanmu
                      </span>
                    )}
                    {isAnswer && (
                      <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500 text-white border-2 border-emerald-300">
                        Kunci Benar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Kotak Penjelasan Singkat dari AI */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border-2 border-l-4 border-l-indigo-500 flex flex-col gap-1.5 ${
            isDark
              ? "bg-[#1d2038] border-indigo-400/50"
              : "bg-indigo-50/75 border-indigo-200"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Penjelasan AI</span>
          </div>
          <p
            className={`text-sm font-medium leading-relaxed ${
              isDark ? "text-zinc-200" : "text-slate-700"
            }`}
          >
            {revealData.explanation}
          </p>
        </div>
      </section>

      {/* Kolom Kanan: Papan Skor Sementara */}
      <section
        aria-labelledby="standings-heading"
        className={`lg:col-span-6 rounded-3xl p-6 sm:p-7 flex flex-col gap-5 relative overflow-hidden ${primaryCardSurface}`}
      >
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-2 bg-indigo-500"
        />

        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <div>
            <span
              className={`font-['JetBrains_Mono',monospace] text-xs font-bold tracking-wider uppercase ${
                isDark ? "text-indigo-300" : "text-indigo-700"
              }`}
            >
              KLASEMEN SEMENTARA
            </span>
            <h2
              id="standings-heading"
              className="font-['Space_Grotesk',sans-serif] text-xl sm:text-2xl font-bold tracking-tight mt-0.5"
            >
              Papan Skor Realtime
            </h2>
          </div>

          <div
            aria-live="polite"
            className={`px-3.5 py-1.5 rounded-full font-['JetBrains_Mono',monospace] text-xs font-bold tabular-nums inline-flex items-center gap-2 ${subSurface}`}
          >
            <span
              aria-hidden="true"
              className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"
            />
            <span>
              {revealData.isLast
                ? `Hasil akhir dalam ${secondsLeft}s`
                : `Soal berikutnya ${secondsLeft}s`}
            </span>
          </div>
        </div>

        {/* Transition Progress Bar */}
        <div
          aria-hidden="true"
          className={`w-full h-2 rounded-full overflow-hidden border ${
            isDark
              ? "bg-[#0d0e1a] border-[#343859]"
              : "bg-slate-200 border-slate-300"
          }`}
        >
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <ol
          aria-label="Peringkat sementara pemain"
          className="flex flex-col gap-3"
        >
          {leaderboard.map((entry) => {
            const isSelf = entry.playerId === player?.id;
            const roundInfo = pointsByPlayerId.get(entry.playerId);
            const deltaPoints = roundInfo?.points ?? 0;

            return (
              <li
                key={entry.playerId}
                className={`p-4 rounded-2xl border-2 border-b-4 flex items-center gap-3.5 transition-transform duration-200 hover:-translate-y-0.5 ${
                  entry.rank === 1
                    ? isDark
                      ? "bg-[#2c2214] border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : "bg-amber-50 border-amber-400 text-amber-950"
                    : isSelf
                      ? isDark
                        ? "bg-indigo-600/25 border-indigo-400 text-white"
                        : "bg-indigo-50 border-indigo-400 text-indigo-950"
                      : subSurface
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl font-['JetBrains_Mono',monospace] font-bold text-xs inline-flex items-center justify-center shrink-0 border-2 ${
                    entry.rank === 1
                      ? "bg-amber-500 border-amber-200 text-zinc-950"
                      : isDark
                        ? "bg-[#121424] border-[#3d426b] text-white"
                        : "bg-white border-slate-300 text-slate-800"
                  }`}
                >
                  #{entry.rank}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-bold text-sm sm:text-base truncate">
                      {entry.name}
                    </span>
                    {isSelf && (
                      <span
                        className={`px-2 py-0.5 rounded-md font-['JetBrains_Mono',monospace] text-[10px] font-bold border ${
                          isDark
                            ? "bg-indigo-500/40 text-white border-indigo-300"
                            : "bg-indigo-600 text-white border-indigo-700"
                        }`}
                      >
                        KAMU
                      </span>
                    )}
                    {!entry.connected && (
                      <span
                        className={`px-2 py-0.5 rounded-md font-['JetBrains_Mono',monospace] text-[10px] font-bold border ${
                          isDark
                            ? "bg-rose-500/30 text-rose-200 border-rose-400"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        Terputus
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 font-['JetBrains_Mono',monospace] tabular-nums">
                  {deltaPoints > 0 ? (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border-2 ${
                        isDark
                          ? "bg-emerald-500/25 border-emerald-400 text-emerald-200"
                          : "bg-emerald-100 border-emerald-400 text-emerald-900"
                      }`}
                    >
                      +{deltaPoints}
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border opacity-65 ${
                        isDark
                          ? "bg-[#121424] border-[#3d426b] text-zinc-300"
                          : "bg-slate-100 border-slate-300 text-slate-600"
                      }`}
                    >
                      +0
                    </span>
                  )}
                  <strong className="text-base sm:text-lg font-bold">
                    {entry.score.toLocaleString("id-ID")}
                  </strong>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
