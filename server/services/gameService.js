const config = require("../config");
const AppError = require("../utils/AppError");
const {
  QUESTION_TIME_MS,
  OPTIONS_PER_QUESTION,
} = require("../config/constants");
const roomStore = require("../store/roomStore");
const { calculateScore } = require("./scoreService");
const { getRoomOrThrow, toPublicRoom } = require("./roomService");

// ---------- Pembantu ----------

// Urutan peringkat. Skor sama = peringkat sama (contoh: 1, 2, 2, 4).
function buildLeaderboard(room) {
  const sorted = [...room.players].sort(
    (a, b) => b.score - a.score || a.joinedAt - b.joinedAt
  );

  let lastScore = null;
  let lastRank = 0;

  return sorted.map((player, index) => {
    if (player.score !== lastScore) {
      lastRank = index + 1;
      lastScore = player.score;
    }

    return {
      rank: lastRank,
      playerId: player.id,
      name: player.name,
      score: player.score,
      connected: player.connected,
    };
  });
}

// Hasil akhir game. Pemenang = semua yang peringkat 1, asalkan skornya lebih dari 0.
function buildResult(room) {
  const leaderboard = buildLeaderboard(room);
  const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
  const winners =
    topScore > 0 ? leaderboard.filter((entry) => entry.rank === 1) : [];

  return { topic: room.topic, leaderboard, winners };
}

// Soal versi client. PENTING: tanpa kunci jawaban dan tanpa penjelasan.
function toClientQuestion(room) {
  const question = room.questions[room.currentQuestionIndex];

  return {
    index: room.currentQuestionIndex,
    number: room.currentQuestionIndex + 1,
    total: room.questions.length,
    text: question.text,
    options: question.options,
    durationMs: QUESTION_TIME_MS,
  };
}

// Menghitung berapa pemain (yang masih terhubung) yang sudah menjawab.
function buildAnswerProgress(room) {
  const connected = room.players.filter((player) => player.connected);
  const answeredCount = connected.filter((player) => room.answers[player.id]).length;

  return {
    answeredCount,
    totalPlayers: connected.length,
    allAnswered: connected.length > 0 && answeredCount === connected.length,
  };
}

// ---------- Fungsi utama ----------

// Host menekan tombol Mulai.
function startGame({ code, playerId }) {
  const room = getRoomOrThrow(code);

  if (room.hostId !== playerId) {
    throw new AppError("Hanya host yang bisa memulai game", 403, "NOT_HOST");
  }

  if (room.status !== "lobby") {
    throw new AppError("Game sudah dimulai", 409, "GAME_STARTED");
  }

  if (room.players.length < config.minPlayers) {
    throw new AppError(
      `Minimal ${config.minPlayers} pemain untuk memulai`,
      409,
      "NOT_ENOUGH_PLAYERS"
    );
  }

  room.status = "playing";
  room.currentQuestionIndex = -1;
  room.questionActive = false;

  return { room: toPublicRoom(room) };
}

// Host may stop an active match. Scores from completed questions are kept;
// an unfinished question does not award points.
function endGame({ code, playerId }) {
  const room = getRoomOrThrow(code);

  if (room.hostId !== playerId) {
    throw new AppError("Hanya host yang bisa mengakhiri pertandingan", 403, "NOT_HOST");
  }

  if (room.status !== "playing") {
    throw new AppError("Tidak ada pertandingan yang sedang berjalan", 409, "GAME_NOT_PLAYING");
  }

  room.status = "finished";
  room.questionActive = false;

  return { ...buildResult(room), endedEarly: true };
}

// Memulai soal berikutnya. Dipanggil Dev3 untuk soal pertama dan setiap selesai reveal.
// Hasilnya salah satu dari:
//   { done: false, question }  -> kirim soal ke semua pemain, lalu nyalakan timer
//   { done: true, result }     -> game selesai, kirim hasil akhir
// Parameter "now" hanya untuk pengetesan.
function nextQuestion({ code, now = Date.now() }) {
  const room = getRoomOrThrow(code);

  if (room.status !== "playing") {
    throw new AppError("Game belum berjalan", 409, "GAME_NOT_PLAYING");
  }

  if (room.questionActive) {
    throw new AppError("Soal sebelumnya belum selesai", 409, "QUESTION_ACTIVE");
  }

  const nextIndex = room.currentQuestionIndex + 1;

  if (nextIndex >= room.questions.length) {
    room.status = "finished";
    return { done: true, result: buildResult(room) };
  }

  room.currentQuestionIndex = nextIndex;
  room.questionStartedAt = now;
  room.questionActive = true;
  room.answers = {};

  return { done: false, question: toClientQuestion(room) };
}

// Pemain memilih jawaban. Skor TIDAK dihitung di sini supaya benar/salah tidak bocor.
// Hasilnya progres jawaban, berguna untuk menyelesaikan soal lebih awal.
function submitAnswer({ code, playerId, choice, now = Date.now() }) {
  const room = getRoomOrThrow(code);

  if (room.status !== "playing" || !room.questionActive) {
    throw new AppError("Tidak ada soal yang sedang berjalan", 409, "QUESTION_NOT_ACTIVE");
  }

  const player = room.players.find((item) => item.id === playerId);

  if (!player) {
    throw new AppError("Pemain tidak ditemukan", 404, "PLAYER_NOT_FOUND");
  }

  if (
    !Number.isInteger(choice) ||
    choice < 0 ||
    choice >= OPTIONS_PER_QUESTION
  ) {
    throw new AppError("Pilihan jawaban tidak valid", 400, "INVALID_CHOICE");
  }

  if (room.answers[playerId]) {
    throw new AppError("Kamu sudah menjawab soal ini", 409, "ALREADY_ANSWERED");
  }

  const elapsedMs = Math.max(now - room.questionStartedAt, 0);

  if (elapsedMs > QUESTION_TIME_MS) {
    throw new AppError("Waktu menjawab sudah habis", 409, "TOO_LATE");
  }

  room.answers[playerId] = { choice, elapsedMs };

  return buildAnswerProgress(room);
}

// Mengecek progres jawaban tanpa mengubah apa pun.
// Dev3 memanggilnya setelah ada pemain terputus saat soal berjalan,
// siapa tahu semua pemain yang tersisa sudah menjawab.
function getAnswerProgress(code) {
  return buildAnswerProgress(getRoomOrThrow(code));
}

// Mengakhiri soal (timer habis, atau semua sudah menjawab), menghitung skor,
// lalu mengembalikan data reveal.
// Mengembalikan null kalau soal sudah diselesaikan sebelumnya atau room sudah hilang.
// Dev3 cukup mengabaikan null (timer dan "semua sudah menjawab" bisa terpicu bersamaan).
function finishQuestion({ code }) {
  const room = roomStore.getRoom(code);

  if (!room || room.status !== "playing" || !room.questionActive) {
    return null;
  }

  room.questionActive = false;

  const question = room.questions[room.currentQuestionIndex];

  const results = room.players.map((player) => {
    const answer = room.answers[player.id];
    const correct = Boolean(answer) && answer.choice === question.answerIndex;
    const points = correct ? calculateScore(answer.elapsedMs) : 0;

    player.score += points;

    return {
      playerId: player.id,
      choice: answer ? answer.choice : null,
      correct,
      points,
    };
  });

  return {
    index: room.currentQuestionIndex,
    number: room.currentQuestionIndex + 1,
    total: room.questions.length,
    correctIndex: question.answerIndex,
    explanation: question.explanation,
    results,
    leaderboard: buildLeaderboard(room),
    isLast: room.currentQuestionIndex === room.questions.length - 1,
  };
}

function getLeaderboard(code) {
  return buildLeaderboard(getRoomOrThrow(code));
}

module.exports = {
  startGame,
  endGame,
  nextQuestion,
  submitAnswer,
  getAnswerProgress,
  finishQuestion,
  getLeaderboard,
};
