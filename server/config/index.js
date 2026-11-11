require("dotenv").config();

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Boleh lebih dari satu alamat, dipisah koma.
  // Contoh: http://localhost:5173,https://quiz-battle.vercel.app
  clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),

  minPlayers: Number(process.env.MIN_PLAYERS) || 4,
  maxPlayers: Number(process.env.MAX_PLAYERS) || 10,

  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  geminiFallbackModel:
    process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite",
};

module.exports = config;
