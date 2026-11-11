const crypto = require("crypto");
const { DEFAULT_QUESTION_COUNT } = require("../config/constants");
const fallbackData = require("../data/fallbackQuestions.json");
const { validateQuestions } = require("../utils/questionValidator");

// Soal cadangan diperiksa sekali saat server menyala.
// Kalau ada yang rusak, server langsung gagal menyala supaya ketahuan sejak awal.
const check = validateQuestions(
  fallbackData.questions,
  fallbackData.questions.length
);

if (!check.ok) {
  throw new Error(`Soal cadangan tidak valid: ${check.error}`);
}

const FALLBACK_TOPIC = fallbackData.topic;
const allQuestions = check.questions;

// Mengacak urutan (Fisher-Yates). Hasilnya salinan, array asli tidak berubah.
function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

// Mengambil soal cadangan sebanyak yang diminta.
// Kalau yang diminta lebih banyak dari yang tersedia, dikembalikan semua yang ada
// dan "shortage" bernilai true.
function getFallbackQuestions(requestedCount) {
  const wanted =
    Number.isInteger(requestedCount) && requestedCount > 0
      ? requestedCount
      : DEFAULT_QUESTION_COUNT;

  const count = Math.min(wanted, allQuestions.length);

  const questions = shuffle(allQuestions)
    .slice(0, count)
    .map((question) => ({ ...question, options: [...question.options] }));

  return {
    topic: FALLBACK_TOPIC,
    questions,
    requestedCount: wanted,
    shortage: wanted > allQuestions.length,
  };
}

module.exports = {
  getFallbackQuestions,
  FALLBACK_TOPIC,
  FALLBACK_TOTAL: allQuestions.length,
};