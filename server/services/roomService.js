const crypto = require("crypto");
const config = require("../config");
const AppError = require("../utils/AppError");
const { validatePlayerName } = require("../utils/validators");
const roomStore = require("../store/roomStore");

// ---------- Pembantu ----------

function createPlayer(name) {
  return {
    id: crypto.randomUUID(),
    name,
    score: 0,
    connected: true,
    joinedAt: Date.now(),
  };
}

// Versi pemain yang aman dikirim ke client.
function toPublicPlayer(room, player) {
  return {
    id: player.id,
    name: player.name,
    score: player.score,
    connected: player.connected,
    isHost: player.id === room.hostId,
  };
}

// Versi room yang aman dikirim ke client.
// PENTING: tidak ada soal dan kunci jawaban di sini.
function toPublicRoom(room) {
  return {
    code: room.code,
    status: room.status, // "lobby" | "playing" | "finished"
    hostId: room.hostId,
    topic: room.topic,
    difficulty: room.difficulty,
    totalQuestions: room.questions.length,
    requestedQuestionCount: room.requestedCount,
    usedFallback: room.usedFallback,
    fallbackTopic: room.fallbackTopic,
    fallbackShortage: room.fallbackShortage,
    minPlayers: config.minPlayers,
    maxPlayers: config.maxPlayers,
    players: room.players.map((player) => toPublicPlayer(room, player)),
  };
}

// Mengambil room versi LENGKAP (hanya untuk dipakai di dalam server).
function getRoomOrThrow(code) {
  const room = roomStore.getRoom(code);

  if (!room) {
    throw new AppError("Room tidak ditemukan", 404, "ROOM_NOT_FOUND");
  }

  return room;
}

// ---------- Fungsi utama ----------

// Dipanggil setelah soal berhasil dibuat (AI atau cadangan).
// Host otomatis menjadi pemain pertama.
function createRoom({
  hostName,
  topic,
  difficulty,
  questions,
  requestedCount,
  usedFallback = false,
  fallbackTopic = null,
  fallbackShortage = false,
}) {
  const name = validatePlayerName(hostName);

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new AppError("Soal tidak tersedia", 500, "NO_QUESTIONS");
  }

  const host = createPlayer(name);

  const room = {
    code: roomStore.generateRoomCode(),
    status: "lobby",
    hostId: host.id,
    topic,
    difficulty,
    questions, // lengkap dengan kunci jawaban, JANGAN dikirim ke client
    requestedCount: requestedCount || questions.length,
    usedFallback,
    fallbackTopic,
    fallbackShortage,
    players: [host], // urutan = urutan masuk, jadi indeks 0 = pemain terlama
    currentQuestionIndex: -1,
    questionStartedAt: null,
    answers: {},
    createdAt: Date.now(),
  };

  roomStore.saveRoom(room);

  return {
    room: toPublicRoom(room),
    player: toPublicPlayer(room, host),
  };
}

function joinRoom({ code, name }) {
  const room = getRoomOrThrow(code);
  const cleanName = validatePlayerName(name);

  if (room.status !== "lobby") {
    throw new AppError("Game sudah dimulai", 409, "GAME_STARTED");
  }

  if (room.players.length >= config.maxPlayers) {
    throw new AppError("Room penuh", 409, "ROOM_FULL");
  }

  const nameTaken = room.players.some(
    (player) => player.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (nameTaken) {
    throw new AppError("Nama sudah dipakai", 409, "NAME_TAKEN");
  }

  const player = createPlayer(cleanName);
  room.players.push(player);

  return {
    room: toPublicRoom(room),
    player: toPublicPlayer(room, player),
  };
}

// Aman dipanggil berulang kali (event disconnect kadang datang dua kali),
// dan tidak melempar error kalau room atau pemain sudah tidak ada.
function leaveRoom({ code, playerId }) {
  const room = roomStore.getRoom(code);

  if (!room) {
    return { roomDeleted: true, room: null, leftPlayer: null, newHostId: null };
  }

  const player = room.players.find((item) => item.id === playerId);

  if (!player) {
    return {
      roomDeleted: false,
      room: toPublicRoom(room),
      leftPlayer: null,
      newHostId: null,
    };
  }

  const leftPlayer = toPublicPlayer(room, player);

  if (room.status === "lobby") {
    // Di lobby, pemain yang keluar benar-benar dihapus.
    room.players = room.players.filter((item) => item.id !== playerId);
  } else {
    // Saat game berjalan, pemain hanya ditandai terputus supaya skornya tetap tampil.
    player.connected = false;
  }

  const connectedPlayers = room.players.filter((item) => item.connected);

  if (connectedPlayers.length === 0) {
    roomStore.deleteRoom(room.code);
    return { roomDeleted: true, room: null, leftPlayer, newHostId: null };
  }

  let newHostId = null;

  // Host keluar di lobby: host pindah ke pemain terlama.
  if (room.status === "lobby" && room.hostId === playerId) {
    room.hostId = room.players[0].id;
    newHostId = room.hostId;
  }

  return {
    roomDeleted: false,
    room: toPublicRoom(room),
    leftPlayer,
    newHostId,
  };
}

function getPublicRoom(code) {
  return toPublicRoom(getRoomOrThrow(code));
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getPublicRoom,
  getRoomOrThrow,
  toPublicRoom,
  toPublicPlayer,
};
