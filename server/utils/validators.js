const AppError = require("./AppError");
const { NAME_MAX_LENGTH } = require("../config/constants");

// Merapikan teks: buang karakter kontrol, rapikan spasi berlebih, potong spasi pinggir.
// Kalau yang masuk bukan teks (misalnya angka atau objek), hasilnya teks kosong.
function cleanText(value) {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validatePlayerName(name) {
  const cleaned = cleanText(name);

  if (!cleaned) {
    throw new AppError("Nama wajib diisi", 400, "NAME_REQUIRED");
  }

  if (cleaned.length > NAME_MAX_LENGTH) {
    throw new AppError(
      `Nama maksimal ${NAME_MAX_LENGTH} karakter`,
      400,
      "NAME_TOO_LONG"
    );
  }

  return cleaned;
}

module.exports = { cleanText, validatePlayerName };