const { Server } = require("socket.io");
const config = require("../config");
const constants = require("../config/constants");
const AppError = require("../utils/AppError");
const roomService = require("../services/roomService");
const playerService = require("../services/playerService");
const gameService = require("../services/gameService");

// Kontrak event server:
// Client -> server
//   room:join       { code, name }           Membuat pemain dan masuk lobby.
//   room:connect    { code, playerId }       Mengikat pemain hasil POST /api/rooms.
//   room:leave      {}                       Keluar dari room.
//   game:start      {}                       Host memulai game.
//   game:stop       {}                       Host mengakhiri game lebih awal.
//   answer:submit   { choice }               Mengirim indeks opsi 0..3.
// Semua event menerima callback opsional sebagai acknowledgement.
// Server -> client
//   room:state      { room, player }         Snapshot untuk socket tersebut.
//   room:updated    { room }                 Perubahan daftar pemain/status.
//   game:question   { index, number, total, text, options, durationMs }
//   game:answer-progress { answeredCount, totalPlayers, allAnswered }
//   game:reveal     { index, number, total, correctIndex, explanation, results, leaderboard, isLast }
//   game:result     { topic, leaderboard, winners }
//   server:error    { message, code }        Error jika acknowledgement tidak diberikan.

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: config.clientUrls,
      methods: ["GET", "POST"],
    },
  });

  // Satu timer soal dan satu timer reveal per room. Semua perubahan state game
  // dijalankan oleh server sehingga waktu client tidak dapat memengaruhi skor.
  const questionTimers = new Map();
  const revealTimers = new Map();
  const connectedPlayers = new Map(); // playerId -> socketId

  function clearTimer(timers, code) {
    const timer = timers.get(code);
    if (timer) clearTimeout(timer);
    timers.delete(code);
  }

  function clearRoomTimers(code) {
    clearTimer(questionTimers, code);
    clearTimer(revealTimers, code);
  }

  function acknowledge(socket, callback, payload) {
    if (typeof callback === "function") callback(payload);
    else if (payload?.ok === false) socket.emit("server:error", payload.error);
  }

  function errorPayload(error) {
    return {
      ok: false,
      error: {
        message: error instanceof AppError ? error.message : "Terjadi kesalahan pada server",
        code: error.code || "SERVER_ERROR",
      },
    };
  }

  function handle(socket, callback, action) {
    try {
      const result = action();
      Promise.resolve(result)
        .then((payload) => acknowledge(socket, callback, { ok: true, ...payload }))
        .catch((error) => acknowledge(socket, callback, errorPayload(error)));
    } catch (error) {
      acknowledge(socket, callback, errorPayload(error));
    }
  }

  function getSession(socket) {
    if (!socket.data.roomCode || !socket.data.playerId) {
      throw new AppError("Kamu belum masuk ke room", 401, "NOT_IN_ROOM");
    }
    return { code: socket.data.roomCode, playerId: socket.data.playerId };
  }

  async function bindPlayer(socket, code, playerId) {
    const existingSocketId = connectedPlayers.get(playerId);
    if (existingSocketId && existingSocketId !== socket.id) {
      throw new AppError("Pemain ini sudah terhubung", 409, "PLAYER_ALREADY_CONNECTED");
    }

    const current = playerService.getPlayer({ code, playerId });
    if (!current.player.connected) {
      throw new AppError("Pemain sudah keluar dari game", 409, "PLAYER_LEFT");
    }

    // Pakai kode resmi dari room, karena klien dapat mengirim kode huruf kecil.
    const roomCode = current.room.code;
    await socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerId = playerId;
    connectedPlayers.set(playerId, socket.id);
    return current;
  }

  function publishRoom(code) {
    try {
      io.to(code).emit("room:updated", { room: roomService.getPublicRoom(code) });
    } catch (error) {
      // Room dapat sudah dihapus saat disconnect berjalan.
    }
  }

  function sendNextQuestion(code) {
    clearTimer(questionTimers, code);
    clearTimer(revealTimers, code);

    let next;
    try {
      next = gameService.nextQuestion({ code });
    } catch (error) {
      return;
    }

    if (next.done) {
      io.to(code).emit("game:result", next.result);
      publishRoom(code);
      return;
    }

    io.to(code).emit("game:question", next.question);
    const timer = setTimeout(() => finishQuestion(code), constants.QUESTION_TIME_MS);
    questionTimers.set(code, timer);
  }

  function finishQuestion(code) {
    clearTimer(questionTimers, code);

    const reveal = gameService.finishQuestion({ code });
    if (!reveal) return;

    io.to(code).emit("game:reveal", reveal);
    publishRoom(code);

    const timer = setTimeout(() => sendNextQuestion(code), constants.REVEAL_TIME_MS);
    revealTimers.set(code, timer);
  }

  function disconnectPlayer(socket) {
    const { roomCode: code, playerId } = socket.data;
    if (!code || !playerId) return;

    // Socket lama tidak boleh memutus sesi socket baru milik pemain yang sama.
    if (connectedPlayers.get(playerId) !== socket.id) return;
    connectedPlayers.delete(playerId);
    socket.data.roomCode = null;
    socket.data.playerId = null;

    const result = roomService.leaveRoom({ code, playerId });
    if (result.roomDeleted) {
      clearRoomTimers(code);
      return;
    }

    publishRoom(code);

    // Saat game berjalan, pemain yang putus tidak lagi dihitung untuk syarat
    // semua pemain sudah menjawab.
    if (result.room?.status === "playing") {
      const progress = gameService.getAnswerProgress(code);
      if (progress.allAnswered) finishQuestion(code);
    }
  }

  io.on("connection", (socket) => {
    socket.on("room:join", (payload = {}, callback) => {
      handle(socket, callback, async () => {
        if (socket.data.roomCode) {
          throw new AppError("Socket ini sudah terhubung ke room", 409, "ALREADY_IN_ROOM");
        }
        const joined = roomService.joinRoom({ code: payload.code, name: payload.name });
        try {
          await bindPlayer(socket, payload.code, joined.player.id);
        } catch (error) {
          roomService.leaveRoom({ code: payload.code, playerId: joined.player.id });
          throw error;
        }
        const state = playerService.getPlayer({ code: payload.code, playerId: joined.player.id });
        socket.emit("room:state", state);
        publishRoom(state.room.code);
        return state;
      });
    });

    socket.on("room:connect", (payload = {}, callback) => {
      handle(socket, callback, async () => {
        if (socket.data.roomCode) {
          throw new AppError("Socket ini sudah terhubung ke room", 409, "ALREADY_IN_ROOM");
        }
        const state = await bindPlayer(socket, payload.code, payload.playerId);
        socket.emit("room:state", state);
        publishRoom(state.room.code);
        return state;
      });
    });

    socket.on("room:leave", (payload = {}, callback) => {
      handle(socket, callback, async () => {
        const { code } = getSession(socket);
        const playerId = socket.data.playerId;
        connectedPlayers.delete(playerId);
        socket.data.roomCode = null;
        socket.data.playerId = null;
        await socket.leave(code);

        const result = roomService.leaveRoom({ code, playerId });
        if (result.roomDeleted) clearRoomTimers(code);
        else {
          publishRoom(code);
          if (result.room?.status === "playing") {
            const progress = gameService.getAnswerProgress(code);
            if (progress.allAnswered) finishQuestion(code);
          }
        }
        return { room: result.room };
      });
    });

    socket.on("game:start", (payload, callback) => {
      handle(socket, callback, () => {
        const session = getSession(socket);
        const started = gameService.startGame(session);
        publishRoom(session.code);
        // Soal pertama langsung dimulai setelah host memulai game.
        sendNextQuestion(session.code);
        return started;
      });
    });

    socket.on("game:stop", (payload, callback) => {
      handle(socket, callback, () => {
        const session = getSession(socket);
        const result = gameService.endGame(session);

        clearRoomTimers(session.code);
        io.to(session.code).emit("game:result", result);
        publishRoom(session.code);
        return { result };
      });
    });

    socket.on("answer:submit", (payload = {}, callback) => {
      handle(socket, callback, () => {
        const session = getSession(socket);
        const progress = gameService.submitAnswer({
          ...session,
          choice: payload.choice,
        });
        io.to(session.code).emit("game:answer-progress", progress);
        if (progress.allAnswered) finishQuestion(session.code);
        return { progress };
      });
    });

    socket.on("disconnect", () => disconnectPlayer(socket));
  });

  return io;
}

module.exports = { initSocket };
