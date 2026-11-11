import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { emitLeaveRoom } from "../socket";
import { leaveAndReset } from "../store/gameSlice";
import { playClick } from "../utils/soundEffects";

const PHASE_LABELS = {
  lobby: "MENUNGGU PEMAIN",
  playing: "RONDE AKTIF",
  reveal: "EVALUASI SKOR",
  result: "HASIL AKHIR",
};

export default function Navbar() {
  const { isDark, setTheme, soundEnabled, toggleSound } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { room, player, phase } = useSelector((state) => state.game);

  function handleBrandClick() {
    playClick();
    if (room && player) {
      emitLeaveRoom({ code: room.code, playerId: player.id });
    }
    dispatch(leaveAndReset());
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-30 pt-3.5 px-4 sm:px-6">
      <div
        className={`max-w-6xl mx-auto px-4 sm:px-5 py-3 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-3 ${
          isDark
            ? "bg-[#161726]/95 border-[#36395a] shadow-[0_16px_40px_rgba(0,0,0,0.7),0_0_24px_rgba(99,102,241,0.12)]"
            : "bg-white/95 border-indigo-200 shadow-[0_12px_30px_rgba(30,41,59,0.08)]"
        }`}
      >
        {/* Brand Identity */}
        <button
          type="button"
          onClick={handleBrandClick}
          title="Kembali ke halaman utama Rivora"
          className="group inline-flex items-center gap-3 py-1 pr-2 rounded-xl text-left transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
        >
          <span
            aria-hidden="true"
            className={`relative w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0 border-2 border-b-4 transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3 ${
              isDark
                ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                : "bg-indigo-600 border-indigo-800 text-white shadow-sm"
            }`}
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>

          <span className="flex items-center gap-2.5">
            <span
              className={`font-['Space_Grotesk',sans-serif] font-bold text-lg sm:text-xl tracking-tight ${
                isDark ? "text-white" : "text-zinc-900"
              }`}
            >
              Rivora
            </span>
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-['JetBrains_Mono',monospace] text-[10px] font-bold tracking-wider uppercase border ${
                isDark
                  ? "bg-indigo-500/20 border-indigo-400/50 text-indigo-200"
                  : "bg-indigo-50 border-indigo-300 text-indigo-700"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Quiz Battle
            </span>
          </span>
        </button>

        {/* Right Controls: Phase Status, Active Room Pill, Player Identity, Sound Toggle, and Theme Switcher */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
          {phase !== "landing" && PHASE_LABELS[phase] && (
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-['JetBrains_Mono',monospace] text-[10px] font-bold tracking-wider uppercase ${
                isDark
                  ? "bg-[#202238] border-[#3d4166] text-zinc-200"
                  : "bg-slate-100 border-slate-300 text-slate-800"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{PHASE_LABELS[phase]}</span>
            </div>
          )}

          {room?.code && phase !== "landing" && (
            <div
              aria-label={`Kode room ${room.code}`}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                isDark
                  ? "bg-[#202238] border-indigo-500/50 text-zinc-100"
                  : "bg-indigo-50 border-indigo-300 text-indigo-950"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Room
              </span>
              <span className="font-['JetBrains_Mono',monospace] font-bold tracking-widest text-indigo-400">
                {room.code}
              </span>
            </div>
          )}

          {player?.name && phase !== "landing" && (
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isDark
                  ? "bg-[#202238] border-[#3d4166] text-white"
                  : "bg-slate-100 border-slate-300 text-slate-900"
              }`}
            >
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-emerald-400"
              />
              <span className="max-w-[96px] truncate">{player.name}</span>
              {player.isHost && (
                <span
                  className={`font-['JetBrains_Mono',monospace] text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    isDark
                      ? "bg-amber-500/25 text-amber-300 border-amber-400/50"
                      : "bg-amber-100 text-amber-900 border-amber-300"
                  }`}
                >
                  HOST
                </span>
              )}
            </div>
          )}

          {/* Tombol Efek Suara (ON / OFF) */}
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            title={
              soundEnabled
                ? "Efek suara aktif (klik untuk bisukan)"
                : "Efek suara mati (klik untuk aktifkan)"
            }
            className={`min-h-[38px] px-3 py-1.5 rounded-xl border-2 text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              soundEnabled
                ? isDark
                  ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/30"
                  : "bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100"
                : isDark
                  ? "bg-[#1e2034] border-[#36395a] text-zinc-400 hover:text-zinc-200"
                  : "bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-800"
            }`}
          >
            {soundEnabled ? (
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
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            ) : (
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
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
            <span className="hidden sm:inline">
              {soundEnabled ? "Suara ON" : "Suara OFF"}
            </span>
          </button>

          {/* Segmented Dark / Light Mode Switcher (React Context) */}
          <div
            role="group"
            aria-label="Pilih tema tampilan"
            className={`inline-flex items-center p-1 rounded-xl border-2 ${
              isDark
                ? "bg-[#0e0f1a] border-[#36395a]"
                : "bg-slate-100 border-slate-300"
            }`}
          >
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={!isDark}
              className={`min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                !isDark
                  ? "bg-white text-zinc-900 border border-slate-300 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={!isDark ? "text-amber-500" : ""}
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
              <span>Terang</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={isDark}
              className={`min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? "bg-indigo-600 text-white border border-indigo-400 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 border border-transparent"
              }`}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
              <span>Gelap</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
