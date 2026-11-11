const assert = require("assert");
const config = require("../config");

// Matikan API key supaya tes tidak pernah memanggil AI sungguhan.
config.geminiApiKey = "";

const app = require("../app");
const aiService = require("../services/aiService");
const roomStore = require("../store/roomStore");
const createRoomLimiter = require("../middlewares/createRoomLimiter");
const playerService = require("../services/playerService");

const realGenerateQuestions = aiService.generateQuestions;
let baseUrl = "";

async function request(method, path, body) {
  const options = { method, headers: {} };

  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(baseUrl + path, options);
  const json = await response.json();

  return { status: response.status, body: json, headers: response.headers };
}

function makeQuestions(count) {
  return Array.from({ length: count }, (_, index) => ({
    text: `Soal ${index + 1}?`,
    options: ["A", "B", "C", "D"],
    answerIndex: 0,
    explanation: "Penjelasan.",
  }));
}

// Mengganti AI dengan versi palsu yang selalu berhasil.
// "calls" mencatat setiap permintaan yang masuk ke AI.
function useFakeAi() {
  const calls = [];

  aiService.generateQuestions = async (args) => {
    calls.push(args);
    return {
      type: "generated",
      provider: "palsu",
      topic: args.topic,
      questions: makeQuestions(args.count),
    };
  };

  return calls;
}

const VALID_BODY = {
  name: "Rina",
  topic: "JavaScript dasar",
  questionCount: 5,
  difficulty: "Mudah",
};

let passed = 0;
let failed = 0;

async function test(name, fn) {
  roomStore.clearAllRooms();
  createRoomLimiter.reset();
  aiService.generateQuestions = realGenerateQuestions;

  try {
    await fn();
    passed++;
    console.log(`  OK     ${name}`);
  } catch (error) {
    failed++;
    console.log(`  GAGAL  ${name}`);
    console.log(`         ${error.message}`);
  }
}

async function main() {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  console.log("Tes endpoint REST (Tahap 6)\n");

  await test("GET /api/health: server hidup", async () => {
    const res = await request("GET", "/api/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "ok");
  });

  await test("GET /api/config: berisi pilihan form dan aturan game", async () => {
    const res = await request("GET", "/api/config");
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.questionCountOptions, [5, 10, 15]);
    assert.strictEqual(res.body.difficulties.length, 3);
    assert.strictEqual(res.body.nameMaxLength, 12);
    assert.strictEqual(res.body.questionTimeMs, 20000);
    assert.ok(res.body.suggestedTopics.length > 0);
  });

  await test("buat room tanpa AI aktif: soal cadangan dipakai dan host jadi pemain", async () => {
    const res = await request("POST", "/api/rooms", VALID_BODY);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.source, "fallback");
    assert.strictEqual(res.body.room.usedFallback, true);
    assert.strictEqual(res.body.room.fallbackTopic, "JavaScript dasar");
    assert.strictEqual(res.body.room.totalQuestions, 5);
    assert.strictEqual(res.body.player.isHost, true);
    assert.strictEqual(res.body.room.players[0].id, res.body.player.id);

    const json = JSON.stringify(res.body);
    assert.ok(!json.includes("answerIndex"));
    assert.ok(!json.includes("explanation"));
    assert.strictEqual(res.body.room.questions, undefined);
  });

  await test("buat room dengan soal AI: sumber ai dan data dikirim ke AI dengan benar", async () => {
    const calls = useFakeAi();

    const res = await request("POST", "/api/rooms", {
      name: "Rina",
      topic: "  Tata   surya ",
      questionCount: 5,
      difficulty: "Mudah",
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.source, "ai");
    assert.strictEqual(res.body.room.topic, "Tata surya");
    assert.strictEqual(res.body.room.usedFallback, false);
    assert.strictEqual(res.body.room.totalQuestions, 5);

    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].topic, "Tata surya");
    assert.strictEqual(calls[0].count, 5);
    assert.strictEqual(calls[0].difficulty, "Mudah");
  });

  await test("topik ditolak AI: status 422 dengan saran, room tidak dibuat", async () => {
    aiService.generateQuestions = async () => ({
      type: "rejected",
      provider: "palsu",
      reason: "Topik berupa kalimat cerita",
      suggestions: ["Perkembangan bayi", "Tumbuh kembang anak"],
    });

    const res = await request("POST", "/api/rooms", VALID_BODY);

    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.code, "TOPIC_REJECTED");
    assert.strictEqual(res.body.message, "Topik berupa kalimat cerita");
    assert.deepStrictEqual(res.body.suggestions, [
      "Perkembangan bayi",
      "Tumbuh kembang anak",
    ]);
    assert.strictEqual(roomStore.countRooms(), 0);
  });

  await test("input tidak valid ditolak sebelum memanggil AI", async () => {
    const calls = useFakeAi();

    const cases = [
      [{ ...VALID_BODY, name: "" }, "NAME_REQUIRED"],
      [{}, "NAME_REQUIRED"],
      [{ ...VALID_BODY, name: "NamaSangatPanjangSekali" }, "NAME_TOO_LONG"],
      [{ ...VALID_BODY, topic: "" }, "TOPIC_REQUIRED"],
      [{ ...VALID_BODY, topic: "ab" }, "TOPIC_TOO_SHORT"],
      [{ ...VALID_BODY, topic: "a".repeat(51) }, "TOPIC_TOO_LONG"],
      [{ ...VALID_BODY, questionCount: 7 }, "INVALID_QUESTION_COUNT"],
      [{ ...VALID_BODY, difficulty: "Gila" }, "INVALID_DIFFICULTY"],
    ];

    for (const [body, expectedCode] of cases) {
      createRoomLimiter.reset(); // supaya tidak terkena batas percobaan
      const res = await request("POST", "/api/rooms", body);
      assert.strictEqual(res.status, 400, `Status untuk ${expectedCode}`);
      assert.strictEqual(res.body.code, expectedCode);
    }

    assert.strictEqual(calls.length, 0, "AI tidak boleh dipanggil untuk input salah");
    assert.strictEqual(roomStore.countRooms(), 0);
  });

  await test("jumlah soal dan kesulitan boleh kosong, jumlah soal berupa teks diterima", async () => {
    const calls = useFakeAi();

    const res = await request("POST", "/api/rooms", {
      name: "Rina",
      topic: "Tata surya",
      questionCount: "10",
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(calls[0].count, 10);
    assert.strictEqual(calls[0].difficulty, "Sedang");
    assert.strictEqual(res.body.room.totalQuestions, 10);
  });

  await test("GET /api/rooms/:code: room ditemukan (huruf kecil juga bisa), kode salah 404", async () => {
    useFakeAi();
    const created = await request("POST", "/api/rooms", VALID_BODY);
    const code = created.body.room.code;

    const found = await request("GET", `/api/rooms/${code.toLowerCase()}`);
    assert.strictEqual(found.status, 200);
    assert.strictEqual(found.body.room.code, code);

    const missing = await request("GET", "/api/rooms/ZZZZZ");
    assert.strictEqual(missing.status, 404);
    assert.strictEqual(missing.body.code, "ROOM_NOT_FOUND");
    assert.strictEqual(missing.body.message, "Room tidak ditemukan");
  });

  await test("batas percobaan buat room: percobaan ke-6 ditolak dengan 429", async () => {
    useFakeAi();

    for (let i = 1; i <= 5; i++) {
      const ok = await request("POST", "/api/rooms", VALID_BODY);
      assert.strictEqual(ok.status, 201, `Percobaan ke-${i} seharusnya berhasil`);
    }

    const blocked = await request("POST", "/api/rooms", VALID_BODY);
    assert.strictEqual(blocked.status, 429);
    assert.strictEqual(blocked.body.code, "TOO_MANY_REQUESTS");
    assert.ok(Number(blocked.headers.get("retry-after")) > 0);
  });

  await test("JSON rusak: status 400", async () => {
    const res = await request("POST", "/api/rooms", "{rusak");
    assert.strictEqual(res.status, 400);
  });

  await test("endpoint tidak dikenal: status 404", async () => {
    const res = await request("GET", "/api/ngawur");
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.code, "NOT_FOUND");
  });

  await test("getPlayer: pemain ditemukan, id atau kode yang salah ditolak", async () => {
    useFakeAi();
    const created = await request("POST", "/api/rooms", VALID_BODY);
    const code = created.body.room.code;
    const playerId = created.body.player.id;

    const found = playerService.getPlayer({ code, playerId });
    assert.strictEqual(found.player.isHost, true);
    assert.strictEqual(found.room.code, code);

    assert.throws(
      () => playerService.getPlayer({ code, playerId: "tidak-ada" }),
      (error) => error.code === "PLAYER_NOT_FOUND"
    );
    assert.throws(
      () => playerService.getPlayer({ code: "ZZZZZ", playerId }),
      (error) => error.code === "ROOM_NOT_FOUND"
    );
  });

  server.close();
  console.log(`\nHasil: ${passed} lulus, ${failed} gagal`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
