const config = require("../config");
const constants = require("../config/constants");
const roomService = require("../services/roomService");
const aiService = require("../services/aiService");
const { validatePlayerName } = require("../utils/validators");
const {
  validateTopic,
  validateQuestionCount,
  validateDifficulty,
} = require("../utils/roomInputValidators");

// Tombol topik cepat untuk form buat room (fitur bonus di PRD).
const SUGGESTED_TOPICS = [
  "JavaScript dasar",
  "Sejarah Indonesia",
  "Tata surya",
  "Sepak bola dunia",
];

// POST /api/rooms
// Body: { name, topic, questionCount (boleh kosong), difficulty (boleh kosong) }
async function createRoomHandler(req, res, next) {
  try {
    // Semua input diperiksa DULU, sebelum AI dipanggil (hemat kuota).
    const name = validatePlayerName(req.body?.name);
    const topic = validateTopic(req.body?.topic);
    const count = validateQuestionCount(req.body?.questionCount);
    const difficulty = validateDifficulty(req.body?.difficulty);

    const result = await aiService.generateQuestions({ topic, count, difficulty });

    // Topik ditolak AI: host tetap di form, tidak ada room yang dibuat.
    if (result.type === "rejected") {
      return res.status(422).json({
        message: result.reason,
        code: "TOPIC_REJECTED",
        suggestions: result.suggestions,
      });
    }

    const usedFallback = result.type === "fallback";

    const created = roomService.createRoom({
      hostName: name,
      topic: result.topic,
      difficulty,
      questions: result.questions,
      requestedCount: count,
      usedFallback,
      fallbackTopic: usedFallback ? result.topic : null,
    });

    return res.status(201).json({
      room: created.room,
      player: created.player,
      source: usedFallback ? "fallback" : "ai",
    });
  } catch (error) {
    return next(error);
  }
}

// GET /api/rooms/:code
function getRoomHandler(req, res, next) {
  try {
    res.json({ room: roomService.getPublicRoom(req.params.code) });
  } catch (error) {
    next(error);
  }
}

// GET /api/config
function getConfigHandler(req, res) {
  res.json({
    questionCountOptions: constants.QUESTION_COUNT_OPTIONS,
    defaultQuestionCount: constants.DEFAULT_QUESTION_COUNT,
    difficulties: constants.DIFFICULTIES,
    defaultDifficulty: constants.DEFAULT_DIFFICULTY,
    nameMaxLength: constants.NAME_MAX_LENGTH,
    topicMinLength: constants.TOPIC_MIN_LENGTH,
    topicMaxLength: constants.TOPIC_MAX_LENGTH,
    minPlayers: config.minPlayers,
    maxPlayers: config.maxPlayers,
    questionTimeMs: constants.QUESTION_TIME_MS,
    revealTimeMs: constants.REVEAL_TIME_MS,
    suggestedTopics: SUGGESTED_TOPICS,
  });
}

module.exports = { createRoomHandler, getRoomHandler, getConfigHandler };

