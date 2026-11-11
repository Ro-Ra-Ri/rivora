import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  SERVER_URL,
  emitHostJoinRoom,
  emitJoinRoom,
} from "../socket";

export const DEFAULT_CONFIG = {
  questionCountOptions: [5, 10, 15],
  defaultQuestionCount: 5,
  difficulties: ["Mudah", "Sedang", "Sulit"],
  defaultDifficulty: "Sedang",
  nameMaxLength: 12,
  topicMinLength: 3,
  topicMaxLength: 50,
  minPlayers: 4,
  maxPlayers: 10,
  questionTimeMs: 20000,
  revealTimeMs: 8000,
  suggestedTopics: [
    "JavaScript dasar",
    "Sejarah Indonesia",
    "Tata surya",
    "Sepak bola dunia",
  ],
};

function cleanInputText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

// GET /api/config
export const fetchServerConfig = createAsyncThunk(
  "game/fetchServerConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/config`);
      if (!response.ok) {
        return rejectWithValue(null);
      }
      return await response.json();
    } catch {
      return rejectWithValue(null);
    }
  }
);

// POST /api/rooms
export const createRoomAsync = createAsyncThunk(
  "game/createRoom",
  async ({ name, topic, questionCount, difficulty }, { rejectWithValue }) => {
    const cleanName = cleanInputText(name);
    const cleanTopic = cleanInputText(topic);

    if (!cleanName) {
      return rejectWithValue({
        type: "error",
        code: "NAME_REQUIRED",
        message: "Nama wajib diisi",
      });
    }

    if (cleanName.length > DEFAULT_CONFIG.nameMaxLength) {
      return rejectWithValue({
        type: "error",
        code: "NAME_TOO_LONG",
        message: `Nama maksimal ${DEFAULT_CONFIG.nameMaxLength} karakter`,
      });
    }

    if (!cleanTopic) {
      return rejectWithValue({
        type: "error",
        code: "TOPIC_REQUIRED",
        message: "Topik wajib diisi",
      });
    }

    if (cleanTopic.length < DEFAULT_CONFIG.topicMinLength) {
      return rejectWithValue({
        type: "error",
        code: "TOPIC_TOO_SHORT",
        message: `Topik minimal ${DEFAULT_CONFIG.topicMinLength} karakter`,
      });
    }

    if (cleanTopic.length > DEFAULT_CONFIG.topicMaxLength) {
      return rejectWithValue({
        type: "error",
        code: "TOPIC_TOO_LONG",
        message: `Topik maksimal ${DEFAULT_CONFIG.topicMaxLength} karakter`,
      });
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          topic: cleanTopic,
          questionCount:
            Number(questionCount) || DEFAULT_CONFIG.defaultQuestionCount,
          difficulty: difficulty || DEFAULT_CONFIG.defaultDifficulty,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 422 && data.code === "TOPIC_REJECTED") {
        return rejectWithValue({
          type: "rejected",
          code: "TOPIC_REJECTED",
          message:
            data.message || "Topik tidak dikenali sebagai bidang pengetahuan",
          suggestions: Array.isArray(data.suggestions)
            ? data.suggestions
            : DEFAULT_CONFIG.suggestedTopics.slice(0, 3),
        });
      }

      if (!response.ok) {
        return rejectWithValue({
          type: "error",
          code: data.code || "CREATE_ROOM_FAILED",
          message:
            data.message || "Gagal membuat room. Coba beberapa saat lagi.",
        });
      }

      if (data?.room?.code && data?.player?.id) {
        emitHostJoinRoom({ code: data.room.code, playerId: data.player.id });
      }

      return {
        room: data.room,
        player: data.player,
        source: data.source || (data.room?.usedFallback ? "fallback" : "ai"),
      };
    } catch {
      return rejectWithValue({
        type: "error",
        code: "NETWORK_ERROR",
        message:
          "Tidak dapat terhubung ke server. Pastikan server backend sedang berjalan.",
      });
    }
  }
);

// GET /api/rooms/:code + lanjut join room
export const joinRoomCheckAsync = createAsyncThunk(
  "game/joinRoomCheck",
  async ({ code, name }, { rejectWithValue }) => {
    const cleanName = cleanInputText(name);
    const normalizedCode = String(code || "")
      .trim()
      .toUpperCase();

    if (!cleanName) {
      return rejectWithValue({
        code: "NAME_REQUIRED",
        message: "Nama wajib diisi",
      });
    }

    if (cleanName.length > DEFAULT_CONFIG.nameMaxLength) {
      return rejectWithValue({
        code: "NAME_TOO_LONG",
        message: `Nama maksimal ${DEFAULT_CONFIG.nameMaxLength} karakter`,
      });
    }

    if (normalizedCode.length !== 5) {
      return rejectWithValue({
        code: "INVALID_CODE",
        message: "Kode room harus terdiri dari 5 karakter",
      });
    }

    try {
      const response = await fetch(
        `${SERVER_URL}/api/rooms/${encodeURIComponent(normalizedCode)}`
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return rejectWithValue({
          code: data.code || "ROOM_NOT_FOUND",
          message: data.message || "Room tidak ditemukan",
        });
      }

      const room = data.room;

      if (room.status !== "lobby") {
        return rejectWithValue({
          code: "GAME_STARTED",
          message: "Game sudah dimulai",
        });
      }

      if (room.players.length >= (room.maxPlayers || DEFAULT_CONFIG.maxPlayers)) {
        return rejectWithValue({
          code: "ROOM_FULL",
          message: "Room penuh",
        });
      }

      const nameTaken = room.players.some(
        (p) => p.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (nameTaken) {
        return rejectWithValue({
          code: "NAME_TAKEN",
          message: "Nama sudah dipakai",
        });
      }

      const handledBySocket = emitJoinRoom({
        code: room.code,
        name: cleanName,
      });

      const fallbackPlayer = {
        id: `local-${Date.now()}`,
        name: cleanName,
        score: 0,
        connected: true,
        isHost: false,
      };

      const updatedRoom = handledBySocket
        ? room
        : {
            ...room,
            players: [...room.players, fallbackPlayer],
          };

      return {
        handledBySocket,
        room: updatedRoom,
        player: fallbackPlayer,
      };
    } catch {
      return rejectWithValue({
        code: "NETWORK_ERROR",
        message:
          "Tidak dapat menghubungi server. Pastikan server backend sedang berjalan.",
      });
    }
  }
);

const initialState = {
  config: DEFAULT_CONFIG,
  playerName: "",
  room: null,
  player: null,
  source: null,
  phase: "landing", // "landing" | "lobby" | "playing" | "reveal" | "result"
  currentQuestion: null,
  questionStartedAt: null,
  selectedChoice: null,
  answerSubmitted: false,
  answerProgress: null,
  revealData: null,
  finalResult: null,
  isCreatingRoom: false,
  isJoiningRoom: false,
  topicRejection: null,
  error: null,
  socketConnected: false,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setPlayerName(state, action) {
      state.playerName = action.payload;
    },
    clearErrors(state) {
      state.error = null;
      state.topicRejection = null;
    },
    setError(state, action) {
      state.error = {
        message: action.payload?.message || "Terjadi kesalahan",
        code: action.payload?.code || "ERROR",
      };
    },
    setSocketConnected(state, action) {
      state.socketConnected = Boolean(action.payload);
    },
    sessionJoined(state, action) {
      const { room, player, source } = action.payload;
      state.room = room;
      state.player = player;
      state.playerName = player?.name || state.playerName;
      state.source = source || (room?.usedFallback ? "fallback" : "ai");
      state.phase = room?.status === "playing" ? "playing" : "lobby";
      state.error = null;
      state.topicRejection = null;
    },
    roomUpdated(state, action) {
      const updatedRoom = action.payload;
      state.room = updatedRoom;

      if (state.player && updatedRoom?.players) {
        const refreshedSelf = updatedRoom.players.find(
          (p) => p.id === state.player.id
        );
        if (refreshedSelf) {
          state.player = refreshedSelf;
        }
      }
    },
    questionStarted(state, action) {
      const question = action.payload;
      state.phase = "playing";
      if (state.room) {
        state.room.status = "playing";
      }
      state.currentQuestion = question;
      state.questionStartedAt = Date.now();
      state.selectedChoice = null;
      state.answerSubmitted = false;
      state.revealData = null;
      const connectedCount = state.room?.players
        ? state.room.players.filter((p) => p.connected).length
        : 1;
      state.answerProgress = {
        answeredCount: 0,
        totalPlayers: connectedCount,
        allAnswered: false,
      };
      state.error = null;
    },
    answerLocked(state, action) {
      if (state.answerSubmitted) return;
      state.selectedChoice = action.payload;
      state.answerSubmitted = true;

      if (state.answerProgress) {
        const nextCount = Math.min(
          state.answerProgress.answeredCount + 1,
          state.answerProgress.totalPlayers
        );
        state.answerProgress = {
          ...state.answerProgress,
          answeredCount: nextCount,
          allAnswered: nextCount >= state.answerProgress.totalPlayers,
        };
      }
    },
    answerProgressUpdated(state, action) {
      state.answerProgress = action.payload;
    },
    questionRevealed(state, action) {
      const reveal = action.payload;
      state.phase = "reveal";
      state.revealData = reveal;

      if (state.room && Array.isArray(reveal?.leaderboard)) {
        const scoreMap = new Map(
          reveal.leaderboard.map((entry) => [entry.playerId, entry.score])
        );
        state.room.players = state.room.players.map((p) =>
          scoreMap.has(p.id) ? { ...p, score: scoreMap.get(p.id) } : p
        );
        if (state.player && scoreMap.has(state.player.id)) {
          state.player.score = scoreMap.get(state.player.id);
        }
      }
    },
    gameFinished(state, action) {
      state.phase = "result";
      state.finalResult = action.payload;
      if (state.room) {
        state.room.status = "finished";
      }
    },
    leaveAndReset(state) {
      state.room = null;
      state.player = null;
      state.source = null;
      state.phase = "landing";
      state.currentQuestion = null;
      state.questionStartedAt = null;
      state.selectedChoice = null;
      state.answerSubmitted = false;
      state.answerProgress = null;
      state.revealData = null;
      state.finalResult = null;
      state.isCreatingRoom = false;
      state.isJoiningRoom = false;
      state.topicRejection = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServerConfig.fulfilled, (state, action) => {
        if (action.payload && typeof action.payload === "object") {
          state.config = {
            ...DEFAULT_CONFIG,
            ...action.payload,
          };
        }
      })
      .addCase(createRoomAsync.pending, (state) => {
        state.isCreatingRoom = true;
        state.error = null;
        state.topicRejection = null;
      })
      .addCase(createRoomAsync.fulfilled, (state, action) => {
        state.isCreatingRoom = false;
        state.room = action.payload.room;
        state.player = action.payload.player;
        state.playerName = action.payload.player?.name || state.playerName;
        state.source = action.payload.source;
        state.phase = "lobby";
      })
      .addCase(createRoomAsync.rejected, (state, action) => {
        state.isCreatingRoom = false;
        const payload = action.payload || {};

        if (payload.type === "rejected" || payload.code === "TOPIC_REJECTED") {
          state.topicRejection = {
            message: payload.message,
            suggestions: payload.suggestions || [],
          };
        } else {
          state.error = {
            code: payload.code || "ERROR",
            message: payload.message || "Gagal membuat room",
          };
        }
      })
      .addCase(joinRoomCheckAsync.pending, (state) => {
        state.isJoiningRoom = true;
        state.error = null;
        state.topicRejection = null;
      })
      .addCase(joinRoomCheckAsync.fulfilled, (state, action) => {
        state.isJoiningRoom = false;
        state.room = action.payload.room;
        state.player = action.payload.player;
        state.playerName = action.payload.player?.name || state.playerName;
        state.source = action.payload.room?.usedFallback ? "fallback" : "ai";
        state.phase = "lobby";
      })
      .addCase(joinRoomCheckAsync.rejected, (state, action) => {
        state.isJoiningRoom = false;
        const payload = action.payload || {};
        state.error = {
          code: payload.code || "JOIN_FAILED",
          message: payload.message || "Gagal bergabung ke room",
        };
      });
  },
});

export const {
  setPlayerName,
  clearErrors,
  setError,
  setSocketConnected,
  sessionJoined,
  roomUpdated,
  questionStarted,
  answerLocked,
  answerProgressUpdated,
  questionRevealed,
  gameFinished,
  leaveAndReset,
} = gameSlice.actions;

export default gameSlice.reducer;
