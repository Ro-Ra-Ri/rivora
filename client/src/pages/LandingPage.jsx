import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  clearErrors,
  createRoomAsync,
  fetchServerConfig,
  joinRoomCheckAsync,
  setPlayerName,
} from "../store/gameSlice";
import {
  playAiPulse,
  playClick,
  playLobbyChime,
  playSelectChip,
} from "../utils/soundEffects";

const AI_LOADING_STEPS = [
  {
    code: "01",
    title: "Memvalidasi topik & cakupan materi",
    detail: "Memastikan topik layak, faktual, dan sesuai tingkat kesulitan.",
  },
  {
    code: "02",
    title: "Meracik pertanyaan & 4 opsi pengecoh",
    detail: "Menyusun soal pilihan ganda dengan tingkat presisi kompetitif.",
  },
  {
    code: "03",
    title: "Menyusun kunci & penjelasan ringkas AI",
    detail: "Menyiapkan pembahasan instan untuk layar evaluasi tiap soal.",
  },
  {
    code: "04",
    title: "Membuka frekuensi room multiplayer",
    detail: "Menyiapkan kode akses 5 karakter dan sinkronisasi arena.",
  },
];

export default function LandingPage() {
  const { isDark } = useTheme();
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
  const [previewTick, setPreviewTick] = useState(16);

  useEffect(() => {
    dispatch(fetchServerConfig());
  }, [dispatch]);

  useEffect(() => {
    if (room?.code && phase !== "landing") {
      navigate(`/room/${room.code}`);
    }
  }, [room, phase, navigate]);

  // Cycle AI synthesis step animation + sound pulse while creating room
  useEffect(() => {
    if (!isCreatingRoom) {
      return undefined;
    }
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

  // Live interactive telemetry simulation in Right Bento
  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewTick((prev) => (prev <= 4 ? 20 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    if (error || topicRejection) {
      dispatch(clearErrors());
    }
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

  // High-Contrast Prominent Card Surfaces
  const primaryCardSurface = isDark
    ? "bg-[#161829] border-2 border-indigo-500/60 shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_32px_rgba(99,102,241,0.18)]"
    : "bg-white border-2 border-indigo-300 shadow-[0_18px_45px_rgba(30,41,59,0.12),0_4px_0_0_rgba(99,102,241,0.15)]";

  const secondaryCardSurface = isDark
    ? "bg-[#161829] border-2 border-[#383c60] shadow-[0_22px_55px_rgba(0,0,0,0.75)]"
    : "bg-white border-2 border-slate-300 shadow-[0_16px_40px_rgba(30,41,59,0.1)]";

  const subSurface = isDark
    ? "bg-[#20233a] border-2 border-[#3a3f66]"
    : "bg-slate-50 border-2 border-slate-200";

  const inputSurface = isDark
    ? "bg-[#0d0e1a] border-2 border-[#3b3f66] text-white placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/25"
    : "bg-white border-2 border-slate-300 text-zinc-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20";

  const simulatedScore = Math.round(500 + (previewTick / 20) * 500);

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-7 pb-16">
      {/* Centered Hero Header */}
      <section className="max-w-3xl mx-auto text-center mb-10 flex flex-col items-center gap-4">
        <div
          className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border-2 text-xs font-bold transition-transform duration-300 hover:scale-[1.02] ${
            isDark
              ? "bg-[#1b1e34] border-indigo-500/60 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              : "bg-white border-indigo-300 text-indigo-900 shadow-xs"
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-['JetBrains_Mono',monospace] text-[11px] tracking-wider uppercase">
            AI-Powered Multiplayer Trivia
          </span>
          <span
            className={`px-2 py-0.5 rounded-md font-['JetBrains_Mono',monospace] text-[10px] font-bold ${
              isDark
                ? "bg-indigo-600 text-white"
                : "bg-indigo-600 text-white"
            }`}
          >
            LIVE
          </span>
        </div>

        <h1
          className={`font-['Space_Grotesk',sans-serif] font-bold text-3xl sm:text-5xl leading-[1.12] tracking-tight ${
            isDark ? "text-white" : "text-zinc-950"
          }`}
        >
          Ketik topik apa saja.{" "}
          <span className="relative inline-block mt-1.5 sm:mt-0">
            <span
              className={`relative z-10 px-3 py-0.5 rounded-2xl border-2 border-b-4 inline-block ${
                isDark
                  ? "bg-indigo-600/25 border-indigo-400 text-indigo-200 shadow-[0_0_25px_rgba(99,102,241,0.3)]"
                  : "bg-indigo-50 border-indigo-400 text-indigo-700"
              }`}
            >
              Tanding kuis realtime.
            </span>
          </span>
        </h1>

        <p
          className={`text-sm sm:text-base max-w-xl leading-relaxed font-medium ${
            isDark ? "text-zinc-300" : "text-slate-600"
          }`}
        >
          AI merakit soal pilihan ganda seketika dari topik pilihanmu. Bagikan
          kode room ke teman-teman, jawab serentak dalam 20 detik, dan puncaki
          klasemen.
        </p>
      </section>

      {/* Main Bento Grid: Command Deck (Left) + Live Telemetry Bento (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Command Hub Form Card */}
        <section
          aria-label="Formulir masuk permainan"
          className={`lg:col-span-7 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden ${primaryCardSurface}`}
        >
          {/* Prominent Top Accent Bar */}
          <div
            aria-hidden="true"
            className="absolute top-0 inset-x-0 h-2 bg-indigo-500"
          />

          {/* Card Header Banner */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeTab === "create" ? "bg-indigo-400" : "bg-emerald-400"
                }`}
              />
              <span
                className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-indigo-300" : "text-indigo-700"
                }`}
              >
                {activeTab === "create"
                  ? "PANEL HOST · BUAT ARENA BARU"
                  : "PANEL PEMAIN · MASUK ARENA"}
              </span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-lg font-['JetBrains_Mono',monospace] text-[10px] font-bold border ${
                isDark
                  ? "bg-[#20233a] border-[#3d426b] text-zinc-200"
                  : "bg-indigo-50 border-indigo-200 text-indigo-700"
              }`}
            >
              SIAP DIGUNAKAN
            </span>
          </div>

          {/* Mode Switcher Pill */}
          <div
            role="tablist"
            aria-label="Pilih aksi room"
            className={`grid grid-cols-2 gap-2 p-1.5 rounded-2xl border-2 ${
              isDark
                ? "bg-[#0d0e1a] border-[#343859]"
                : "bg-slate-100 border-slate-300"
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "create"}
              onClick={() => handleSwitchTab("create")}
              disabled={busy}
              className={`min-h-[46px] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "create"
                  ? isDark
                    ? "bg-indigo-600 text-white border-2 border-b-4 border-indigo-400 shadow-[0_6px_20px_rgba(79,70,229,0.5)]"
                    : "bg-indigo-600 text-white border-2 border-b-4 border-indigo-800 shadow-sm"
                  : isDark
                    ? "text-zinc-300 hover:text-white hover:bg-[#191b2e]"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/60"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Buat Room Baru</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "join"}
              onClick={() => handleSwitchTab("join")}
              disabled={busy}
              className={`min-h-[46px] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "join"
                  ? isDark
                    ? "bg-indigo-600 text-white border-2 border-b-4 border-indigo-400 shadow-[0_6px_20px_rgba(79,70,229,0.5)]"
                    : "bg-indigo-600 text-white border-2 border-b-4 border-indigo-800 shadow-sm"
                  : isDark
                    ? "text-zinc-300 hover:text-white hover:bg-[#191b2e]"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white/60"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Gabung Kode Room</span>
            </button>
          </div>

          {/* Interactive AI Synthesis Loading Stage when Creating Room */}
          {isCreatingRoom ? (
            <div
              role="status"
              aria-live="polite"
              className={`p-6 sm:p-7 rounded-2xl border-2 flex flex-col gap-6 ${
                isDark
                  ? "bg-[#1d2038] border-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.25)]"
                  : "bg-indigo-50 border-indigo-300 text-zinc-900"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <span className="absolute inset-0 rounded-2xl border-2 border-indigo-400/50 animate-ping" />
                  <span className="absolute inset-1 rounded-xl border-2 border-dashed border-indigo-300 animate-spin" />
                  <div className="relative w-11 h-11 rounded-xl flex items-center justify-center border-2 bg-indigo-600 border-indigo-300 text-white">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                </div>

                <div className="text-center sm:text-left flex-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    AI Neural Generator Active
                  </div>
                  <h2 className="font-['Space_Grotesk',sans-serif] text-lg sm:text-xl font-bold">
                    Merakit Paket Soal Kuis...
                  </h2>
                  <p
                    className={`text-xs sm:text-sm mt-0.5 ${
                      isDark ? "text-zinc-300" : "text-slate-600"
                    }`}
                  >
                    Topik:{" "}
                    <strong className={isDark ? "text-white" : "text-zinc-900"}>
                      &ldquo;{topic.trim() || "Pilihan"}&rdquo;
                    </strong>{" "}
                    · {questionCount} Soal · Level {difficulty}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AI_LOADING_STEPS.map((step, index) => {
                  const isCurrent = index === loadingStepIdx;
                  const isDone = index < loadingStepIdx;
                  return (
                    <div
                      key={step.code}
                      className={`p-3.5 rounded-xl border-2 transition-all duration-300 flex items-start gap-3 ${
                        isCurrent
                          ? isDark
                            ? "bg-indigo-600/35 border-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                            : "bg-white border-indigo-600 shadow-sm"
                          : isDone
                            ? isDark
                              ? "bg-[#152826] border-emerald-400/70"
                              : "bg-emerald-50 border-emerald-400"
                            : isDark
                              ? "bg-[#141627] border-[#323656] opacity-70"
                              : "bg-white/70 border-slate-200 opacity-70"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg font-['JetBrains_Mono',monospace] text-xs font-bold inline-flex items-center justify-center shrink-0 border ${
                          isCurrent
                            ? "bg-indigo-600 border-indigo-300 text-white animate-pulse"
                            : isDone
                              ? "bg-emerald-500 border-emerald-300 text-white"
                              : isDark
                                ? "bg-[#22253e] border-[#3d426b] text-zinc-300"
                                : "bg-slate-100 border-slate-300 text-slate-600"
                        }`}
                      >
                        {isDone ? "✓" : step.code}
                      </span>
                      <div className="min-w-0">
                        <strong className="block text-xs font-bold truncate">
                          {step.title}
                        </strong>
                        <span
                          className={`block text-[11px] leading-snug mt-0.5 ${
                            isDark ? "text-zinc-300" : "text-slate-600"
                          }`}
                        >
                          {step.detail}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between font-['JetBrains_Mono',monospace] text-[11px] font-bold">
                  <span
                    className={isDark ? "text-indigo-300" : "text-indigo-700"}
                  >
                    SINKRONISASI ENGINE AI
                  </span>
                  <span>
                    TAHAP {loadingStepIdx + 1} / {AI_LOADING_STEPS.length}
                  </span>
                </div>
                <div
                  className={`w-full h-2.5 rounded-full overflow-hidden border ${
                    isDark
                      ? "bg-[#0d0e1a] border-[#343859]"
                      : "bg-indigo-100 border-indigo-200"
                  }`}
                >
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500 animate-pulse"
                    style={{
                      width: `${((loadingStepIdx + 1) / AI_LOADING_STEPS.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Input Nama Panggilan */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="player-name-input"
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? "text-zinc-200" : "text-slate-800"
                    }`}
                  >
                    Nama Panggilan Pemain
                  </label>
                  <span
                    className={`font-['JetBrains_Mono',monospace] text-xs font-bold tabular-nums ${
                      isDark ? "text-indigo-300" : "text-indigo-700"
                    }`}
                  >
                    {playerName.trim().length}/{config.nameMaxLength || 12}
                  </span>
                </div>
                <input
                  id="player-name-input"
                  type="text"
                  placeholder="Masukkan nama panggilanmu (maks. 12 karakter)"
                  maxLength={config.nameMaxLength || 12}
                  value={playerName}
                  onChange={handleNameChange}
                  disabled={busy}
                  autoComplete="nickname"
                  className={`w-full min-h-[50px] px-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all disabled:opacity-50 ${inputSurface}`}
                />
              </div>

              {/* Pesan Error Umum */}
              {error && (
                <div
                  role="alert"
                  className={`p-4 rounded-2xl border-2 flex flex-col gap-1 ${
                    isDark
                      ? "bg-rose-950/70 border-rose-500 text-rose-100"
                      : "bg-rose-50 border-rose-400 text-rose-950"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
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
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Permintaan Ditolak</span>
                  </div>
                  <p className="text-sm font-medium">{error.message}</p>
                </div>
              )}

              {/* Panel Penolakan Topik oleh AI (Status 422 TOPIC_REJECTED) */}
              {topicRejection && activeTab === "create" && (
                <div
                  role="alert"
                  className={`p-4 rounded-2xl border-2 flex flex-col gap-2.5 ${
                    isDark
                      ? "bg-amber-950/60 border-amber-400 text-amber-100"
                      : "bg-amber-50 border-amber-400 text-amber-950"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
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
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>Topik Ditolak oleh AI</span>
                  </div>
                  <p className="text-sm font-medium">
                    {topicRejection.message}
                  </p>

                  {topicRejection.suggestions?.length > 0 && (
                    <div
                      className={`pt-2.5 border-t flex flex-col gap-2 ${
                        isDark ? "border-amber-500/40" : "border-amber-300"
                      }`}
                    >
                      <span className="text-xs font-semibold">
                        Saran topik yang bisa langsung dipakai:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {topicRejection.suggestions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleSelectQuickTopic(item)}
                            className={`min-h-[34px] px-3 py-1 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer hover:-translate-y-0.5 ${
                              isDark
                                ? "bg-[#20233a] border-amber-400 text-amber-200 hover:bg-amber-500/25"
                                : "bg-white border-amber-400 text-amber-900 hover:bg-amber-100"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FORM 1: BUAT ROOM (HOST) */}
              {activeTab === "create" ? (
                <form
                  onSubmit={handleCreateSubmit}
                  noValidate
                  className="flex flex-col gap-5"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="topic-input"
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isDark ? "text-zinc-200" : "text-slate-800"
                        }`}
                      >
                        Prompt Topik Kuis
                      </label>
                      <span
                        className={`font-['JetBrains_Mono',monospace] text-xs font-bold tabular-nums ${
                          isDark ? "text-indigo-300" : "text-indigo-700"
                        }`}
                      >
                        {topic.trim().length}/{config.topicMaxLength || 50}
                      </span>
                    </div>
                    <input
                      id="topic-input"
                      type="text"
                      placeholder="Contoh: Sejarah Indonesia, Anime populer, Tata surya..."
                      minLength={config.topicMinLength || 3}
                      maxLength={config.topicMaxLength || 50}
                      value={topic}
                      onChange={handleTopicChange}
                      disabled={busy}
                      className={`w-full min-h-[50px] px-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all disabled:opacity-50 ${inputSurface}`}
                    />

                    {/* Quick Topics (Bonus #1 PRD) */}
                    <div className="flex items-center flex-wrap gap-2 pt-1">
                      <span
                        className={`text-xs mr-1 font-bold ${
                          isDark ? "text-zinc-300" : "text-slate-600"
                        }`}
                      >
                        Topik populer:
                      </span>
                      {(config.suggestedTopics || []).map((item) => {
                        const isSelected =
                          topic.toLowerCase() === item.toLowerCase();
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleSelectQuickTopic(item)}
                            disabled={busy}
                            className={`min-h-[34px] px-3 py-1 rounded-xl border-2 border-b-4 text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 disabled:opacity-50 ${
                              isSelected
                                ? isDark
                                  ? "bg-indigo-600 border-indigo-300 text-white shadow-[0_0_16px_rgba(99,102,241,0.5)]"
                                  : "bg-indigo-600 border-indigo-800 text-white"
                                : isDark
                                  ? "bg-[#20233a] border-[#3d426b] text-zinc-100 hover:border-indigo-400 hover:bg-[#282c48]"
                                  : "bg-slate-100 border-slate-300 text-slate-800 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Jumlah Soal */}
                    <div className="flex flex-col gap-2">
                      <span
                        id="count-group-label"
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isDark ? "text-zinc-200" : "text-slate-800"
                        }`}
                      >
                        Jumlah Soal
                      </span>
                      <div
                        role="group"
                        aria-labelledby="count-group-label"
                        className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-xl border-2 ${
                          isDark
                            ? "bg-[#0d0e1a] border-[#343859]"
                            : "bg-slate-100 border-slate-300"
                        }`}
                      >
                        {(config.questionCountOptions || [5, 10, 15]).map(
                          (count) => {
                            const active = Number(questionCount) === count;
                            return (
                              <button
                                key={count}
                                type="button"
                                onClick={() => {
                                  playSelectChip();
                                  setQuestionCount(count);
                                }}
                                disabled={busy}
                                className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                                  active
                                    ? isDark
                                      ? "bg-indigo-600 text-white border-2 border-indigo-300 shadow-xs"
                                      : "bg-indigo-600 text-white border-2 border-indigo-800 shadow-xs"
                                    : isDark
                                      ? "text-zinc-300 hover:text-white hover:bg-[#1b1e34] border-2 border-transparent"
                                      : "text-slate-700 hover:text-slate-950 hover:bg-white border-2 border-transparent"
                                }`}
                              >
                                {count} Soal
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Tingkat Kesulitan */}
                    <div className="flex flex-col gap-2">
                      <span
                        id="diff-group-label"
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isDark ? "text-zinc-200" : "text-slate-800"
                        }`}
                      >
                        Kesulitan
                      </span>
                      <div
                        role="group"
                        aria-labelledby="diff-group-label"
                        className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-xl border-2 ${
                          isDark
                            ? "bg-[#0d0e1a] border-[#343859]"
                            : "bg-slate-100 border-slate-300"
                        }`}
                      >
                        {(
                          config.difficulties || ["Mudah", "Sedang", "Sulit"]
                        ).map((level) => {
                          const active = difficulty === level;
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => {
                                playSelectChip();
                                setDifficulty(level);
                              }}
                              disabled={busy}
                              className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                                active
                                  ? isDark
                                    ? "bg-indigo-600 text-white border-2 border-indigo-300 shadow-xs"
                                    : "bg-indigo-600 text-white border-2 border-indigo-800 shadow-xs"
                                  : isDark
                                    ? "text-zinc-300 hover:text-white hover:bg-[#1b1e34] border-2 border-transparent"
                                    : "text-slate-700 hover:text-slate-950 hover:bg-white border-2 border-transparent"
                              }`}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className={`min-h-[54px] px-5 py-3 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2.5 border-2 border-b-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark
                        ? "bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-300 shadow-[0_10px_30px_rgba(79,70,229,0.5)]"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-800 shadow-[0_8px_22px_rgba(79,70,229,0.3)]"
                    }`}
                  >
                    <span>Buat Room &amp; Generate Soal AI</span>
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
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </form>
              ) : (
                /* FORM 2: GABUNG DENGAN KODE ROOM */
                <form
                  onSubmit={handleJoinSubmit}
                  noValidate
                  className="flex flex-col gap-5"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="room-code-input"
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isDark ? "text-zinc-200" : "text-slate-800"
                        }`}
                      >
                        Kode Room (5 Karakter)
                      </label>
                      <span
                        className={`font-['JetBrains_Mono',monospace] text-xs font-bold tabular-nums ${
                          isDark ? "text-indigo-300" : "text-indigo-700"
                        }`}
                      >
                        {roomCode.length}/5 Karakter
                      </span>
                    </div>

                    <input
                      id="room-code-input"
                      type="text"
                      placeholder="Ketik 5 karakter kode room (mis. K7MP2)"
                      maxLength={5}
                      value={roomCode}
                      onChange={(e) => {
                        const cleaned = e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 5);
                        if (cleaned !== roomCode) {
                          playSelectChip();
                        }
                        setRoomCode(cleaned);
                        if (error) dispatch(clearErrors());
                      }}
                      disabled={busy}
                      autoComplete="off"
                      className={`w-full min-h-[56px] px-4 py-3 rounded-xl font-['JetBrains_Mono',monospace] text-xl font-bold tracking-[0.25em] uppercase text-center outline-none transition-all disabled:opacity-50 ${inputSurface}`}
                    />

                    {/* Visual 5-Slot Keycap Preview */}
                    <div
                      aria-hidden="true"
                      className="grid grid-cols-5 gap-2.5 pt-1"
                    >
                      {[0, 1, 2, 3, 4].map((slotIdx) => {
                        const char = roomCode[slotIdx] || "";
                        const isActiveSlot = roomCode.length === slotIdx;
                        return (
                          <div
                            key={slotIdx}
                            className={`h-13 rounded-xl border-2 border-b-4 font-['JetBrains_Mono',monospace] text-xl font-bold flex items-center justify-center transition-all ${
                              char
                                ? isDark
                                  ? "bg-indigo-600/35 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                  : "bg-indigo-50 border-indigo-500 text-indigo-800"
                                : isActiveSlot
                                  ? isDark
                                    ? "bg-[#20233a] border-indigo-400/70 text-zinc-400"
                                    : "bg-white border-indigo-400 text-slate-400"
                                  : isDark
                                    ? "bg-[#0d0e1a] border-[#343859] text-zinc-500"
                                    : "bg-slate-100 border-slate-300 text-slate-400"
                            }`}
                          >
                            {char || "•"}
                          </div>
                        );
                      })}
                    </div>

                    <span
                      className={`text-xs font-medium ${
                        isDark ? "text-zinc-300" : "text-slate-600"
                      }`}
                    >
                      Masukkan 5 karakter kode akses yang tampil di layar Lobby
                      Host.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className={`min-h-[54px] px-5 py-3 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2.5 border-2 border-b-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark
                        ? "bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-300 shadow-[0_10px_30px_rgba(79,70,229,0.5)]"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-800 shadow-[0_8px_22px_rgba(79,70,229,0.3)]"
                    }`}
                  >
                    {isJoiningRoom ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                        />
                        <span>Memeriksa Kode Room...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Lobby Room</span>
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
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </section>

        {/* Right Bento Column: High-Contrast Live Telemetry + Architecture Cards */}
        <aside className="lg:col-span-5 flex flex-col gap-5">
          {/* Interactive Live Speed-Score Telemetry Card */}
          <div
            className={`p-5 sm:p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden ${secondaryCardSurface}`}
          >
            <div
              aria-hidden="true"
              className="absolute top-0 inset-x-0 h-2 bg-emerald-500"
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span
                  className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Simulasi Skor Kecepatan
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg font-['JetBrains_Mono',monospace] text-xs font-bold border-2 ${
                  isDark
                    ? "bg-emerald-500/25 border-emerald-400 text-emerald-200"
                    : "bg-emerald-100 border-emerald-400 text-emerald-900"
                }`}
              >
                +{simulatedScore} PTS
              </span>
            </div>

            <div
              className={`p-4 rounded-2xl flex flex-col gap-2.5 ${subSurface}`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={isDark ? "text-zinc-200" : "text-slate-700"}>
                  Sisa Waktu Menjawab
                </span>
                <span className="font-['JetBrains_Mono',monospace] font-bold tabular-nums text-indigo-400">
                  {previewTick}s / 20s
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
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${(previewTick / 20) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono',monospace] font-bold">
                <span className={isDark ? "text-zinc-300" : "text-slate-600"}>
                  Basis Benar: 500
                </span>
                <span className="text-emerald-400">
                  Bonus Cepat: +{simulatedScore - 500}
                </span>
              </div>
            </div>

            {/* 3 High-Contrast Color-Coded Spec Tiles */}
            <div className="grid grid-cols-3 gap-2.5">
              <div
                className={`p-3.5 rounded-2xl border-2 border-b-4 flex flex-col justify-between gap-1 transition-transform duration-200 hover:-translate-y-0.5 ${
                  isDark
                    ? "bg-[#1b1e38] border-indigo-400/70 text-white"
                    : "bg-indigo-50/80 border-indigo-300 text-indigo-950"
                }`}
              >
                <span
                  className={`font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? "text-indigo-200" : "text-indigo-700"
                  }`}
                >
                  Durasi
                </span>
                <strong className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tabular-nums text-indigo-400">
                  20s
                </strong>
                <span
                  className={`text-[11px] font-semibold ${
                    isDark ? "text-zinc-300" : "text-slate-600"
                  }`}
                >
                  Per soal
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border-2 border-b-4 flex flex-col justify-between gap-1 transition-transform duration-200 hover:-translate-y-0.5 ${
                  isDark
                    ? "bg-[#142925] border-emerald-400/70 text-white"
                    : "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                }`}
              >
                <span
                  className={`font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? "text-emerald-200" : "text-emerald-800"
                  }`}
                >
                  Skor Maks
                </span>
                <strong className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tabular-nums text-emerald-400">
                  1000
                </strong>
                <span
                  className={`text-[11px] font-semibold ${
                    isDark ? "text-zinc-300" : "text-slate-600"
                  }`}
                >
                  Poin / soal
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl border-2 border-b-4 flex flex-col justify-between gap-1 transition-transform duration-200 hover:-translate-y-0.5 ${
                  isDark
                    ? "bg-[#2b2215] border-amber-400/70 text-white"
                    : "bg-amber-50/80 border-amber-300 text-amber-950"
                }`}
              >
                <span
                  className={`font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? "text-amber-200" : "text-amber-800"
                  }`}
                >
                  Pemain
                </span>
                <strong className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tabular-nums text-amber-400">
                  {config.minPlayers}–{config.maxPlayers}
                </strong>
                <span
                  className={`text-[11px] font-semibold ${
                    isDark ? "text-zinc-300" : "text-slate-600"
                  }`}
                >
                  Per room
                </span>
              </div>
            </div>
          </div>

          {/* Bento Feature Steps */}
          <div
            className={`p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden ${secondaryCardSurface}`}
          >
            <div
              aria-hidden="true"
              className="absolute top-0 inset-x-0 h-2 bg-sky-500"
            />

            <div className="flex items-center justify-between pt-1">
              <span
                className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Arsitektur Arena
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-lg font-['JetBrains_Mono',monospace] text-[10px] font-bold border-2 ${
                  isDark
                    ? "bg-sky-500/20 border-sky-400/60 text-sky-200"
                    : "bg-sky-50 border-sky-300 text-sky-800"
                }`}
              >
                3 Tahap Realtime
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div
                className={`p-4 rounded-2xl border-2 border-l-4 border-l-indigo-500 flex gap-3.5 transition-all duration-200 hover:-translate-y-0.5 ${
                  isDark
                    ? "bg-[#20233a] border-[#3a3f66]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl font-['JetBrains_Mono',monospace] text-xs font-bold inline-flex items-center justify-center shrink-0 border-2 ${
                    isDark
                      ? "bg-indigo-600 border-indigo-300 text-white"
                      : "bg-indigo-600 border-indigo-700 text-white"
                  }`}
                >
                  01
                </span>
                <div className="text-xs sm:text-sm">
                  <strong className="block font-bold mb-0.5">
                    Generate Soal dari Topik Bebas
                  </strong>
                  <p
                    className={`font-medium ${
                      isDark ? "text-zinc-300" : "text-slate-600"
                    }`}
                  >
                    AI merakit pertanyaan faktual lengkap dengan 4 pilihan
                    jawaban dan penjelasan singkat.
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border-2 border-l-4 border-l-emerald-500 flex gap-3.5 transition-all duration-200 hover:-translate-y-0.5 ${
                  isDark
                    ? "bg-[#20233a] border-[#3a3f66]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl font-['JetBrains_Mono',monospace] text-xs font-bold inline-flex items-center justify-center shrink-0 border-2 ${
                    isDark
                      ? "bg-emerald-600 border-emerald-300 text-white"
                      : "bg-emerald-600 border-emerald-700 text-white"
                  }`}
                >
                  02
                </span>
                <div className="text-xs sm:text-sm">
                  <strong className="block font-bold mb-0.5">
                    Sinkronisasi Waktu &amp; Skor Server
                  </strong>
                  <p
                    className={`font-medium ${
                      isDark ? "text-zinc-300" : "text-slate-600"
                    }`}
                  >
                    Semua pemain melihat soal secara serentak. Menjawab benar
                    lebih cepat menghasilkan poin hingga 1.000.
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border-2 border-l-4 border-l-amber-500 flex gap-3.5 transition-all duration-200 hover:-translate-y-0.5 ${
                  isDark
                    ? "bg-[#20233a] border-[#3a3f66]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl font-['JetBrains_Mono',monospace] text-xs font-bold inline-flex items-center justify-center shrink-0 border-2 ${
                    isDark
                      ? "bg-amber-500 border-amber-300 text-zinc-950"
                      : "bg-amber-500 border-amber-600 text-white"
                  }`}
                >
                  03
                </span>
                <div className="text-xs sm:text-sm">
                  <strong className="block font-bold mb-0.5">
                    Pembahasan Instan &amp; Klasemen Akhir
                  </strong>
                  <p
                    className={`font-medium ${
                      isDark ? "text-zinc-300" : "text-slate-600"
                    }`}
                  >
                    Kunci jawaban hanya dikirim saat waktu habis, diikuti
                    peringkat langsung hingga penentuan juara.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
