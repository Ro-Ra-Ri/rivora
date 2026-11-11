import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BlobAvatar from "../components/BlobAvatar";
import {
  IconAlert,
  IconCrown,
  IconHome,
  IconUsers,
} from "../components/Icons";
import Mascot from "../components/Mascot";
import { useTheme } from "../context/ThemeContext";
import { emitLeaveRoom } from "../socket";
import { leaveAndReset } from "../store/gameSlice";
import { colorFor, getSkin } from "../theme/skin";
import { playClick, playVictoryFanfare } from "../utils/soundEffects";

export default function ResultPage() {
  const { isDark } = useTheme();
  const skin = getSkin(isDark);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { room, player, finalResult } = useSelector((state) => state.game);

  useEffect(() => {
    if (finalResult && !finalResult.endedEarly) {
      playVictoryFanfare();
    }
  }, [finalResult]);

  if (!finalResult) {
    return null;
  }

  const leaderboard = finalResult.leaderboard || [];
  const winners = finalResult.winners || [];
  const endedEarly = Boolean(finalResult.endedEarly);
  const winner = winners[0] || (!endedEarly ? leaderboard[0] : null);
  const topic = finalResult.topic || room?.topic || "Kuis";

  const selfStanding = leaderboard.find(
    (entry) => entry.playerId === player?.id
  );
  const selfRank =
    leaderboard.findIndex((entry) => entry.playerId === player?.id) + 1;

  function handleBackToLanding() {
    playClick();
    if (room?.code && player?.id) {
      emitLeaveRoom({ code: room.code, playerId: player.id });
    }
    dispatch(leaveAndReset());
    navigate("/");
  }

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* KOLOM KIRI: Sorotan Pemenang (Lime Podium High Contrast) */}
        {/* ======================================================== */}
        <section
          aria-labelledby="winner-title"
          className="animate-pop-in lg:col-span-5 rounded-[40px] p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: skin.lime,
            color: skin.navy,
            border: "3px solid #0E1236",
            boxShadow: skin.limeCardShadow,
            minHeight: "560px",
          }}
        >
          {/* Decorative Corner Bubbles */}
          <div
            aria-hidden="true"
            className="animate-float-slow absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none opacity-20 border-2 border-[#0E1236]/30"
            style={{ backgroundColor: skin.navy }}
          />

          <div>
            {/* Top Mascot Celebration */}
            <div className="flex flex-col items-center text-center">
              <div className="animate-float-slow">
                <Mascot variant="face" size={130} mood="happy" />
              </div>

              <div
                className="mt-3 px-4 py-1.5 rounded-full font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border-2 border-[#0E1236] shadow-[0_3px_0_#0E1236]"
                style={{
                  backgroundColor: skin.navy,
                  color: skin.lime,
                }}
              >
                {endedEarly ? <IconAlert size={14} /> : <IconCrown size={14} />}
                <span>{endedEarly ? "PERTANDINGAN DIHENTIKAN" : "JUARA 1 ARENA"}</span>
              </div>

              <h1
                id="winner-title"
                className="text-3xl sm:text-4xl font-display font-bold mt-2 text-[#0E1236]"
              >
                {winner?.name || (endedEarly ? "Pertandingan Diakhiri" : "Pertandingan Usai!")}
              </h1>

              <p className="text-xs sm:text-sm font-sans font-bold opacity-80 mt-1 text-[#0E1236]">
                {endedEarly
                  ? `Host mengakhiri kuis "${topic}" lebih awal. Skor hanya mencakup ronde yang sudah selesai.`
                  : `Selamat! Berhasil menaklukkan kuis "${topic}" dengan skor gemilang!`}
              </p>
            </div>

            {/* Score Highlight Box */}
            <div
              className="mt-6 p-5 rounded-3xl flex items-center justify-around text-center border-2.5 border-[#0E1236] shadow-[0_3.5px_0_#0E1236]"
              style={{ backgroundColor: skin.limeInput }}
            >
              <div>
                <span className="text-[10px] font-display font-bold uppercase opacity-75">
                  {endedEarly ? "Skor Tertinggi" : "Total Skor"}
                </span>
                <p className="text-2xl sm:text-3xl font-display font-bold mt-0.5">
                  {winner?.totalScore ?? winner?.score ?? 0}
                </p>
              </div>
              <div className="w-[1px] h-10 bg-[#0E1236]/30" />
              <div>
                <span className="text-[10px] font-display font-bold uppercase opacity-75">
                  Topik Kuis
                </span>
                <p className="text-sm font-display font-bold mt-1 truncate max-w-[120px]">
                  {topic}
                </p>
              </div>
            </div>

            {/* Your Standing Card */}
            {selfStanding && (
              <div
                className="mt-4 p-4 rounded-3xl flex items-center gap-3.5 border-2.5 border-[#0E1236] shadow-[0_3.5px_0_#0E1236]"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: skin.navy,
                }}
              >
                <BlobAvatar
                  name={selfStanding.name}
                  color={colorFor(selfStanding.name)}
                  size={42}
                  isYou={true}
                />
                <div className="flex-1 text-xs">
                  <span className="font-display font-bold text-sm block">
                    Peringkatmu: #{selfRank} dari {leaderboard.length} pemain
                  </span>
                  <span className="font-sans font-semibold opacity-75">
                    Skor akhir kamu: {selfStanding.totalScore ?? selfStanding.score ?? 0} poin
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* CTA Button: Back to Landing */}
          <button
            type="button"
            onClick={handleBackToLanding}
            className="mt-6 w-full py-4 px-6 rounded-full font-display font-bold text-base flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none border-3 border-[#0E1236] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
            style={{
              backgroundColor: skin.navy,
              color: skin.lime,
              boxShadow: "0 6px 0 #080A20",
            }}
          >
            <IconHome size={18} />
            <span>Main Kuis Baru / Kembali ke Beranda</span>
          </button>
        </section>

        {/* ======================================================== */}
        {/* KOLOM KANAN: Klasemen Akhir Semua Pemain                 */}
        {/* ======================================================== */}
        <section
          aria-labelledby="final-board-title"
          className="lg:col-span-7 rounded-[40px] p-6 sm:p-9 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: skin.cardBg,
            borderColor: skin.cardBorder,
            borderWidth: "3px",
            boxShadow: skin.cardShadow,
            color: skin.cardText,
            minHeight: "560px",
          }}
        >
          {/* Decorative Corner Circle */}
          <div
            aria-hidden="true"
            className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-80 border-2 border-[#0E1236]/30"
            style={{ backgroundColor: skin.lime }}
          />

          <div className="relative z-10 flex flex-col gap-5">
            <div
              className="flex items-center justify-between border-b-2 pb-4"
              style={{ borderColor: skin.cardBorder }}
            >
              <div>
                <h2
                  id="final-board-title"
                  className="text-2xl font-display font-bold tracking-tight"
                >
                  {endedEarly ? "Klasemen Saat Dihentikan" : "Klasemen Akhir Pertandingan"}
                </h2>
                <p className="text-xs font-sans font-bold opacity-80 mt-0.5">
                  {endedEarly
                    ? "Skor tiap pemain saat host mengakhiri pertandingan."
                    : "Hasil akhir performa seluruh pemain dalam arena."}
                </p>
              </div>

              <div
                className="px-3.5 py-1.5 rounded-full font-display font-bold text-xs flex items-center gap-1.5 border-2 border-[#0E1236] shadow-[0_3px_0_#0E1236]"
                style={{ backgroundColor: skin.periwinkle, color: skin.navy }}
              >
                <IconUsers size={14} />
                <span>{leaderboard.length} Pemain</span>
              </div>
            </div>

            {/* List of Players */}
            <div className="flex flex-col gap-3">
              {leaderboard.map((entry, idx) => {
                const rank = idx + 1;
                const isYou = entry.playerId === player?.id;
                const avatarColor = colorFor(entry.playerId || entry.name || idx);

                return (
                  <div
                    key={entry.playerId || idx}
                    className="p-4 rounded-3xl flex items-center justify-between gap-4 transition-transform hover:scale-[1.01] border-2.5"
                    style={{
                      backgroundColor: isDark
                        ? isYou
                          ? "#1F255A"
                          : "#0A0D28"
                        : isYou
                        ? "#F3FBD4"
                        : "#FFFFFF",
                      borderColor: isYou ? skin.lime : skin.cardBorder,
                      boxShadow: isYou
                        ? `0 4px 0 ${skin.cardBorder}`
                        : `0 3px 0 ${skin.cardBorder}`,
                    }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Medal */}
                      <span
                        className="w-8 h-8 rounded-2xl flex items-center justify-center font-display font-bold text-sm flex-shrink-0 border-2 border-[#0E1236]"
                        style={{
                          backgroundColor:
                            rank === 1
                              ? "#FFC93C"
                              : rank === 2
                              ? "#CBD5E1"
                              : rank === 3
                              ? "#F6AD55"
                              : isDark
                              ? "#141842"
                              : "#F4E7C5",
                          color: rank <= 3 ? skin.navy : skin.cardText,
                        }}
                      >
                        {rank === 1 ? <IconCrown size={16} /> : `#${rank}`}
                      </span>

                      <BlobAvatar
                        name={entry.name}
                        color={avatarColor}
                        size={42}
                        isYou={isYou}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-sm truncate">
                            {entry.name}
                          </span>
                          {isYou && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold border border-[#0E1236]"
                              style={{
                                backgroundColor: skin.lime,
                                color: skin.navy,
                              }}
                            >
                              KAMU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-sans font-semibold opacity-70">
                          {rank === 1
                            ? "Pemenang Utama"
                            : `Posisi #${rank} di Klasemen`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-display font-bold text-base block">
                        {entry.totalScore ?? entry.score ?? 0}
                      </span>
                      <span className="text-[10px] font-sans font-bold opacity-60">
                        Poin Total
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Note */}
          <div
            className="mt-6 pt-4 border-t-2 text-center text-xs font-sans font-bold opacity-75"
            style={{ borderColor: skin.cardBorder }}
          >
            Terima kasih telah bermain di Rivora Quiz Battle! Buat room baru untuk bermain dengan topik lain.
          </div>
        </section>
      </div>
    </main>
  );
}
