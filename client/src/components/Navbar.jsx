import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BlobAvatar from "./BlobAvatar";
import { IconMoon, IconSound, IconMute, IconSun } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { emitLeaveRoom } from "../socket";
import { leaveAndReset } from "../store/gameSlice";
import { colorFor } from "../theme/skin";
import { playClick } from "../utils/soundEffects";

export default function Navbar() {
  const { isDark, setTheme, soundEnabled, toggleSound } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { room, player, phase } = useSelector((state) => state.game);

  const inRoom = Boolean(room?.code) && phase !== "landing";

  function handleBrandClick() {
    playClick();
    if (room && player) {
      emitLeaveRoom({ code: room.code, playerId: player.id });
    }
    dispatch(leaveAndReset());
    navigate("/");
  }

  const pill = isDark
    ? "bg-[#141842] text-[#FFF8E7] border-[2.5px] border-[#323A7C] shadow-[0_3px_0_#080A20]"
    : "bg-[#FFFBEF] text-[#0E1236] border-[2.5px] border-[#0E1236] shadow-[0_3px_0_#0E1236]";

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 pt-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Button */}
        <button
          type="button"
          onClick={handleBrandClick}
          title="Kembali ke halaman utama"
          className={`group inline-flex items-center gap-2.5 pl-2 pr-4.5 py-1.5 rounded-full cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none select-none ${pill}`}
        >
          <span className="transition-transform duration-300 group-hover:rotate-[-8deg]">
            <BlobAvatar color="#C5F23A" size={34} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Rivora
          </span>
        </button>

        <div className="flex items-center gap-2.5">
          {inRoom && (
            <div
              aria-label={`Kode room ${room.code}`}
              className={`hidden sm:inline-flex items-center gap-2 px-4 h-11 rounded-full ${pill}`}
            >
              <span className="text-xs font-display font-bold opacity-75">Room</span>
              <span className="font-display text-lg font-bold tracking-[0.18em]">
                {room.code}
              </span>
            </div>
          )}

          {inRoom && player?.name && (
            <div
              className={`hidden md:inline-flex items-center gap-2 pl-2 pr-4 h-11 rounded-full ${pill}`}
            >
              <BlobAvatar color={colorFor(player.id)} size={28} />
              <span className="text-sm font-display font-bold max-w-[110px] truncate">
                {player.name}
              </span>
              {player.isHost && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold bg-[#FFC93C] text-[#0E1236] border border-[#0E1236]">
                  Host
                </span>
              )}
            </div>
          )}

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? "Matikan efek suara" : "Nyalakan efek suara"}
            title={soundEnabled ? "Suara nyala" : "Suara mati"}
            className={`w-11 h-11 rounded-full inline-flex items-center justify-center cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none select-none ${
              soundEnabled
                ? "bg-[#C5F23A] text-[#0E1236] border-[2.5px] border-[#0E1236] shadow-[0_3px_0_#0E1236]"
                : pill
            }`}
          >
            {soundEnabled ? <IconSound size={19} /> : <IconMute size={19} />}
          </button>

          {/* Saklar tema terang / gelap */}
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Mode gelap"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`relative w-[84px] h-11 rounded-full cursor-pointer transition-all duration-150 select-none ${pill}`}
          >
            <span className="absolute inset-0 flex items-center justify-between px-3.5">
              <IconSun size={16} className={isDark ? "text-[#6E74A8]" : "opacity-0"} />
              <IconMoon size={16} className={isDark ? "opacity-0" : "text-[#A39C82]"} />
            </span>
            <span
              className={`absolute top-1 w-8 h-8 rounded-full inline-flex items-center justify-center border-2 border-[#0E1236] transition-[left,background-color] duration-300 ease-out shadow-xs ${
                isDark
                  ? "left-[44px] bg-[#8B9CFF] text-[#0E1236]"
                  : "left-1.5 bg-[#FFC93C] text-[#0E1236]"
              }`}
            >
              {isDark ? <IconMoon size={16} /> : <IconSun size={16} />}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
