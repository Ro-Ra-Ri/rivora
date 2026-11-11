const assert = require("assert");
const config = require("../config");
const roomStore = require("../store/roomStore");
const roomService = require("../services/roomService");

// Bentuk satu soal di seluruh server:
// { text, options (4 teks), answerIndex (0-3), explanation }
const sampleQuestions = [
  {
    text: "2 + 2 = ?",
    options: ["3", "4", "5", "6"],
    answerIndex: 1,
    explanation: "Dua tambah dua sama dengan empat.",
  },
];

function makeRoom(hostName = "Rina") {
  return roomService.createRoom({
    hostName,
    topic: "JavaScript dasar",
    difficulty: "Mudah",
    questions: sampleQuestions,
  });
}

// Memastikan sebuah fungsi melempar error dengan kode tertentu.
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

console.log("Tes logika room (Tahap 2)\n");

test("buat room: kode 5 karakter, status lobby, host jadi pemain pertama", () => {
  const { room, player } = makeRoom();
  assert.strictEqual(room.code.length, 5);
  assert.strictEqual(room.status, "lobby");
  assert.strictEqual(room.players.length, 1);
  assert.strictEqual(room.hostId, player.id);
  assert.strictEqual(room.players[0].isHost, true);
  assert.strictEqual(room.totalQuestions, 1);
});

test("data room publik tidak membocorkan soal dan jawaban", () => {
  const { room } = makeRoom();
  const json = JSON.stringify(room);
  assert.strictEqual(room.questions, undefined);
  assert.ok(!json.includes("answerIndex"));
  assert.ok(!json.includes("explanation"));
});

test("gabung room berhasil, kode room tidak peka huruf besar-kecil", () => {
  const { room } = makeRoom();
  const result = roomService.joinRoom({
    code: room.code.toLowerCase(),
    name: "Budi",
  });
  assert.strictEqual(result.room.players.length, 2);
  assert.strictEqual(result.player.isHost, false);
});

test("nama kembar ditolak (tidak peka huruf besar-kecil)", () => {
  const { room } = makeRoom("Rina");
  expectError(
    () => roomService.joinRoom({ code: room.code, name: "rina" }),
    "NAME_TAKEN"
  );
});

test("nama kosong dan nama terlalu panjang ditolak", () => {
  const { room } = makeRoom();
  expectError(
    () => roomService.joinRoom({ code: room.code, name: "   " }),
    "NAME_REQUIRED"
  );
  expectError(
    () => roomService.joinRoom({ code: room.code, name: "NamaSangatPanjangSekali" }),
    "NAME_TOO_LONG"
  );
});

test("kode room salah ditolak", () => {
  expectError(
    () => roomService.joinRoom({ code: "ZZZZZ", name: "Budi" }),
    "ROOM_NOT_FOUND"
  );
});

test("room penuh ditolak", () => {
  const { room } = makeRoom();
  for (let i = 1; i < config.maxPlayers; i++) {
    roomService.joinRoom({ code: room.code, name: `Pemain${i}` });
  }
  expectError(
    () => roomService.joinRoom({ code: room.code, name: "Terakhir" }),
    "ROOM_FULL"
  );
});

test("gabung saat game berjalan ditolak", () => {
  const { room } = makeRoom();
  roomStore.getRoom(room.code).status = "playing";
  expectError(
    () => roomService.joinRoom({ code: room.code, name: "Budi" }),
    "GAME_STARTED"
  );
});

test("host keluar di lobby: host pindah ke pemain terlama", () => {
  const { room, player: host } = makeRoom("Rina");
  const budi = roomService.joinRoom({ code: room.code, name: "Budi" }).player;
  roomService.joinRoom({ code: room.code, name: "Dimas" });

  const result = roomService.leaveRoom({ code: room.code, playerId: host.id });

  assert.strictEqual(result.roomDeleted, false);
  assert.strictEqual(result.newHostId, budi.id);
  assert.strictEqual(result.room.players.length, 2);
  assert.strictEqual(result.room.hostId, budi.id);
});

test("bukan host keluar di lobby: host tetap", () => {
  const { room, player: host } = makeRoom("Rina");
  const budi = roomService.joinRoom({ code: room.code, name: "Budi" }).player;

  const result = roomService.leaveRoom({ code: room.code, playerId: budi.id });

  assert.strictEqual(result.newHostId, null);
  assert.strictEqual(result.room.hostId, host.id);
  assert.strictEqual(result.room.players.length, 1);
});

test("semua pemain keluar: room dihapus", () => {
  const { room, player } = makeRoom();
  const result = roomService.leaveRoom({ code: room.code, playerId: player.id });
  assert.strictEqual(result.roomDeleted, true);
  assert.strictEqual(roomStore.getRoom(room.code), null);
});

test("keluar saat game berjalan: pemain ditandai terputus, tidak dihapus", () => {
  const { room, player: host } = makeRoom("Rina");
  const budi = roomService.joinRoom({ code: room.code, name: "Budi" }).player;
  roomStore.getRoom(room.code).status = "playing";

  const result = roomService.leaveRoom({ code: room.code, playerId: budi.id });

  assert.strictEqual(result.room.players.length, 2);
  const budiAfter = result.room.players.find((p) => p.id === budi.id);
  assert.strictEqual(budiAfter.connected, false);
  assert.strictEqual(result.room.hostId, host.id);
});

test("leaveRoom aman dipanggil untuk room atau pemain yang sudah tidak ada", () => {
  const first = roomService.leaveRoom({ code: "ZZZZZ", playerId: "tidak-ada" });
  assert.strictEqual(first.roomDeleted, true);

  const { room } = makeRoom();
  const second = roomService.leaveRoom({ code: room.code, playerId: "tidak-ada" });
  assert.strictEqual(second.leftPlayer, null);
});

console.log(`\nHasil: ${passed} lulus, ${failed} gagal`);
process.exit(failed > 0 ? 1 : 0);