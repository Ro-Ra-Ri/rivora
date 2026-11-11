module.exports = {
  // Waktu (milidetik)
  QUESTION_TIME_MS: 20000,
  REVEAL_TIME_MS: 8000,
  AI_TIMEOUT_MS: 20000,

  // Skor
  MAX_SCORE: 1000,
  MIN_SCORE: 500,

  // Validasi input
  NAME_MAX_LENGTH: 12,
  TOPIC_MIN_LENGTH: 3,
  TOPIC_MAX_LENGTH: 50,

  // Pilihan di form buat room
  QUESTION_COUNT_OPTIONS: [5, 10, 15],
  DEFAULT_QUESTION_COUNT: 5,
  DIFFICULTIES: ["Mudah", "Sedang", "Sulit"],
  DEFAULT_DIFFICULTY: "Sedang",

  // Soal
  OPTIONS_PER_QUESTION: 4,

  // Kode room (tanpa huruf O, I dan angka 0, 1 agar tidak membingungkan)
  ROOM_CODE_LENGTH: 5,
  ROOM_CODE_CHARS: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",

  // Batas percobaan buat room per pemain
  CREATE_ROOM_LIMIT: 5,
  CREATE_ROOM_WINDOW_MS: 60000,
};