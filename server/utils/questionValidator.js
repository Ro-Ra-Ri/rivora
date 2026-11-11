const { OPTIONS_PER_QUESTION } = require("../config/constants");
const { cleanText } = require("./validators");

// Batas panjang supaya tampilan di client tidak rusak.
const MAX_TEXT_LENGTH = 500;
const MAX_OPTION_LENGTH = 200;
const MAX_EXPLANATION_LENGTH = 600;

function fail(error) {
  return { ok: false, error };
}

// Memeriksa satu soal. "number" adalah nomor soal (mulai 1) untuk pesan error.
function validateOne(item, number) {
  const label = `Soal ke-${number}`;

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return fail(`${label}: bukan objek`);
  }

  const text = cleanText(item.text);

  if (!text) return fail(`${label}: teks soal kosong`);
  if (text.length > MAX_TEXT_LENGTH) return fail(`${label}: teks soal terlalu panjang`);

  if (!Array.isArray(item.options) || item.options.length !== OPTIONS_PER_QUESTION) {
    return fail(`${label}: harus tepat ${OPTIONS_PER_QUESTION} opsi`);
  }

  const options = item.options.map((option) => cleanText(option));

  if (options.some((option) => !option)) {
    return fail(`${label}: ada opsi kosong`);
  }

  if (options.some((option) => option.length > MAX_OPTION_LENGTH)) {
    return fail(`${label}: ada opsi yang terlalu panjang`);
  }

  const lowered = options.map((option) => option.toLowerCase());

  if (new Set(lowered).size !== lowered.length) {
    return fail(`${label}: ada opsi kembar`);
  }

  if (
    !Number.isInteger(item.answerIndex) ||
    item.answerIndex < 0 ||
    item.answerIndex >= OPTIONS_PER_QUESTION
  ) {
    return fail(
      `${label}: indeks jawaban harus bilangan bulat 0 sampai ${OPTIONS_PER_QUESTION - 1}`
    );
  }

  const explanation = cleanText(item.explanation);

  if (!explanation) return fail(`${label}: penjelasan kosong`);
  if (explanation.length > MAX_EXPLANATION_LENGTH) {
    return fail(`${label}: penjelasan terlalu panjang`);
  }

  return {
    ok: true,
    question: { text, options, answerIndex: item.answerIndex, explanation },
  };
}

// Memeriksa seluruh daftar soal.
// Hasilnya { ok: true, questions } (sudah dirapikan) atau { ok: false, error }.
function validateQuestions(raw, expectedCount) {
  if (!Array.isArray(raw)) {
    return fail("Soal harus berupa array");
  }

  if (raw.length !== expectedCount) {
    return fail(`Jumlah soal harus ${expectedCount}, tetapi dapat ${raw.length}`);
  }

  const questions = [];

  for (let i = 0; i < raw.length; i++) {
    const result = validateOne(raw[i], i + 1);

    if (!result.ok) return result;

    questions.push(result.question);
  }

  return { ok: true, questions };
}

module.exports = { validateQuestions };