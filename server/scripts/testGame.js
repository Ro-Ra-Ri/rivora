const assert = require("assert");
const config = require("../config");
const { QUESTION_TIME_MS } = require("../config/constants");
const roomStore = require("../store/roomStore");
const roomService = require("../services/roomService");
const gameService = require("../services/gameService");
const { calculateScore } = require("../services/scoreService");

// Supaya tes tidak tergantung isi file .env
config.minPlayers = 1;

const sampleQuestions = [
  {
    text: "2 + 2 = ?",
    options: ["3", "4", "5", "6"],
    answerIndex: 1,
    explanation: "Dua tambah dua sama dengan empat.",
  },
  {
    text: "3 + 3 = ?",
    options: ["5", "6", "7", "8"],
    answerIndex: 1,
    explanation: "Tiga tambah tiga sama dengan enam.",
  },
];

// Membuat room, memasukkan semua nama sebagai pemain (nama pertama = host).
function setupRoom(names = ["Rina", "Budi", "Dimas"]) {
  const created = roomService.createRoom({
    hostName: names[0],
    topic: "Matematika dasar",
    difficulty: "Mudah",
    questions: sampleQuestions,
  });
  const code = created.room.code;
  const players = [created.player];

  for (const name of names.slice(1)) {
    players.push(roomService.joinRoom({ code, name }).player);
  }

  return { code, players };
}

// Membuat room lalu langsung memulai game (belum ada soal aktif).
function setupGame(names) {
  const { code, players } = setupRoom(names);
  gameService.startGame({ code, playerId: players[0].id });
  return { code, players };
}

function expectError(fn, expectedCode) {
  try {
    fn();
  } catch (error) {
    assert.strictEqual(
      error.code,
      expectedCode,
      `Kode error seharusnya ${expectedCode} tetapi dapat ${error.code}`
    );
    return;
  }
  assert.fail(`Seharusnya error ${expectedCode}, tetapi tidak ada error`);
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  roomStore.clearAllRooms();
  try {
    fn();
    passed++;
    console.log(`  OK     ${name}`);
  } catch (error) {
    failed++;
    console.log(`  GAGAL  ${name}`);
    console.log(`         ${error.message}`);
  }
}

console.log("Tes logika game (Tahap 3)\n");

test("calculateScore: 0 ms = 1000, setengah waktu = 750, habis = 500", () => {
  assert.strictEqual(calculateScore(0), 1000);
  assert.strictEqual(calculateScore(QUESTION_TIME_MS / 2), 750);
  assert.strictEqual(calculateScore(QUESTION_TIME_MS), 500);
  assert.strictEqual(calculateScore(QUESTION_TIME_MS * 2), 500);
  assert.strictEqual(calculateScore(-100), 1000);
});

test("mulai game: bukan host ditolak", () => {
  const { code, players } = setupRoom();
  expectError(
    () => gameService.startGame({ code, playerId: players[1].id }),
    "NOT_HOST"
  );
});

test("mulai game: pemain kurang dari minimal ditolak", () => {
  config.minPlayers = 4;
  try {
    const { code, players } = setupRoom(["Rina", "Budi"]);
    expectError(
      () => gameService.startGame({ code, playerId: players[0].id }),
      "NOT_ENOUGH_PLAYERS"
    );
  } finally {
    config.minPlayers = 1;
  }
});

test("mulai game: berhasil, dan tidak bisa dimulai dua kali", () => {
  const { code, players } = setupRoom();
  const result = gameService.startGame({ code, playerId: players[0].id });
  assert.strictEqual(result.room.status, "playing");
  expectError(
    () => gameService.startGame({ code, playerId: players[0].id }),
    "GAME_STARTED"
  );
});

test("soal untuk client tidak membocorkan jawaban", () => {
  const { code } = setupGame(["Rina", "Budi"]);
  const { done, question } = gameService.nextQuestion({ code });

  assert.strictEqual(done, false);
  assert.strictEqual(question.number, 1);
  assert.strictEqual(question.total, 2);
  assert.strictEqual(question.options.length, 4);
  assert.strictEqual(question.durationMs, QUESTION_TIME_MS);

  const json = JSON.stringify(question);
  assert.ok(!json.includes("answerIndex"));
  assert.ok(!json.includes("explanation"));
});

test("soal baru tidak bisa dimulai saat soal sebelumnya masih aktif", () => {
  const { code } = setupGame(["Rina", "Budi"]);
  gameService.nextQuestion({ code });
  expectError(() => gameService.nextQuestion({ code }), "QUESTION_ACTIVE");
});

test("jawaban: pilihan tidak valid, jawaban ganda, dan terlambat ditolak", () => {
  const { code, players } = setupGame(["Rina", "Budi"]);
  const [rina, budi] = players;
  gameService.nextQuestion({ code, now: 0 });

  expectError(
    () => gameService.submitAnswer({ code, playerId: rina.id, choice: 9, now: 1000 }),
    "INVALID_CHOICE"
  );
  expectError(
    () => gameService.submitAnswer({ code, playerId: rina.id, choice: "1", now: 1000 }),
    "INVALID_CHOICE"
  );

  gameService.submitAnswer({ code, playerId: rina.id, choice: 1, now: 1000 });

  expectError(
    () => gameService.submitAnswer({ code, playerId: rina.id, choice: 1, now: 2000 }),
    "ALREADY_ANSWERED"
  );
  expectError(
    () =>
      gameService.submitAnswer({
        code,
        playerId: budi.id,
        choice: 1,
        now: QUESTION_TIME_MS + 1000,
      }),
    "TOO_LATE"
  );
});

test("skor: makin cepat makin besar, salah dan tidak menjawab = 0", () => {
  const { code, players } = setupGame(["Rina", "Budi", "Dimas", "Sari"]);
  const [rina, budi, dimas, sari] = players;

  gameService.nextQuestion({ code, now: 1000 });

  gameService.submitAnswer({ code, playerId: rina.id, choice: 1, now: 3000 }); // 2000 ms, benar
  gameService.submitAnswer({ code, playerId: budi.id, choice: 1, now: 11000 }); // 10000 ms, benar
  gameService.submitAnswer({ code, playerId: dimas.id, choice: 0, now: 2000 }); // salah
  // Sari tidak menjawab

  const reveal = gameService.finishQuestion({ code });
  const resultOf = (id) => reveal.results.find((item) => item.playerId === id);

  assert.strictEqual(reveal.correctIndex, 1);
  assert.ok(reveal.explanation.length > 0);
  assert.strictEqual(resultOf(rina.id).points, 950);
  assert.strictEqual(resultOf(budi.id).points, 750);
  assert.strictEqual(resultOf(dimas.id).points, 0);
  assert.strictEqual(resultOf(dimas.id).correct, false);
  assert.strictEqual(resultOf(sari.id).choice, null);
  assert.strictEqual(resultOf(sari.id).points, 0);

  assert.deepStrictEqual(
    reveal.leaderboard.map((entry) => entry.rank),
    [1, 2, 3, 3]
  );
  assert.strictEqual(reveal.leaderboard[0].name, "Rina");
  assert.strictEqual(reveal.leaderboard[1].name, "Budi");
  assert.strictEqual(reveal.isLast, false);
});

test("finishQuestion dipanggil dua kali: skor tidak dihitung dobel", () => {
  const { code, players } = setupGame(["Rina", "Budi"]);
  const [rina] = players;

  gameService.nextQuestion({ code, now: 0 });
  gameService.submitAnswer({ code, playerId: rina.id, choice: 1, now: 2000 });

  const first = gameService.finishQuestion({ code });
  const second = gameService.finishQuestion({ code });

  assert.notStrictEqual(first, null);
  assert.strictEqual(second, null);

  const rinaNow = roomStore.getRoom(code).players.find((p) => p.id === rina.id);
  assert.strictEqual(rinaNow.score, 950);
});

test("jawaban setelah soal selesai ditolak", () => {
  const { code, players } = setupGame(["Rina", "Budi"]);
  gameService.nextQuestion({ code, now: 0 });
  gameService.finishQuestion({ code });

  expectError(
    () => gameService.submitAnswer({ code, playerId: players[0].id, choice: 1, now: 1000 }),
    "QUESTION_NOT_ACTIVE"
  );
});

test("game selesai: status finished dan pemenang ditentukan", () => {
  const { code, players } = setupGame(["Rina", "Budi"]);
  const [rina, budi] = players;

  for (let i = 0; i < sampleQuestions.length; i++) {
    gameService.nextQuestion({ code, now: 0 });
    gameService.submitAnswer({ code, playerId: rina.id, choice: 1, now: 1000 });
    gameService.submitAnswer({ code, playerId: budi.id, choice: 0, now: 1000 });

    const reveal = gameService.finishQuestion({ code });
    assert.strictEqual(reveal.isLast, i === sampleQuestions.length - 1);
  }

  const end = gameService.nextQuestion({ code });

  assert.strictEqual(end.done, true);
  assert.strictEqual(roomStore.getRoom(code).status, "finished");
  assert.deepStrictEqual(
    end.result.winners.map((winner) => winner.name),
    ["Rina"]
  );

  expectError(() => gameService.nextQuestion({ code }), "GAME_NOT_PLAYING");
});

test("skor seri: semua peringkat 1 jadi pemenang", () => {
  const { code, players } = setupGame(["Rina", "Budi"]);
  const [rina, budi] = players;

  for (let i = 0; i < sampleQuestions.length; i++) {
    gameService.nextQuestion({ code, now: 0 });
    gameService.submitAnswer({ code, playerId: rina.id, choice: 1, now: 1000 });
    gameService.submitAnswer({ code, playerId: budi.id, choice: 1, now: 1000 });
    gameService.finishQuestion({ code });
  }

  const end = gameService.nextQuestion({ code });

  assert.strictEqual(end.result.winners.length, 2);
  assert.deepStrictEqual(
    end.result.leaderboard.map((entry) => entry.rank),
    [1, 1]
  );
});

test("semua menjawab: pemain yang terputus tidak dihitung", () => {
  const { code, players } = setupGame(["Rina", "Budi", "Dimas"]);
  const [rina, budi, dimas] = players;

  gameService.nextQuestion({ code, now: 0 });
  gameService.submitAnswer({ code, playerId: rina.id, choice: 1, now: 1000 });

  let progress = gameService.getAnswerProgress(code);
  assert.strictEqual(progress.answeredCount, 1);
  assert.strictEqual(progress.totalPlayers, 3);
  assert.strictEqual(progress.allAnswered, false);

  roomService.leaveRoom({ code, playerId: dimas.id });
  gameService.submitAnswer({ code, playerId: budi.id, choice: 1, now: 2000 });

  progress = gameService.getAnswerProgress(code);
  assert.strictEqual(progress.answeredCount, 2);
  assert.strictEqual(progress.totalPlayers, 2);
  assert.strictEqual(progress.allAnswered, true);
});

test("finishQuestion untuk room yang sudah hilang mengembalikan null", () => {
  assert.strictEqual(gameService.finishQuestion({ code: "ZZZZZ" }), null);
});

console.log(`\nHasil: ${passed} lulus, ${failed} gagal`);
process.exit(failed > 0 ? 1 : 0);