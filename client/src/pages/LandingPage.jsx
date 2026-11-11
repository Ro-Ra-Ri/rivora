import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BlobAvatar from "../components/BlobAvatar";
import {
  IconAlert,
  IconArrow,
  IconBolt,
  IconClock,
  IconSparkle,
  IconUsers,
} from "../components/Icons";
import Mascot from "../components/Mascot";
import { useTheme } from "../context/ThemeContext";
import {
  clearErrors,
  createRoomAsync,
  fetchServerConfig,
  joinRoomCheckAsync,
  setPlayerName,
} from "../store/gameSlice";
import { getSkin } from "../theme/skin";
import {
  playAiPulse,
  playClick,
  playLobbyChime,
  playSelectChip,
} from "../utils/soundEffects";

const QUICK_TOPICS = [
  "JavaScript Dasar",
  "Sejarah Indonesia",
  "Tata Surya",
  "Sepak Bola Dunia",
  "Film & Pop Culture",
];

const AI_LOADING_STEPS = [
  {
    code: "01",
    title: "Memvalidasi topik & cakupan materi",
    detail: "Memastikan materi faktual, seru, dan berbobot.",
  },
  {
    code: "02",
    title: "Meracik pertanyaan & 4 opsi seru",
    detail: "Menyusun soal pilihan ganda berkualitas tinggi.",
  },
  {
    code: "03",
    title: "Menyiapkan pembahasan instan AI",
    detail: "Kunci jawaban dan insight siap di layar evaluasi.",
  },
  {
    code: "04",
    title: "Membuka frekuensi room multiplayer",
    detail: "Menyiapkan kode unik 5 digit untuk temanmu.",
  },
];

export default function LandingPage() {
  const { isDark } = useTheme();
  const skin = getSkin(isDark);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    config,
    playerName,
    room,
    phase,
    isCreatingRoom,
    isJoiningRoom,
    topicRejection,
    error,
  } = useSelector((state) => state.game);

  const [activeTab, setActiveTab] = useState("create"); // "create" | "join"
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(
    config.defaultQuestionCount || 5
  );
  const [difficulty, setDifficulty] = useState(
    config.defaultDifficulty || "Sedang"
  );
  const [roomCode, setRoomCode] = useState("");
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  useEffect(() => {
    dispatch(fetchServerConfig());
  }, [dispatch]);

  useEffect(() => {
    if (room?.code && phase !== "landing") {
      navigate(`/room/${room.code}`);
    }
  }, [room, phase, navigate]);

  // AI loading sound pulse & step cycler
  useEffect(() => {
    if (!isCreatingRoom) return undefined;
    playAiPulse(0);
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => {
        const next = (prev + 1) % AI_LOADING_STEPS.length;
        playAiPulse(next);
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isCreatingRoom]);

  const busy = isCreatingRoom || isJoiningRoom;

  function handleSwitchTab(nextTab) {
    if (busy) return;
    playClick();
    setActiveTab(nextTab);
    dispatch(clearErrors());
  }

  function handleNameChange(e) {
    const val = e.target.value.slice(0, config.nameMaxLength || 12);
    dispatch(setPlayerName(val));
    if (error) dispatch(clearErrors());
  }

  function handleTopicChange(e) {
    setTopic(e.target.value.slice(0, config.topicMaxLength || 50));
    if (error || topicRejection) dispatch(clearErrors());
  }

  function handleSelectQuickTopic(suggested) {
    if (busy) return;
    playSelectChip();
    setTopic(suggested);
    setActiveTab("create");
    dispatch(clearErrors());
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (busy) return;
    playClick();
    setLoadingStepIdx(0);

    const action = await dispatch(
      createRoomAsync({
        name: playerName,
        topic,
        questionCount,
        difficulty,
      })
    );

    if (createRoomAsync.fulfilled.match(action)) {
      playLobbyChime();
      navigate(`/room/${action.payload.room.code}`);
    }
  }

  async function handleJoinSubmit(e) {
    e.preventDefault();
    if (busy) return;
    playClick();

    const action = await dispatch(
      joinRoomCheckAsync({
        code: roomCode,
        name: playerName,
      })
    );

    if (joinRoomCheckAsync.fulfilled.match(action)) {
      playLobbyChime();
      navigate(`/room/${action.payload.room.code}`);
    }
  }

  // Mascot dynamic mood
  let rightMascotMood = "idle";
  if (isCreatingRoom) {
    rightMascotMood = "thinking";
  } else if (topicRejection || error) {
    rightMascotMood = "shock";
  } else if (topic.trim().length > 3 || roomCode.trim().length === 5) {
    rightMascotMood = "happy";
  }

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* ======================================================== */}
        {/* KARTU KIRI: Welcome Card (Enhanced Contrast & Animated)  */}
        {/* ======================================================== */}
        <section
          aria-labelledby="hero-title"
          className="group lg:col-span-5 rounded-[40px] p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: skin.cardBg,
            borderColor: skin.cardBorder,
            borderWidth: "3px",
            boxShadow: skin.cardShadow,
            color: skin.cardText,
            minHeight: "590px",
          }}
        >
          {/* Animated Decorative Plop Circles (Floating & Breathing) */}
          <div
            aria-hidden="true"
            className="animate-float-slow absolute -top-10 -left-10 w-32 h-32 rounded-full pointer-events-none opacity-90 border-2.5 border-[#0E1236]/30"
            style={{ backgroundColor: skin.lime }}
          />
          <div
            aria-hidden="true"
            className="animate-float-reverse absolute -top-6 left-28 w-16 h-16 rounded-full pointer-events-none opacity-85 border-2.5 border-[#0E1236]/30"
            style={{ backgroundColor: isDark ? "#283070" : skin.navy }}
          />
          <div
            aria-hidden="true"
            className="animate-float-slow absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none opacity-80 border-2.5 border-[#0E1236]/30"
            style={{ backgroundColor: skin.periwinkle }}
          />

          {/* Konten Atas */}
          <div className="relative z-10 pt-7 flex flex-col gap-5">
            {/* Pill Tag dengan Sparkle Animation */}
            <div
              className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-full text-xs font-display font-bold tracking-wide border-2 border-[#0E1236] shadow-[0_3px_0_#0E1236] transition-transform hover:scale-105"
              style={{ backgroundColor: skin.lime, color: skin.navy }}
            >
              <span className="inline-block animate-spin [animation-duration:8s]">
                <IconSparkle size={14} />
              </span>
              <span>AI-POWERED MULTIPLAYER TRIVIA</span>
            </div>

            <h1
              id="hero-title"
              className="text-3xl sm:text-4xl font-display font-bold leading-tight tracking-tight drop-shadow-xs"
            >
              Ketik topik apa saja, tanding kuis seru!
            </h1>

            <p className="text-sm sm:text-base font-sans font-semibold opacity-90 leading-relaxed">
              AI merakit soal seketika dari topik bebasmu. Ajak teman-teman,
              jawab serentak dalam 20 detik, dan buktikan siapa juaranya!
            </p>

            {/* Mode Tab Switcher Buttons (High Contrast 3D Tactile Buttons) */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSwitchTab("create")}
                className={`flex-1 py-3.5 px-5 rounded-full font-display font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none hover:-translate-y-0.5 active:translate-y-1 active:shadow-none ${
                  activeTab === "create" ? "animate-pulse-glow" : ""
                }`}
                style={{
                  backgroundColor:
                    activeTab === "create"
                      ? skin.lime // Lime cerah di mode apapun agar tombol aktif SANGAT MENCOLOK!
                      : isDark
                      ? "#1A2050"
                      : "#FFFFFF",
                  color: activeTab === "create" ? "#0E1236" : skin.cardText,
                  border: "2.5px solid #0E1236",
                  boxShadow:
                    activeTab === "create"
                      ? "0 4px 0 #0E1236"
                      : "0 3px 0 #0E1236",
                }}
              >
                <span>+ Buat Room Baru</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab("join")}
                className={`flex-1 py-3.5 px-5 rounded-full font-display font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none hover:-translate-y-0.5 active:translate-y-1 active:shadow-none ${
                  activeTab === "join" ? "animate-pulse-glow" : ""
                }`}
                style={{
                  backgroundColor:
                    activeTab === "join"
                      ? skin.lime
                      : isDark
                      ? "#1A2050"
                      : "#FFFFFF",
                  color: activeTab === "join" ? "#0E1236" : skin.cardText,
                  border: "2.5px solid #0E1236",
                  boxShadow:
                    activeTab === "join"
                      ? "0 4px 0 #0E1236"
                      : "0 3px 0 #0E1236",
                }}
              >
                <span>Gabung Kode</span>
              </button>
            </div>

            {/* 3 Animated Colorful Metric Cards */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {/* Box 1: Timer */}
              <div
                className="group/stat rounded-2xl p-3 flex flex-col items-center text-center gap-1 border-2.5 border-[#0E1236] transition-all duration-200 hover:-translate-y-1 cursor-default"
                style={{
                  backgroundColor: isDark ? "#172052" : "#F4E7C5",
                  boxShadow: `0 3.5px 0 ${isDark ? "#080A20" : "#0E1236"}`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center border border-[#0E1236] transition-transform group-hover/stat:rotate-12"
                  style={{ backgroundColor: skin.lime, color: skin.navy }}
                >
                  <IconClock size={16} />
                </div>
                <span className="font-display font-bold text-sm mt-0.5">20 Detik</span>
                <span className="text-[11px] font-sans font-bold opacity-75">Per Soal</span>
              </div>

              {/* Box 2: Points */}
              <div
                className="group/stat rounded-2xl p-3 flex flex-col items-center text-center gap-1 border-2.5 border-[#0E1236] transition-all duration-200 hover:-translate-y-1 cursor-default"
                style={{
                  backgroundColor: isDark ? "#172052" : "#F4E7C5",
                  boxShadow: `0 3.5px 0 ${isDark ? "#080A20" : "#0E1236"}`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center border border-[#0E1236] transition-transform group-hover/stat:scale-110"
                  style={{ backgroundColor: "#FFC93C", color: skin.navy }}
                >
                  <IconBolt size={16} />
                </div>
                <span className="font-display font-bold text-sm mt-0.5">1000 Pts</span>
                <span className="text-[11px] font-sans font-bold opacity-75">Max Skor</span>
              </div>

              {/* Box 3: Players */}
              <div
                className="group/stat rounded-2xl p-3 flex flex-col items-center text-center gap-1 border-2.5 border-[#0E1236] transition-all duration-200 hover:-translate-y-1 cursor-default"
                style={{
                  backgroundColor: isDark ? "#172052" : "#F4E7C5",
                  boxShadow: `0 3.5px 0 ${isDark ? "#080A20" : "#0E1236"}`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center border border-[#0E1236] transition-transform group-hover/stat:rotate-[-12deg]"
                  style={{ backgroundColor: "#FF7A66", color: "#FFFFFF" }}
                >
                  <IconUsers size={16} />
                </div>
                <span className="font-display font-bold text-sm mt-0.5">4–10</span>
                <span className="text-[11px] font-sans font-bold opacity-75">Pemain</span>
              </div>
            </div>
          </div>

          {/* Peeking Mascot at the Bottom with Clean Spacing & Peek Animation */}
          <div className="relative -mb-4 -mx-4 pt-8 pb-0 flex justify-center items-end overflow-visible pointer-events-none">
            <div className="animate-mascot-peek transition-transform duration-300 group-hover:translate-y-[-8px]">
              <Mascot
                variant="peek"
                size={210}
                mood={busy ? "thinking" : "idle"}
              />
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* KARTU KANAN: Vibrant Lime Plop Card (Full Neo-Pop)       */}
        {/* ======================================================== */}
        <section
          aria-labelledby="form-card-title"
          className="lg:col-span-7 rounded-[40px] p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: skin.lime,
            color: skin.navy,
            border: "3px solid #0E1236",
            boxShadow: skin.limeCardShadow,
          }}
        >
          {/* Subtle animated bubbles */}
          <div
            aria-hidden="true"
            className="animate-float-reverse absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-20 border-2 border-[#0E1236]/30"
            style={{ backgroundColor: skin.navy }}
          />

          <div>
            {/* Top Mascot Character Face */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="animate-float-slow">
                <Mascot
                  variant="face"
                  size={140}
                  mood={rightMascotMood}
                />
              </div>
              <h2
                id="form-card-title"
                className="text-2xl sm:text-3xl font-display font-bold tracking-tight mt-1"
              >
                {isCreatingRoom
                  ? "Plop sedang meracik soal..."
                  : activeTab === "create"
                  ? "Siap tanding kuis?"
                  : "Punya kode room?"}
              </h2>
              <p className="text-xs sm:text-sm font-sans font-bold opacity-80 mt-1 max-w-md">
                {isCreatingRoom
                  ? "AI Gemini sedang menyusun paket kuis seru khusus untuk room-mu."
                  : activeTab === "create"
                  ? "Pilih topik favoritmu, tentukan ronde, dan siapkan arena bertarung!"
                  : "Masukkan 5 digit kode room yang dibagikan oleh teman host-mu."}
              </p>
            </div>

            {/* Topic Rejection Notice if any */}
            {topicRejection && (
              <div className="animate-pop-in mb-5 p-4 rounded-3xl bg-white text-[#0E1236] border-3 border-[#0E1236] shadow-[0_4px_0_#0E1236] flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#FF7A66] text-white border-2 border-[#0E1236]">
                  <IconAlert size={20} />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-display font-bold text-sm">
                    {topicRejection.reason || "Topik belum bisa digunakan"}
                  </p>
                  <p className="mt-0.5 font-sans font-bold opacity-80">
                    {topicRejection.suggestion ||
                      "Coba topik lain yang lebih spesifik atau edukatif."}
                  </p>
                </div>
              </div>
            )}

            {/* General Error Notice */}
            {error && !topicRejection && (
              <div className="animate-pop-in mb-5 p-4 rounded-3xl bg-[#FF7A66] text-white border-3 border-[#0E1236] shadow-[0_4px_0_#0E1236] font-display font-bold text-xs flex items-center gap-2">
                <IconAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* AI Synthesis Loading Stage */}
            {isCreatingRoom ? (
              <div className="py-6 flex flex-col gap-4 animate-pop-in">
                <div className="p-5 rounded-3xl bg-[#B1DD20] border-3 border-[#0E1236] shadow-[0_4px_0_#0E1236] flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-display font-bold">
                    <span>PROGRESS PERACIKAN SOAL</span>
                    <span className="px-3 py-1 rounded-full bg-[#0E1236] text-[#C5F23A] border border-[#0E1236]">
                      Step {loadingStepIdx + 1} / 4
                    </span>
                  </div>

                  {/* Step bar */}
                  <div className="w-full h-3.5 rounded-full bg-[#0E1236]/20 border-2 border-[#0E1236] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0E1236] transition-all duration-500 ease-out"
                      style={{
                        width: `${((loadingStepIdx + 1) / 4) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="pt-2">
                    <p className="font-display font-bold text-base text-[#0E1236]">
                      {AI_LOADING_STEPS[loadingStepIdx].title}
                    </p>
                    <p className="font-sans font-bold text-xs opacity-80 mt-0.5">
                      {AI_LOADING_STEPS[loadingStepIdx].detail}
                    </p>
                  </div>
                </div>

                <div className="text-center font-sans font-bold text-xs opacity-80">
                  Mohon tunggu sebentar ya, Plop sedang menyiapkan kuis terbaik!
                </div>
              </div>
            ) : activeTab === "create" ? (
              /* ================= FORM BUAT ROOM ================= */
              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                {/* Input Nama Panggilan */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 px-2">
                    <label
                      htmlFor="player-name-input"
                      className="text-xs font-display font-bold uppercase tracking-wider text-[#0E1236]"
                    >
                      Nama Panggilanmu
                    </label>
                    <span className="text-[11px] font-sans font-bold opacity-70 text-[#0E1236]">
                      {playerName.length}/{config.nameMaxLength || 12}
                    </span>
                  </div>
                  <input
                    id="player-name-input"
                    type="text"
                    value={playerName}
                    onChange={handleNameChange}
                    placeholder="Contoh: Budi, Sarah, Jagoan"
                    required
                    maxLength={config.nameMaxLength || 12}
                    className="w-full px-5 py-3.5 rounded-full font-sans font-bold text-sm transition-all outline-none"
                    style={{
                      backgroundColor: skin.limeInput,
                      color: skin.navy,
                      border: "2.5px solid #0E1236",
                      boxShadow: "0 3px 0 #0E1236",
                    }}
                  />
                </div>

                {/* Input Topik Kuis */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 px-2">
                    <label
                      htmlFor="topic-input"
                      className="text-xs font-display font-bold uppercase tracking-wider text-[#0E1236]"
                    >
                      Topik Kuis Bebas
                    </label>
                    <span className="text-[11px] font-sans font-bold opacity-70 text-[#0E1236]">
                      {topic.length}/{config.topicMaxLength || 50}
                    </span>
                  </div>
                  <input
                    id="topic-input"
                    type="text"
                    value={topic}
                    onChange={handleTopicChange}
                    placeholder="Contoh: Sejarah Anime, Sepak Bola, React JS"
                    required
                    maxLength={config.topicMaxLength || 50}
                    className="w-full px-5 py-3.5 rounded-full font-sans font-bold text-sm transition-all outline-none"
                    style={{
                      backgroundColor: skin.limeInput,
                      color: skin.navy,
                      border: "2.5px solid #0E1236",
                      boxShadow: "0 3px 0 #0E1236",
                    }}
                  />
                </div>

                {/* Quick Topic Chips (Crisp Solid Borders) */}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <span className="text-[11px] font-display font-bold opacity-80 self-center mr-0.5 text-[#0E1236]">
                    Coba:
                  </span>
                  {QUICK_TOPICS.map((suggested) => {
                    const isSelected = topic === suggested;
                    return (
                      <button
                        key={suggested}
                        type="button"
                        onClick={() => handleSelectQuickTopic(suggested)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-sans font-bold transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: isSelected ? skin.navy : skin.limeInput,
                          color: isSelected ? "#C5F23A" : skin.navy,
                          border: "2px solid #0E1236",
                          boxShadow: isSelected
                            ? "0 3px 0 #0E1236"
                            : "0 2px 0 #0E1236",
                          transform: isSelected ? "translateY(1px)" : "none",
                        }}
                      >
                        {suggested}
                      </button>
                    );
                  })}
                </div>

                {/* Question Count & Difficulty Selectors (Tactile 3D Buttons) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Jumlah Soal */}
                  <div>
                    <label className="block text-xs font-display font-bold uppercase tracking-wider mb-1.5 px-2 text-[#0E1236]">
                      Jumlah Soal
                    </label>
                    <div className="flex gap-2">
                      {[3, 5, 10].map((num) => {
                        const isSelected = questionCount === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              playSelectChip();
                              setQuestionCount(num);
                            }}
                            className="flex-1 py-2.5 rounded-full text-xs font-display font-bold transition-all cursor-pointer hover:scale-105 active:scale-95"
                            style={{
                              backgroundColor: isSelected
                                ? skin.navy
                                : skin.limeInput,
                              color: isSelected ? "#C5F23A" : skin.navy,
                              border: "2.5px solid #0E1236",
                              boxShadow: isSelected
                                ? "0 3px 0 #0E1236"
                                : "0 2px 0 #0E1236",
                              transform: isSelected ? "translateY(1px)" : "none",
                            }}
                          >
                            {num} Soal
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tingkat Kesulitan */}
                  <div>
                    <label className="block text-xs font-display font-bold uppercase tracking-wider mb-1.5 px-2 text-[#0E1236]">
                      Tingkat Kesulitan
                    </label>
                    <div className="flex gap-2">
                      {["Mudah", "Sedang", "Sulit"].map((level) => {
                        const isSelected = difficulty === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => {
                              playSelectChip();
                              setDifficulty(level);
                            }}
                            className="flex-1 py-2.5 rounded-full text-xs font-display font-bold transition-all cursor-pointer hover:scale-105 active:scale-95"
                            style={{
                              backgroundColor: isSelected
                                ? skin.navy
                                : skin.limeInput,
                              color: isSelected ? "#C5F23A" : skin.navy,
                              border: "2.5px solid #0E1236",
                              boxShadow: isSelected
                                ? "0 3px 0 #0E1236"
                                : "0 2px 0 #0E1236",
                              transform: isSelected ? "translateY(1px)" : "none",
                            }}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* CTA Button with Tactile Press & Subtle Shimmer */}
                <button
                  type="submit"
                  disabled={busy || !playerName.trim() || !topic.trim()}
                  className="relative overflow-hidden mt-3 w-full py-4 px-6 rounded-full font-display font-bold text-base flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
                  style={{
                    backgroundColor: skin.navy,
                    color: skin.lime,
                    border: "3px solid #0E1236",
                    boxShadow: "0 6px 0 #080A20",
                  }}
                >
                  <IconSparkle size={20} />
                  <span>Buat Room & Racik Kuis AI!</span>
                </button>
              </form>
            ) : (
              /* ================= FORM GABUNG ROOM ================= */
              <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
                {/* Input Nama Panggilan */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 px-2">
                    <label
                      htmlFor="join-player-name"
                      className="text-xs font-display font-bold uppercase tracking-wider text-[#0E1236]"
                    >
                      Nama Panggilanmu
                    </label>
                    <span className="text-[11px] font-sans font-bold opacity-70 text-[#0E1236]">
                      {playerName.length}/{config.nameMaxLength || 12}
                    </span>
                  </div>
                  <input
                    id="join-player-name"
                    type="text"
                    value={playerName}
                    onChange={handleNameChange}
                    placeholder="Contoh: Budi, Sarah, Jagoan"
                    required
                    maxLength={config.nameMaxLength || 12}
                    className="w-full px-5 py-3.5 rounded-full font-sans font-bold text-sm transition-all outline-none"
                    style={{
                      backgroundColor: skin.limeInput,
                      color: skin.navy,
                      border: "2.5px solid #0E1236",
                      boxShadow: "0 3px 0 #0E1236",
                    }}
                  />
                </div>

                {/* Input Kode Room */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 px-2">
                    <label
                      htmlFor="join-room-code"
                      className="text-xs font-display font-bold uppercase tracking-wider text-[#0E1236]"
                    >
                      Kode Akses Room (5 Karakter)
                    </label>
                    <span className="text-[11px] font-sans font-bold opacity-70 text-[#0E1236]">
                      {roomCode.length}/5
                    </span>
                  </div>
                  <input
                    id="join-room-code"
                    type="text"
                    value={roomCode}
                    onChange={(e) =>
                      setRoomCode(e.target.value.toUpperCase().slice(0, 5))
                    }
                    placeholder="Contoh: 4EW2A"
                    required
                    maxLength={5}
                    className="w-full px-5 py-3.5 rounded-full font-display font-bold text-lg tracking-widest text-center uppercase transition-all outline-none"
                    style={{
                      backgroundColor: skin.limeInput,
                      color: skin.navy,
                      border: "2.5px solid #0E1236",
                      boxShadow: "0 3px 0 #0E1236",
                    }}
                  />
                </div>

                {/* Info Box */}
                <div
                  className="p-4 rounded-3xl text-xs font-sans font-bold flex items-center gap-3 border-2 border-[#0E1236]"
                  style={{
                    backgroundColor: skin.limeInput,
                    boxShadow: "0 3px 0 #0E1236",
                  }}
                >
                  <BlobAvatar name="P" color={skin.navy} size={38} />
                  <span>
                    Pastikan kamu sudah meminta kode 5 huruf dari teman host yang
                    membuat room ya!
                  </span>
                </div>

                {/* CTA Button */}
                <button
                  type="submit"
                  disabled={busy || !playerName.trim() || roomCode.length < 5}
                  className="mt-3 w-full py-4 px-6 rounded-full font-display font-bold text-base flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
                  style={{
                    backgroundColor: skin.navy,
                    color: skin.lime,
                    border: "3px solid #0E1236",
                    boxShadow: "0 6px 0 #080A20",
                  }}
                >
                  <IconArrow size={20} />
                  <span>Gabung ke Arena Pertandingan!</span>
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
