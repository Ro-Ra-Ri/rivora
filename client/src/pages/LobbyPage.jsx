import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { emitLeaveRoom, emitStartGame } from "../socket";
import { leaveAndReset } from "../store/gameSlice";
import {
  playClick,
  playLobbyChime,
  playQuestionStart,
  playSelectChip,
} from "../utils/soundEffects";

export default function LobbyPage() {
  const { isDark } = useTheme();
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

  const primaryCardSurface = isDark
    ? "bg-[#161829] border-2 border-indigo-500/60 shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_32px_rgba(99,102,241,0.18)]"
    : "bg-white border-2 border-indigo-300 shadow-[0_18px_45px_rgba(30,41,59,0.12)]";

  const secondaryCardSurface = isDark
    ? "bg-[#161829] border-2 border-[#3a3f66] shadow-[0_24px_60px_rgba(0,0,0,0.8)]"
    : "bg-white border-2 border-slate-300 shadow-[0_18px_45px_rgba(30,41,59,0.1)]";

  const subSurface = isDark
    ? "bg-[#20233a] border-2 border-[#3b4068]"
    : "bg-slate-50 border-2 border-slate-200";

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Kolom Kiri: Kode Room Command Ticket & Detail Kuis */}
      <section
        aria-labelledby="lobby-code-title"
        className={`lg:col-span-5 rounded-3xl p-6 sm:p-7 flex flex-col gap-5 relative overflow-hidden ${primaryCardSurface}`}
      >
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-2 bg-indigo-500"
        />

        <div>
          <div className="flex items-center justify-between pt-1">
            <span
              id="lobby-code-title"
              className={`font-['JetBrains_Mono',monospace] text-xs font-bold tracking-wider uppercase ${
                isDark ? "text-indigo-200" : "text-indigo-800"
              }`}
            >
              Kode Akses Room
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-['JetBrains_Mono',monospace] text-[10px] font-bold border-2 ${
                isDark
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                  : "bg-emerald-50 border-emerald-400 text-emerald-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AKTIF
            </span>
          </div>

          <div
            className={`mt-3 p-4 sm:px-5 rounded-2xl flex items-center justify-between gap-3 ${subSurface}`}
          >
            <div className="flex items-center gap-1.5">
              {String(room.code || "")
                .split("")
                .map((char, idx) => (
                  <span
                    key={idx}
                    className={`w-10 h-12 sm:w-11 sm:h-13 rounded-xl border-2 border-b-4 font-['JetBrains_Mono',monospace] text-xl sm:text-2xl font-bold inline-flex items-center justify-center ${
                      isDark
                        ? "bg-[#121424] border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                        : "bg-white border-indigo-400 text-indigo-700 shadow-xs"
                    }`}
                  >
                    {char}
                  </span>
                ))}
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Salin kode room"
              className={`min-h-[44px] px-4 py-2 rounded-xl border-2 border-b-4 text-xs font-bold inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 shrink-0 ${
                copied
                  ? isDark
                    ? "bg-emerald-600 border-emerald-300 text-white"
                    : "bg-emerald-600 border-emerald-800 text-white"
                  : isDark
                    ? "bg-indigo-600 border-indigo-300 text-white hover:bg-indigo-500 shadow-[0_6px_18px_rgba(79,70,229,0.45)]"
                    : "bg-indigo-600 border-indigo-800 text-white hover:bg-indigo-700"
              }`}
            >
              {copied ? (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>

          <p
            className={`mt-2.5 text-xs sm:text-sm font-medium ${
              isDark ? "text-zinc-300" : "text-slate-600"
            }`}
          >
            Bagikan kode 5 karakter di atas agar teman-temanmu dapat bergabung
            ke sesi ini.
          </p>
        </div>

        {/* Badge Soal Cadangan jika AI Gagal / Limit */}
        {room.usedFallback && (
          <div
            role="status"
            className={`p-4 rounded-2xl border-2 flex flex-col gap-1.5 ${
              isDark
                ? "bg-amber-950/60 border-amber-400 text-amber-100"
                : "bg-amber-50 border-amber-400 text-amber-950"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-400">
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>
                Soal cadangan: {room.fallbackTopic || "JavaScript dasar"}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium">
              Layanan AI sedang sibuk atau mencapai batas kuota. Permainan
              otomatis memakai paket soal cadangan lokal.
              {room.requestedQuestionCount > room.totalQuestions
                ? ` (${room.totalQuestions} soal tersedia dari ${room.requestedQuestionCount} yang diminta).`
                : ""}
            </p>
          </div>
        )}

        {/* 4 Kartu Spesifikasi Room yang Mencolok */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`p-3.5 rounded-2xl border-2 border-b-4 flex flex-col gap-1 transition-transform duration-200 hover:-translate-y-0.5 ${
              isDark
                ? "bg-[#1d2038] border-indigo-400/70 text-white"
                : "bg-indigo-50/75 border-indigo-300 text-slate-900"
            }`}
          >
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isDark ? "text-indigo-200" : "text-indigo-700"
              }`}
            >
              Topik Kuis
            </span>
            <strong className="text-sm sm:text-base font-bold truncate">
              {room.topic}
            </strong>
          </div>

          <div
            className={`p-3.5 rounded-2xl border-2 border-b-4 flex flex-col gap-1 transition-transform duration-200 hover:-translate-y-0.5 ${
              isDark
                ? "bg-[#2a2116] border-amber-400/70 text-white"
                : "bg-amber-50/75 border-amber-300 text-slate-900"
            }`}
          >
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isDark ? "text-amber-200" : "text-amber-800"
              }`}
            >
              Tingkat Kesulitan
            </span>
            <strong className="text-sm sm:text-base font-bold text-amber-400">
              {room.difficulty}
            </strong>
          </div>

          <div
            className={`p-3.5 rounded-2xl border-2 border-b-4 flex flex-col gap-1 transition-transform duration-200 hover:-translate-y-0.5 ${
              isDark
                ? "bg-[#172638] border-sky-400/70 text-white"
                : "bg-sky-50/75 border-sky-300 text-slate-900"
            }`}
          >
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isDark ? "text-sky-200" : "text-sky-800"
              }`}
            >
              Jumlah Soal
            </span>
            <strong className="text-sm sm:text-base font-bold text-sky-400">
              {room.totalQuestions} Soal
            </strong>
          </div>

          <div
            className={`p-3.5 rounded-2xl border-2 border-b-4 flex flex-col gap-1 transition-transform duration-200 hover:-translate-y-0.5 ${
              isDark
                ? "bg-[#142925] border-emerald-400/70 text-white"
                : "bg-emerald-50/75 border-emerald-300 text-slate-900"
            }`}
          >
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isDark ? "text-emerald-200" : "text-emerald-800"
              }`}
            >
              Durasi Jawab
            </span>
            <strong className="text-sm sm:text-base font-bold text-emerald-400">
              {Math.round((config.questionTimeMs || 20000) / 1000)} Detik / Soal
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLeaveRoom}
          className={`min-h-[46px] px-4 py-2.5 rounded-xl border-2 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isDark
              ? "bg-[#20233a] border-[#3d426b] text-zinc-200 hover:bg-rose-950/60 hover:border-rose-400 hover:text-rose-200"
              : "bg-slate-100 border-slate-300 text-slate-800 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700"
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Keluar dari Room</span>
        </button>
      </section>

      {/* Kolom Kanan: Daftar Pemain Realtime & Kontrol Mulai */}
      <section
        aria-labelledby="roster-heading"
        className={`lg:col-span-7 rounded-3xl p-6 sm:p-7 flex flex-col gap-5 relative overflow-hidden ${secondaryCardSurface}`}
      >
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-2 bg-emerald-500"
        />

        <div className="flex items-start justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2.5">
              <h1
                id="roster-heading"
                className="font-['Space_Grotesk',sans-serif] text-xl sm:text-2xl font-bold tracking-tight"
              >
                Lobby Pemain
              </h1>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
            <p
              className={`text-xs sm:text-sm font-medium mt-1 ${
                isDark ? "text-zinc-300" : "text-slate-600"
              }`}
            >
              Dibutuhkan minimal {minPlayers} pemain (maks. {maxPlayers} pemain)
              untuk memulai kuis.
            </p>
          </div>

          <div
            aria-live="polite"
            className={`px-4 py-2 rounded-xl border-2 font-['JetBrains_Mono',monospace] font-bold tabular-nums inline-flex items-baseline gap-1 shrink-0 ${
              isDark
                ? "bg-[#20233a] border-indigo-400/60 text-white"
                : "bg-indigo-50 border-indigo-300 text-indigo-950"
            }`}
          >
            <span className="text-lg text-indigo-400">{players.length}</span>
            <span className="opacity-50">/</span>
            <span className="text-xs opacity-90">{maxPlayers}</span>
          </div>
        </div>

        {/* Readiness Progress Bar */}
        <div className={`p-4 rounded-2xl flex flex-col gap-2 ${subSurface}`}>
          <div className="flex items-center justify-between text-xs font-['JetBrains_Mono',monospace] font-bold">
            <span className={isDark ? "text-zinc-200" : "text-slate-800"}>
              KUOTA MULAI PERTANDINGAN
            </span>
            <span
              className={
                players.length >= minPlayers
                  ? "text-emerald-400"
                  : "text-indigo-400"
              }
            >
              {players.length} / {minPlayers} MINIMAL PEMAIN
            </span>
          </div>
          <div
            className={`w-full h-2.5 rounded-full overflow-hidden border ${
              isDark
                ? "bg-[#0d0e1a] border-[#343859]"
                : "bg-slate-200 border-slate-300"
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                players.length >= minPlayers
                  ? "bg-emerald-500"
                  : "bg-indigo-500"
              }`}
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className={`p-3.5 rounded-xl border-2 text-xs sm:text-sm font-bold ${
              isDark
                ? "bg-rose-950/70 border-rose-500 text-rose-100"
                : "bg-rose-50 border-rose-400 text-rose-900"
            }`}
          >
            {error.message}
          </div>
        )}

        <ul
          aria-label="Daftar pemain di lobby"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
        >
          {players.map((item, idx) => {
            const isSelf = player?.id === item.id;
            const itemIsHost = item.isHost || item.id === room.hostId;

            return (
              <li
                key={item.id}
                className={`p-4 rounded-2xl border-2 border-b-4 flex items-center gap-3.5 transition-all duration-200 hover:-translate-y-0.5 ${
                  isSelf
                    ? isDark
                      ? "bg-indigo-600/25 border-indigo-400 shadow-[0_0_24px_rgba(99,102,241,0.25)]"
                      : "bg-indigo-50 border-indigo-500 shadow-xs"
                    : subSurface
                }`}
              >
                <div
                  aria-hidden="true"
                  className={`w-11 h-11 rounded-xl font-['Space_Grotesk',sans-serif] font-bold text-sm inline-flex items-center justify-center shrink-0 border-2 ${
                    isSelf
                      ? "bg-indigo-600 border-indigo-300 text-white"
                      : isDark
                        ? "bg-[#121424] border-[#3d426b] text-white"
                        : "bg-slate-900 border-slate-700 text-white"
                  }`}
                >
                  {item.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="font-bold text-sm sm:text-base truncate">
                      {item.name}
                    </span>
                    {isSelf && (
                      <span
                        className={`px-2 py-0.5 rounded-md font-['JetBrains_Mono',monospace] text-[10px] font-bold border ${
                          isDark
                            ? "bg-indigo-500/35 text-white border-indigo-300"
                            : "bg-indigo-600 text-white border-indigo-700"
                        }`}
                      >
                        KAMU
                      </span>
                    )}
                    {itemIsHost && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-['JetBrains_Mono',monospace] text-[10px] font-bold border ${
                          isDark
                            ? "bg-amber-500/30 text-amber-200 border-amber-400"
                            : "bg-amber-100 text-amber-900 border-amber-400"
                        }`}
                      >
                        HOST
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold inline-flex items-center gap-1.5 ${
                      isDark ? "text-zinc-300" : "text-slate-600"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Pemain #{idx + 1} · Siap
                  </span>
                </div>
              </li>
            );
          })}

          {emptyMinSlots.map((slotIndex) => (
            <li
              key={`empty-${slotIndex}`}
              aria-hidden="true"
              className={`p-4 rounded-2xl border-2 border-dashed flex items-center gap-3.5 ${
                isDark
                  ? "bg-[#131525] border-[#3a3f66] text-zinc-300"
                  : "bg-slate-50 border-slate-300 text-slate-600"
              }`}
            >
              <div
                className={`relative w-11 h-11 rounded-xl border-2 border-dashed font-['Space_Grotesk',sans-serif] font-bold text-xs inline-flex items-center justify-center shrink-0 ${
                  isDark
                    ? "border-indigo-400/50 text-indigo-300"
                    : "border-indigo-300 text-indigo-600"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="font-bold text-xs sm:text-sm truncate">
                  Menunggu pemain...
                </span>
                <span className="text-[11px] font-medium opacity-80">
                  Slot minimal #{players.length + slotIndex + 1}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div
          className={`pt-4 border-t-2 ${
            isDark ? "border-[#323659]" : "border-slate-200"
          }`}
        >
          {isHost ? (
            <div className="flex flex-col gap-3">
              <div>
                {canStart ? (
                  <span className="text-xs sm:text-sm font-bold text-emerald-400 inline-flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    Jumlah pemain sudah mencukupi ({players.length} pemain).
                    Siap memulai kuis!
                  </span>
                ) : (
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      isDark ? "text-zinc-300" : "text-slate-600"
                    }`}
                  >
                    Menunggu minimal {minPlayers} pemain untuk memulai (kurang{" "}
                    {neededCount} pemain lagi).
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={!canStart}
                onClick={handleStartGame}
                className={`min-h-[54px] px-5 py-3 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2.5 border-2 border-b-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
                  isDark
                    ? "bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-300 shadow-[0_10px_30px_rgba(16,185,129,0.4)]"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-800 shadow-sm"
                }`}
              >
                <span>Mulai Pertandingan Sekarang</span>
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
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
            </div>
          ) : (
            <div
              role="status"
              aria-live="polite"
              className={`p-4 rounded-2xl flex items-center gap-3.5 ${subSurface}`}
            >
              <span
                aria-hidden="true"
                className="w-5 h-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin shrink-0"
              />
              <div className="text-xs sm:text-sm">
                <strong className="block font-bold">
                  Menunggu Host memulai pertandingan...
                </strong>
                <span
                  className={`font-medium ${
                    isDark ? "text-zinc-300" : "text-slate-600"
                  }`}
                >
                  {players.length < minPlayers
                    ? `Saat ini baru bergabung ${players.length} dari minimal ${minPlayers} pemain.`
                    : "Jumlah pemain sudah memenuhi syarat. Soal akan segera tampil serentak."}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
