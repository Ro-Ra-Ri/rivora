import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BlobAvatar from "../components/BlobAvatar";
import {
  IconAlert,
  IconCheck,
  IconCopy,
  IconCrown,
  IconLogout,
  IconPlay,
  IconUsers,
} from "../components/Icons";
import Mascot from "../components/Mascot";
import { useTheme } from "../context/ThemeContext";
import { emitLeaveRoom, emitStartGame } from "../socket";
import { leaveAndReset } from "../store/gameSlice";
import { colorFor, getSkin } from "../theme/skin";
import {
  playClick,
  playLobbyChime,
  playQuestionStart,
  playSelectChip,
} from "../utils/soundEffects";

export default function LobbyPage() {
  const { isDark } = useTheme();
  const skin = getSkin(isDark);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { room, player, config, error } = useSelector((state) => state.game);
  const [copied, setCopied] = useState(false);

  const playerCount = room?.players?.length || 0;
  const prevCountRef = useRef(playerCount);

  useEffect(() => {
    if (playerCount > prevCountRef.current) {
      playSelectChip();
    }
    prevCountRef.current = playerCount;
  }, [playerCount]);

  if (!room) {
    return null;
  }

  const players = room.players || [];
  const minPlayers = room.minPlayers ?? config.minPlayers ?? 4;
  const maxPlayers = room.maxPlayers ?? config.maxPlayers ?? 10;
  const isHost = Boolean(player && (player.isHost || player.id === room.hostId));
  const canStart = isHost && players.length >= minPlayers;
  const neededCount = Math.max(minPlayers - players.length, 0);
  const readinessPercent = Math.min(
    Math.round((players.length / minPlayers) * 100),
    100
  );

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      playLobbyChime();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleStartGame() {
    if (!canStart) return;
    playQuestionStart();
    emitStartGame({
      code: room.code,
      playerId: player.id,
    });
  }

  function handleLeaveRoom() {
    playClick();
    if (room?.code && player?.id) {
      emitLeaveRoom({ code: room.code, playerId: player.id });
    }
    dispatch(leaveAndReset());
    navigate("/");
  }

  const emptyMinSlots = Array.from({ length: neededCount }, (_, idx) => idx);

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* KOLOM KIRI: Room Code Ticket (High-Contrast Lime Plop)    */}
        {/* ======================================================== */}
        <section
          aria-labelledby="lobby-code-title"
          className="lg:col-span-5 rounded-[40px] p-6 sm:p-8 flex flex-col gap-5 relative overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: skin.lime,
            color: skin.navy,
            border: "3px solid #0E1236",
            boxShadow: skin.limeCardShadow,
          }}
        >
          {/* Character Face at top */}
          <div className="flex flex-col items-center text-center">
            <div className={players.length >= minPlayers ? "animate-float-slow" : ""}>
              <Mascot
                variant="face"
                size={110}
                mood={players.length >= minPlayers ? "happy" : "idle"}
              />
            </div>
            <span
              id="lobby-code-title"
              className="text-xs font-display font-bold uppercase tracking-widest text-[#0E1236] mt-1"
            >
              Kode Akses Room
            </span>
          </div>

          {/* 5-Digit Chunky Code Tiles (Bold 3D Tiles) */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            {room.code.split("").map((ch, idx) => (
              <span
                key={idx}
                className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl sm:text-3xl transition-transform duration-150 hover:scale-110 hover:-rotate-3 active:scale-95 cursor-default select-none"
                style={{
                  backgroundColor: skin.limeInput,
                  color: skin.navy,
                  border: "2.5px solid #0E1236",
                  boxShadow: "0 4px 0 #0E1236",
                }}
              >
                {ch}
              </span>
            ))}
          </div>

          {/* Copy Button (High Contrast 3D Tactile) */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="w-full py-3.5 px-5 rounded-full font-display font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
            style={{
              backgroundColor: skin.navy,
              color: "#FFFFFF",
              border: "2.5px solid #0E1236",
              boxShadow: "0 5px 0 #06081B",
            }}
          >
            {copied ? (
              <>
                <IconCheck size={18} />
                <span>Kode Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <IconCopy size={18} />
                <span>Salin Kode Akses</span>
              </>
            )}
          </button>

          <p className="text-center text-xs font-sans font-bold opacity-80 text-[#0E1236]">
            Bagikan kode 5 karakter di atas agar teman-temanmu dapat bergabung!
          </p>

          {/* Fallback Notice Card if Gemini quota hit */}
          {room.usedFallback && (
            <div className="p-4 rounded-3xl bg-white text-[#0E1236] border-3 border-[#0E1236] shadow-[0_4px_0_#0E1236] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#FF7A66] text-white border-2 border-[#0E1236]">
                <IconAlert size={18} />
              </div>
              <div className="flex-1 text-xs">
                <p className="font-display font-bold text-xs uppercase tracking-wider">
                  Soal Cadangan: {room.topic || "JavaScript"}
                </p>
                <p className="mt-0.5 font-sans font-bold opacity-80 leading-relaxed">
                  Layanan AI sedang sibuk atau mencapai kuota. Permainan otomatis
                  memakai paket soal cadangan lokal berkualitas tinggi.
                </p>
              </div>
            </div>
          )}

          {/* Quiz Metadata Pills (Solid Borders) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div
              className="p-3.5 rounded-2xl flex flex-col border-2 border-[#0E1236]"
              style={{
                backgroundColor: skin.limeInput,
                boxShadow: "0 2.5px 0 #0E1236",
              }}
            >
              <span className="text-[10px] font-display font-bold uppercase opacity-75">
                Topik Kuis
              </span>
              <span className="font-display font-bold text-sm truncate mt-0.5">
                {room.topic || "Kuis Bebas"}
              </span>
            </div>

            <div
              className="p-3.5 rounded-2xl flex flex-col border-2 border-[#0E1236]"
              style={{
                backgroundColor: skin.limeInput,
                boxShadow: "0 2.5px 0 #0E1236",
              }}
            >
              <span className="text-[10px] font-display font-bold uppercase opacity-75">
                Kesulitan
              </span>
              <span className="font-display font-bold text-sm mt-0.5">
                {room.difficulty || "Sedang"}
              </span>
            </div>

            <div
              className="p-3.5 rounded-2xl flex flex-col border-2 border-[#0E1236]"
              style={{
                backgroundColor: skin.limeInput,
                boxShadow: "0 2.5px 0 #0E1236",
              }}
            >
              <span className="text-[10px] font-display font-bold uppercase opacity-75">
                Jumlah Soal
              </span>
              <span className="font-display font-bold text-sm mt-0.5">
                {room.questionCount || 5} Soal
              </span>
            </div>

            <div
              className="p-3.5 rounded-2xl flex flex-col border-2 border-[#0E1236]"
              style={{
                backgroundColor: skin.limeInput,
                boxShadow: "0 2.5px 0 #0E1236",
              }}
            >
              <span className="text-[10px] font-display font-bold uppercase opacity-75">
                Durasi Jawab
              </span>
              <span className="font-display font-bold text-sm mt-0.5">
                20 Detik / Soal
              </span>
            </div>
          </div>

          {/* Exit Button */}
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="w-full py-3 px-4 rounded-full font-display font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-[#0E1236]/10"
            style={{
              border: "2px solid #0E1236",
              color: skin.navy,
              boxShadow: "0 2px 0 #0E1236",
            }}
          >
            <IconLogout size={16} />
            <span>Keluar dari Room</span>
          </button>
        </section>

        {/* ======================================================== */}
        {/* KOLOM KANAN: Lobby Roster Card (Prominent High Contrast)  */}
        {/* ======================================================== */}
        <section
          aria-labelledby="lobby-roster-title"
          className="lg:col-span-7 rounded-[40px] p-6 sm:p-9 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: skin.cardBg,
            borderColor: skin.cardBorder,
            borderWidth: "3px",
            boxShadow: skin.cardShadow,
            color: skin.cardText,
            minHeight: "580px",
          }}
        >
          {/* Decorative Corner circles */}
          <div
            aria-hidden="true"
            className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-80 border-2 border-[#0E1236]/30"
            style={{ backgroundColor: skin.lime }}
          />
          <div
            aria-hidden="true"
            className="absolute -top-6 right-20 w-12 h-12 rounded-full pointer-events-none opacity-70 border-2 border-[#0E1236]/30"
            style={{ backgroundColor: skin.coral }}
          />

          <div className="relative z-10 flex flex-col gap-6">
            {/* Header: Title + Player Count Pill */}
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 pb-4"
              style={{ borderColor: skin.cardBorder }}
            >
              <div>
                <h2
                  id="lobby-roster-title"
                  className="text-2xl font-display font-bold tracking-tight"
                >
                  Lobby Pemain
                </h2>
                <p className="text-xs font-sans font-bold opacity-80 mt-0.5">
                  Dibutuhkan minimal {minPlayers} pemain (maks. {maxPlayers} pemain)
                  untuk memulai kuis.
                </p>
              </div>

              <div
                className="self-start sm:self-auto px-4 py-1.5 rounded-full font-display font-bold text-xs flex items-center gap-1.5 border-2 border-[#0E1236] shadow-[0_3px_0_#0E1236]"
                style={{
                  backgroundColor:
                    players.length >= minPlayers ? skin.lime : skin.periwinkle,
                  color: skin.navy,
                }}
              >
                <IconUsers size={14} />
                <span>
                  {players.length} / {maxPlayers}
                </span>
              </div>
            </div>

            {/* Error Message if any */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-[#FF7A66] text-white font-display font-bold text-xs flex items-center gap-2 border-2 border-[#0E1236] shadow-[0_3px_0_#0E1236]">
                <IconAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Readiness Bar (High Contrast) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-display font-bold">
                <span className="opacity-80">Kesiapan Arena</span>
                <span
                  style={{
                    color: players.length >= minPlayers ? (isDark ? skin.lime : "#2E7D32") : skin.coral,
                  }}
                >
                  {players.length >= minPlayers
                    ? "✓ Arena Siap Tempur!"
                    : `Kurang ${neededCount} pemain lagi`}
                </span>
              </div>
              <div
                className="w-full h-4 rounded-full overflow-hidden border-2 border-[#0E1236]"
                style={{
                  backgroundColor: isDark ? "#0A0D28" : "#E8DFC5",
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${readinessPercent}%`,
                    backgroundColor:
                      players.length >= minPlayers ? skin.lime : skin.coral,
                  }}
                />
              </div>
            </div>

            {/* Player Cards Grid (Crisp 3D Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {players.map((item, index) => {
                const isYou = item.id === player?.id;
                const isItemHost = item.isHost || item.id === room.hostId;
                const avatarColor = colorFor(item.id || item.name || index);

                return (
                  <div
                    key={item.id || index}
                    className="p-3.5 rounded-3xl flex items-center gap-3 transition-transform hover:scale-[1.02]"
                    style={{
                      backgroundColor: isDark
                        ? isYou
                          ? "#1F255A"
                          : "#141842"
                        : isYou
                        ? "#F3FBD4"
                        : "#FFFFFF",
                      border: `2.5px solid ${skin.cardBorder}`,
                      boxShadow: isYou
                        ? `0 4px 0 ${skin.cardBorder}`
                        : `0 3px 0 ${skin.cardBorder}`,
                    }}
                  >
                    <BlobAvatar
                      name={item.name}
                      color={avatarColor}
                      size={44}
                      isHost={isItemHost}
                      isYou={isYou}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-bold text-sm truncate">
                          {item.name}
                        </span>
                        {isItemHost && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold flex items-center gap-1 border border-[#0E1236]"
                            style={{
                              backgroundColor: skin.lime,
                              color: skin.navy,
                            }}
                          >
                            <IconCrown size={10} />
                            HOST
                          </span>
                        )}
                        {isYou && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold border border-[#0E1236]"
                            style={{
                              backgroundColor: skin.periwinkle,
                              color: skin.navy,
                            }}
                          >
                            KAMU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-sans font-semibold opacity-70">
                        Pemain #{index + 1} • Terhubung
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Waiting Empty Slots */}
              {emptyMinSlots.map((slotIdx) => (
                <div
                  key={`empty-${slotIdx}`}
                  className="p-3.5 rounded-3xl flex items-center gap-3 border-2 border-dashed opacity-80"
                  style={{ borderColor: skin.cardBorder }}
                >
                  <BlobAvatar
                    name="?"
                    color="#A0AEC0"
                    size={44}
                    sleepy={true}
                  />
                  <div className="flex flex-col">
                    <span className="font-display font-bold text-xs opacity-90">
                      Menunggu pemain...
                    </span>
                    <span className="text-[11px] font-sans font-semibold opacity-70">
                      Slot minimal {minPlayers} pemain
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action / CTA Bottom Bar */}
          <div
            className="mt-8 pt-4 border-t-2"
            style={{ borderColor: skin.cardBorder }}
          >
            {isHost ? (
              canStart ? (
                <button
                  type="button"
                  onClick={handleStartGame}
                  className="animate-pulse-glow w-full py-4 px-6 rounded-full font-display font-bold text-base flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
                  style={{
                    backgroundColor: skin.lime,
                    color: skin.navy,
                    border: "3px solid #0E1236",
                    boxShadow: "0 6px 0 #0E1236",
                  }}
                >
                  <IconPlay size={20} />
                  <span>Mulai Pertandingan Sekarang!</span>
                </button>
              ) : (
                <div
                  className="w-full py-3.5 px-6 rounded-full font-display font-bold text-sm text-center border-2 opacity-75 cursor-not-allowed"
                  style={{
                    backgroundColor: isDark ? "#0A0D28" : "#EAE0C4",
                    borderColor: skin.cardBorder,
                  }}
                >
                  Menunggu minimal {minPlayers} pemain untuk memulai (kurang{" "}
                  {neededCount} pemain lagi)
                </div>
              )
            ) : (
              <div
                className="w-full py-3.5 px-6 rounded-full font-display font-bold text-xs text-center flex items-center justify-center gap-2 border-2"
                style={{
                  backgroundColor: isDark ? "#0A0D28" : "#EAE0C4",
                  borderColor: skin.cardBorder,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full animate-ping bg-[#8B9CFF]" />
                <span>
                  Menunggu Host memulai pertandingan... ({players.length} /{" "}
                  {minPlayers} pemain siap)
                </span>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
