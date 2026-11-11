import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useTheme } from "./context/ThemeContext";
import LandingPage from "./pages/LandingPage";
import RoomContainer from "./pages/RoomContainer";
import { initSocketListeners } from "./socket";
import { store } from "./store";
import { getSkin } from "./theme/skin";

export default function App() {
  const { isDark } = useTheme();
  const skin = getSkin(isDark);

  useEffect(() => {
    initSocketListeners(store);
  }, []);

  // Permukaan browser (latar overscroll & scrollbar) ikut palet tema.
  useEffect(() => {
    const root = document.documentElement;
    root.style.backgroundColor = isDark ? "#0B0F2E" : "#FFF3D6";
    root.style.scrollbarColor = isDark
      ? "#3A4185 #0B0F2E"
      : "#D8C99F #FFF3D6";
  }, [isDark]);

  return (
    <BrowserRouter>
      <div
        style={{ colorScheme: isDark ? "dark" : "light" }}
        className={`relative min-h-screen flex flex-col font-['Nunito',sans-serif] antialiased transition-colors duration-300 selection:bg-[#C5F23A] selection:text-[#0E1236] ${skin.page}`}
      >
        {/* Bentuk-bentuk bulat dekoratif di tepi layar */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        >
          <div
            className={`absolute -top-40 -left-40 w-[440px] h-[440px] rounded-full bg-[#C5F23A] transition-opacity duration-500 ${
              isDark ? "opacity-[0.14]" : "opacity-90"
            }`}
          />
          <div
            className={`absolute top-24 left-[22rem] w-16 h-16 rounded-full transition-colors duration-500 hidden lg:block ${
              isDark ? "bg-[#8B9CFF] opacity-30" : "bg-[#0E1236]"
            }`}
          />
          <div
            className={`absolute top-1/3 -right-28 w-72 h-72 rounded-full bg-[#8B9CFF] transition-opacity duration-500 ${
              isDark ? "opacity-20" : "opacity-80"
            }`}
          />
          <div
            className={`absolute -bottom-24 left-1/4 w-56 h-56 rounded-full bg-[#FF7A66] transition-opacity duration-500 ${
              isDark ? "opacity-[0.12]" : "opacity-25"
            }`}
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
