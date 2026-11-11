const AppError = require("../utils/AppError");
const {
  getRoomOrThrow,
  toPublicRoom,
  toPublicPlayer,
} = require("./roomService");

// Mencari pemain yang sudah ada di sebuah room.
// Dipakai Dev3 untuk menyambungkan socket ke pemain yang sudah ada,
// misalnya host yang dibuat lewat REST sebelum socket-nya tersambung.
function getPlayer({ code, playerId }) {
  const room = getRoomOrThrow(code);
  const player = room.players.find((item) => item.id === playerId);

  if (!player) {
    throw new AppError("Pemain tidak ditemukan", 404, "PLAYER_NOT_FOUND");
  }

  return {
    room: toPublicRoom(room),
    player: toPublicPlayer(room, player),
  };
}

module.exports = { getPlayer };