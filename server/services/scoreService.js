const {
  QUESTION_TIME_MS,
  MAX_SCORE,
  MIN_SCORE,
} = require("../config/constants");

// Menghitung poin untuk jawaban yang BENAR.
// elapsedMs = berapa milidetik pemain butuh untuk menjawab (diukur oleh server).
// Menjawab seketika = 1000 poin, menjawab tepat di batas waktu = 500 poin.
function calculateScore(elapsedMs) {
  const clamped = Math.min(Math.max(elapsedMs, 0), QUESTION_TIME_MS);
  const ratio = clamped / QUESTION_TIME_MS;

  return Math.round(MIN_SCORE + (MAX_SCORE - MIN_SCORE) * (1 - ratio));
}

module.exports = { calculateScore };