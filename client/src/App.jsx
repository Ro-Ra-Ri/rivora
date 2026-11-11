import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useTheme } from "./context/ThemeContext";
import LandingPage from "./pages/LandingPage";
import RoomContainer from "./pages/RoomContainer";
import { initSocketListeners } from "./socket";
import { store } from "./store";

export default function App() {
  const { isDark } = useTheme();

  useEffect(() => {
    initSocketListeners(store);
  }, []);

  return (
    <BrowserRouter>
      <div
        style={{ colorScheme: isDark ? "dark" : "light" }}
        className={`relative min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] antialiased transition-colors duration-300 ${
          isDark
            ? "bg-[#09090f] text-[#f4f4f8]"
            : "bg-[#f4f5f9] text-zinc-900"
        }`}
      >
        {/* Architectural Studio Backdrop (GetLayers-inspired Grid + Dual Spotlights) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        >
          {/* Top Horizon Beam */}
          <div
            className={`absolute -top-36 left-1/2 -translate-x-1/2 w-[920px] h-[360px] rounded-full blur-[130px] transition-opacity duration-500 ${
              isDark
                ? "bg-indigo-600/20 opacity-100"
                : "bg-indigo-300/40 opacity-90"
            }`}
          />
          {/* Secondary Cyan/Violet Ambient Orb */}
          <div
            className={`absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-full blur-[140px] transition-opacity duration-500 ${
              isDark
                ? "bg-violet-600/15 opacity-90"
                : "bg-sky-200/50 opacity-80"
            }`}
          />
          <div
            className={`absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full blur-[140px] transition-opacity duration-500 ${
              isDark
                ? "bg-cyan-500/10 opacity-80"
                : "bg-violet-200/40 opacity-75"
            }`}
          />
          {/* Precision Dot Grid Matrix */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: isDark
                ? "radial-gradient(#27273a 1px, transparent 1px)"
                : "radial-gradient(#d4d4df 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              opacity: isDark ? 0.45 : 0.55,
            }}
          />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/room/:code" element={<RoomContainer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
