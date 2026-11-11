import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { emitLeaveRoom } from "../socket";
import { leaveAndReset } from "../store/gameSlice";
import { playClick, playVictoryFanfare } from "../utils/soundEffects";

export default function ResultPage() {
  const { isDark } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { room, player, finalResult } = useSelector((state) => state.game);

  useEffect(() => {
    if (finalResult) {
      playVictoryFanfare();
    }
  }, [finalResult]);

  if (!finalResult) {
    return null;
  }

  const leaderboard = finalResult.leaderboard || [];
  const winners = finalResult.winners || [];
  const topic = finalResult.topic || room?.topic || "Kuis";

  const selfStanding = leaderboard.find(
    (entry) => entry.playerId === player?.id
  );

  function handleBackToLanding() {
    playClick();
    if (room?.code && player?.id) {
      emitLeaveRoom({ code: room.code, playerId: player.id });
    }
    dispatch(leaveAndReset());
    navigate("/");
  }

  const winnerCardSurface = isDark
    ? "bg-[#1a1829] border-2 border-amber-400/75 shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_36px_rgba(245,158,11,0.2)]"
    : "bg-white border-2 border-amber-400 shadow-[0_18px_45px_rgba(245,158,11,0.14)]";

  const boardCardSurface = isDark
    ? "bg-[#161829] border-2 border-[#3a3f66] shadow-[0_24px_60px_rgba(0,0,0,0.8)]"
    : "bg-white border-2 border-slate-300 shadow-[0_18px_45px_rgba(30,41,59,0.1)]";

  const subSurface = isDark
    ? "bg-[#20233a] border-2 border-[#3b4068]"
    : "bg-slate-50 border-2 border-slate-200";

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Kolom Kiri: Sorotan Pemenang */}
      <section
        aria-labelledby="winner-title"
        className={`lg:col-span-6 rounded-3xl p-6 sm:p-8 flex flex-col gap-5 relative overflow-hidden ${winnerCardSurface}`}
      >
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-2 bg-amber-500"
        />

        <div className="flex items-center justify-between pt-1">
          <div
            aria-hidden="true"
            className={`w-15 h-15 rounded-2xl border-2 border-b-4 inline-flex items-center justify-center ${
              isDark
                ? "bg-amber-500/25 border-amber-300 text-amber-300 shadow-[0_0_28px_rgba(245,158,11,0.35)]"
                : "bg-amber-100 border-amber-400 text-amber-700"
            }`}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>

          <span
            className={`px-3.5 py-1 rounded-full font-['JetBrains_Mono',monospace] text-xs font-bold tracking-wider uppercase border-2 ${
              isDark
                ? "bg-amber-500/25 border-amber-400 text-amber-200"
                : "bg-amber-100 border-amber-400 text-amber-900"
            }`}
          >
            PERTANDINGAN SELESAI
          </span>
        </div>

        <span
          className={`font-['JetBrains_Mono',monospace] text-xs font-bold tracking-wider uppercase ${
            isDark ? "text-amber-300" : "text-amber-800"
          }`}
        >
          TOPIK KUIS · {topic}
        </span>

        {winners.length > 0 ? (
          <>
            <h1
              id="winner-title"
              className="font-['Space_Grotesk',sans-serif] font-bold text-2xl sm:text-3xl leading-tight tracking-tight"
            >
              {winners.length === 1
                ? `${winners[0].name} Memenangkan Pertandingan!`
                : `Juara Bersama: ${winners.map((w) => w.name).join(" & ")}!`}
            </h1>
            <div
              className={`self-start px-4 py-2.5 rounded-xl border-2 border-b-4 inline-flex items-center gap-3 font-['JetBrains_Mono',monospace] tabular-nums ${
                isDark
                  ? "bg-[#2c2214] border-amber-400 text-amber-200"
                  : "bg-amber-50 border-amber-400 text-amber-950"
              }`}
            >
              <span className="text-xs font-bold">Skor Tertinggi</span>
              <strong className="text-lg font-bold text-amber-400">
                {winners[0].score.toLocaleString("id-ID")} Poin
              </strong>
            </div>
          </>
        ) : (
          <>
            <h1
              id="winner-title"
              className="font-['Space_Grotesk',sans-serif] font-bold text-2xl sm:text-3xl leading-tight tracking-tight"
            >
              Belum Ada Pemenang
            </h1>
            <p
              className={`text-sm font-medium ${
                isDark ? "text-zinc-300" : "text-slate-600"
              }`}
            >
              Seluruh pemain menyelesaikan pertandingan dengan skor 0 poin.
            </p>
          </>
        )}

        {selfStanding && (
          <div
            aria-label="Hasil akhir kamu"
            className={`p-5 rounded-2xl flex flex-col gap-3 ${subSurface}`}
          >
            <span
              className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider ${
                isDark ? "text-indigo-300" : "text-indigo-700"
              }`}
            >
              Pencapaian Kamu
            </span>
            <div className="flex items-center gap-6">
              <div>
                <span
                  className={`block text-xs font-semibold ${
                    isDark ? "text-zinc-300" : "text-slate-600"
                  }`}
                >
                  Peringkat Akhir
                </span>
                <strong className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tabular-nums text-indigo-400">
                  #{selfStanding.rank}
                </strong>
              </div>
              <div
                aria-hidden="true"
                className={`w-0.5 h-10 ${
                  isDark ? "bg-[#3b4068]" : "bg-slate-300"
                }`}
              />
              <div>
                <span
                  className={`block text-xs font-semibold ${
                    isDark ? "text-zinc-300" : "text-slate-600"
                  }`}
                >
                  Total Skor
                </span>
                <strong className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tabular-nums text-emerald-400">
                  {selfStanding.score.toLocaleString("id-ID")}
                </strong>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleBackToLanding}
          className={`min-h-[54px] px-5 py-3 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2.5 border-2 border-b-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${
            isDark
              ? "bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-300 shadow-[0_10px_30px_rgba(79,70,229,0.5)]"
              : "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-800 shadow-sm"
          }`}
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
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Kembali ke Halaman Utama</span>
        </button>
      </section>

      {/* Kolom Kanan: Klasemen Akhir Lengkap */}
      <section
        aria-labelledby="final-board-heading"
        className={`lg:col-span-6 rounded-3xl p-6 sm:p-8 flex flex-col gap-5 relative overflow-hidden ${boardCardSurface}`}
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
              HASIL AKHIR
            </span>
            <h2
              id="final-board-heading"
              className="font-['Space_Grotesk',sans-serif] text-xl sm:text-2xl font-bold tracking-tight mt-0.5"
            >
              Peringkat Seluruh Pemain
            </h2>
          </div>

          <span
            className={`px-3.5 py-1.5 rounded-xl font-['JetBrains_Mono',monospace] text-xs font-bold ${subSurface}`}
          >
            {leaderboard.length} Pemain
          </span>
        </div>

        <ol
          aria-label="Daftar peringkat akhir"
          className="flex flex-col gap-3"
        >
          {leaderboard.map((entry) => {
            const isWinner = entry.rank === 1 && entry.score > 0;
            const isSelf = entry.playerId === player?.id;

            return (
              <li
                key={entry.playerId}
                className={`p-4 rounded-2xl border-2 border-b-4 flex items-center gap-3.5 transition-transform duration-200 hover:-translate-y-0.5 ${
                  isWinner
                    ? isDark
                      ? "bg-[#2c2214] border-amber-400 text-white shadow-[0_0_24px_rgba(245,158,11,0.2)]"
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
                    isWinner
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
                    {isWinner && (
                      <span
                        className={`px-2 py-0.5 rounded-md font-['JetBrains_Mono',monospace] text-[10px] font-bold border ${
                          isDark
                            ? "bg-amber-500 text-zinc-950 border-amber-200"
                            : "bg-amber-500 text-white border-amber-600"
                        }`}
                      >
                        JUARA 1
                      </span>
                    )}
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

                <div className="font-['JetBrains_Mono',monospace] tabular-nums">
                  <strong className="text-base sm:text-lg font-bold">
                    {entry.score.toLocaleString("id-ID")} Poin
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
