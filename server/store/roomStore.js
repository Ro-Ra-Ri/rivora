const crypto = require("crypto");
const { ROOM_CODE_LENGTH, ROOM_CODE_CHARS } = require("../config/constants");

// Semua room disimpan di sini, di memori server.
// Kunci = kode room (contoh "K7MP2"), isi = data room.
const rooms = new Map();

// Kode room dibuat huruf besar. Fungsi ini membuat "k7mp2" dan " K7MP2 " tetap cocok.
function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

// Membuat kode acak yang belum dipakai room lain.
function generateRoomCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = "";

    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS[crypto.randomInt(ROOM_CODE_CHARS.length)];
    }

    if (!rooms.has(code)) {
      return code;
    }
  }

  throw new Error("Gagal membuat kode room yang unik");
}

function getRoom(code) {
  return rooms.get(normalizeCode(code)) || null;
}

function saveRoom(room) {
  rooms.set(room.code, room);
  return room;
}

function deleteRoom(code) {
  return rooms.delete(normalizeCode(code));
}

function countRooms() {
  return rooms.size;
}

// Hanya untuk pengetesan.
function clearAllRooms() {
  rooms.clear();
}

module.exports = {
  generateRoomCode,
  getRoom,
  saveRoom,
  deleteRoom,
  countRooms,
  clearAllRooms,
};