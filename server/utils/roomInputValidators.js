const AppError = require("./AppError");
const { cleanText } = require("./validators");
const {
  TOPIC_MIN_LENGTH,
  TOPIC_MAX_LENGTH,
  QUESTION_COUNT_OPTIONS,
  DEFAULT_QUESTION_COUNT,
  DIFFICULTIES,
  DEFAULT_DIFFICULTY,
} = require("../config/constants");

function validateTopic(topic) {
  const cleaned = cleanText(topic);

  if (!cleaned) {
    throw new AppError("Topik wajib diisi", 400, "TOPIC_REQUIRED");
  }

  if (cleaned.length < TOPIC_MIN_LENGTH) {
    throw new AppError(
      `Topik minimal ${TOPIC_MIN_LENGTH} karakter`,
      400,
      "TOPIC_TOO_SHORT"
    );
  }

  if (cleaned.length > TOPIC_MAX_LENGTH) {
    throw new AppError(
      `Topik maksimal ${TOPIC_MAX_LENGTH} karakter`,
      400,
      "TOPIC_TOO_LONG"
    );
  }

  return cleaned;
}

// Kosong = memakai nilai bawaan. Teks angka seperti "10" juga diterima.
function validateQuestionCount(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_QUESTION_COUNT;
  }

  const number = Number(value);

  if (!QUESTION_COUNT_OPTIONS.includes(number)) {
    throw new AppError(
      `Jumlah soal harus salah satu dari ${QUESTION_COUNT_OPTIONS.join(", ")}`,
      400,
      "INVALID_QUESTION_COUNT"
    );
  }

  return number;
}

function validateDifficulty(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_DIFFICULTY;
  }

  if (!DIFFICULTIES.includes(value)) {
    throw new AppError(
      `Tingkat kesulitan harus salah satu dari ${DIFFICULTIES.join(", ")}`,
      400,
      "INVALID_DIFFICULTY"
    );
  }

  return value;
}

module.exports = { validateTopic, validateQuestionCount, validateDifficulty };