const assert = require("assert");
const fallbackData = require("../data/fallbackQuestions.json");
const { validateQuestions } = require("../utils/questionValidator");
const {
  getFallbackQuestions,
  FALLBACK_TOPIC,
  FALLBACK_TOTAL,
} = require("../services/fallbackService");

// Satu soal yang benar, dipakai sebagai bahan untuk dirusak di tes.
function goodQuestion() {
  return {
    text: "Soal contoh?",
    options: ["A", "B", "C", "D"],
    answerIndex: 0,
    explanation: "Penjelasan contoh.",
  };
}

// Memastikan validator menolak, dan pesan errornya memuat kata tertentu.
function expectInvalid(raw, expectedCount, expectedWord) {
  const result = validateQuestions(raw, expectedCount);
  assert.strictEqual(result.ok, false, "Seharusnya ditolak, tetapi diterima");
  assert.ok(
    result.error.includes(expectedWord),
    `Pesan error "${result.error}" seharusnya memuat "${expectedWord}"`
  );
}

let passed = 0;
let failed = 0;

function test(name, fn) {
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

console.log("Tes soal dan validator (Tahap 4)\n");

test("file soal cadangan valid: 10 soal", () => {
  const result = validateQuestions(fallbackData.questions, 10);
  assert.strictEqual(result.ok, true, result.error);
  assert.strictEqual(FALLBACK_TOTAL, 10);
  assert.strictEqual(FALLBACK_TOPIC, "JavaScript dasar");
});

test("getFallbackQuestions(5): 5 soal valid", () => {
  const result = getFallbackQuestions(5);
  assert.strictEqual(result.questions.length, 5);
  assert.strictEqual(result.shortage, false);
  assert.strictEqual(validateQuestions(result.questions, 5).ok, true);
});

test("getFallbackQuestions(15): hanya 10 soal tersedia", () => {
  const result = getFallbackQuestions(15);
  assert.strictEqual(result.questions.length, 10);
  assert.strictEqual(result.requestedCount, 15);
  assert.strictEqual(result.shortage, true);
});

test("soal cadangan yang dikembalikan adalah salinan (data asli aman)", () => {
  const first = getFallbackQuestions(10);
  first.questions.forEach((question) => {
    question.text = "DIUBAH";
    question.options[0] = "DIUBAH";
  });

  const second = getFallbackQuestions(10);
  assert.ok(second.questions.every((question) => question.text !== "DIUBAH"));
  assert.ok(second.questions.every((question) => question.options[0] !== "DIUBAH"));
});

test("validator: soal benar diterima dan teks dirapikan", () => {
  const question = goodQuestion();
  question.text = "   Soal   dengan   spasi  berlebih?  ";

  const result = validateQuestions([question], 1);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.questions[0].text, "Soal dengan spasi berlebih?");
});

test("validator: bukan array dan jumlah tidak sesuai ditolak", () => {
  expectInvalid("bukan array", 1, "array");
  expectInvalid({}, 1, "array");
  expectInvalid([goodQuestion()], 5, "Jumlah soal");
  expectInvalid([], 5, "Jumlah soal");
});

test("validator: teks soal kosong dan penjelasan kosong ditolak", () => {
  const noText = goodQuestion();
  noText.text = "   ";
  expectInvalid([noText], 1, "teks soal");

  const noExplanation = goodQuestion();
  noExplanation.explanation = "";
  expectInvalid([noExplanation], 1, "penjelasan");
});

test("validator: opsi tidak tepat 4, opsi kosong, opsi kembar ditolak", () => {
  const threeOptions = goodQuestion();
  threeOptions.options = ["A", "B", "C"];
  expectInvalid([threeOptions], 1, "tepat 4 opsi");

  const emptyOption = goodQuestion();
  emptyOption.options = ["A", "B", "", "D"];
  expectInvalid([emptyOption], 1, "opsi kosong");

  const duplicate = goodQuestion();
  duplicate.options = ["A", "B", "a", "D"];
  expectInvalid([duplicate], 1, "opsi kembar");
});

test("validator: indeks jawaban tidak valid ditolak", () => {
  [4, -1, 1.5, "1", null, undefined].forEach((badIndex) => {
    const question = goodQuestion();
    question.answerIndex = badIndex;
    expectInvalid([question], 1, "indeks jawaban");
  });
});

test("validator: elemen yang bukan objek ditolak", () => {
  expectInvalid([null], 1, "bukan objek");
  expectInvalid(["teks saja"], 1, "bukan objek");
  expectInvalid([[1, 2, 3, 4]], 1, "bukan objek");
});

console.log(`\nHasil: ${passed} lulus, ${failed} gagal`);
process.exit(failed > 0 ? 1 : 0);