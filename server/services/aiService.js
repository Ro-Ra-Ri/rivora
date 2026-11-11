const crypto = require("crypto");
const config = require("../config");
const { TOPIC_MIN_LENGTH, TOPIC_MAX_LENGTH } = require("../config/constants");
const { cleanText } = require("../utils/validators");
const { extractJson } = require("../utils/extractJson");
const { validateQuestions } = require("../utils/questionValidator");
const { getFallbackQuestions } = require("./fallbackService");
const { buildSystemPrompt, buildUserPrompt } = require("./aiPrompt");
const { callGemini } = require("./aiProviders");

const DEFAULT_SUGGESTIONS = ["Sejarah Indonesia", "JavaScript dasar", "Tata surya"];

// Urutan model: Gemini utama, lalu Gemini cadangan.
// Model cadangan dilewati jika API key tidak tersedia atau modelnya sama.
const defaultProviders = [
  {
    name: "gemini",
    isEnabled: () => Boolean(config.geminiApiKey),
    call: (prompts) => callGemini(prompts, config.geminiModel),
  },
  {
    name: "gemini-cadangan",
    isEnabled: () =>
      Boolean(config.geminiApiKey && config.geminiFallbackModel) &&
      config.geminiFallbackModel !== config.geminiModel,
    call: (prompts) => callGemini(prompts, config.geminiFallbackModel),
  },
];

// Mengacak urutan opsi, kunci jawaban ikut dipindahkan ke posisi barunya.
// AI cenderung menaruh jawaban benar di posisi yang itu-itu saja.
function shuffleOptions(question) {
  const entries = question.options.map((text, index) => ({
    text,
    isCorrect: index === question.answerIndex,
  }));

  for (let i = entries.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }

  return {
    ...question,
    options: entries.map((entry) => entry.text),
    answerIndex: entries.findIndex((entry) => entry.isCorrect),
  };
}

// Merapikan alasan dan saran topik dari AI saat topik ditolak.
function buildRejection(parsed) {
  const reason =
    cleanText(parsed.reason).slice(0, 200) ||
    "Topik tidak dikenali sebagai bidang pengetahuan";

  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions
        .map((item) => cleanText(item))
        .filter(
          (item) => item.length >= TOPIC_MIN_LENGTH && item.length <= TOPIC_MAX_LENGTH
        )
        .slice(0, 3)
    : [];

  return {
    reason,
    suggestions: suggestions.length > 0 ? suggestions : DEFAULT_SUGGESTIONS,
  };
}

// Membuat soal dari topik. Hasilnya salah satu dari tiga jenis:
//
//  { type: "generated", provider, topic, questions }
//      Soal dari AI berhasil dibuat.
//
//  { type: "rejected", provider, reason, suggestions }
//      AI menolak topiknya. Host tetap di form, soal cadangan TIDAK dipakai.
//
//  { type: "fallback", topic, questions, requestedCount, shortage, errors }
//      Semua AI gagal, memakai soal cadangan. "errors" untuk catatan di log.
//
// Parameter kedua (providers) hanya untuk pengetesan.
async function generateQuestions({ topic, count, difficulty }, providers = defaultProviders) {
  const cleanTopic = cleanText(topic);

  const prompts = {
    systemPrompt: buildSystemPrompt(),
    userPrompt: buildUserPrompt({ topic: cleanTopic, count, difficulty }),
  };

  const errors = [];

  for (const provider of providers) {
    if (!provider.isEnabled()) continue;

    try {
      const text = await provider.call(prompts);
      const parsed = extractJson(text);

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Balasan bukan JSON yang valid");
      }

      if (parsed.valid === false) {
        return { type: "rejected", provider: provider.name, ...buildRejection(parsed) };
      }

      if (parsed.valid !== true) {
        throw new Error('Field "valid" harus true atau false');
      }

      const check = validateQuestions(parsed.questions, count);

      if (!check.ok) {
        throw new Error(check.error);
      }

      return {
        type: "generated",
        provider: provider.name,
        topic: cleanTopic,
        questions: check.questions.map(shuffleOptions),
      };
    } catch (error) {
      errors.push(`${provider.name}: ${error.message}`);
      console.warn(`[AI] ${provider.name} gagal: ${error.message}`);
    }
  }

  const fallback = getFallbackQuestions(count);

  return {
    type: "fallback",
    topic: fallback.topic,
    questions: fallback.questions,
    requestedCount: fallback.requestedCount,
    shortage: fallback.shortage,
    errors,
  };
}

module.exports = { generateQuestions };
