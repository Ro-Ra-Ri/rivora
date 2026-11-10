const config = require("../config");
const { AI_TIMEOUT_MS } = require("../config/constants");

// Error sementara dari server penyedia. Layak dicoba ulang satu kali.
const RETRYABLE_STATUS = [500, 502, 503, 504];

function httpError(status, detail) {
  const error = new Error(`HTTP ${status} ${detail}`.trim());
  error.status = status;
  return error;
}

// Menjalankan fungsi, dan mengulang SATU kali jika errornya sementara (misalnya 503).
// Error lain (kunci salah, kuota habis, dan sebagainya) langsung dilempar.
async function withRetry(fn, delayMs = 1500) {
  try {
    return await fn();
  } catch (error) {
    if (!RETRYABLE_STATUS.includes(error.status)) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fn();
  }
}

// Mengambil pesan error singkat dari balasan penyedia (untuk catatan di log).
async function readErrorDetail(response) {
  try {
    const text = await response.text();

    try {
      const message = JSON.parse(text)?.error?.message;
      if (message) return String(message).slice(0, 200);
    } catch (error) {
      // bukan JSON, lanjut memakai teks mentah
    }

    return text.replace(/\s+/g, " ").slice(0, 200);
  } catch (error) {
    return "";
  }
}

// ---------- Gemini ----------

async function callGemini({ systemPrompt, userPrompt }, model = config.geminiModel) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  return withRetry(async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.geminiApiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw httpError(response.status, await readErrorDetail(response));
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((part) => part.text || "").join("");

    if (!text) {
      throw new Error("Gemini tidak mengembalikan teks");
    }

    return text;
  });
}

// ---------- Grok (xAI) ----------

async function callGrok({ systemPrompt, userPrompt }) {
  return withRetry(async () => {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.grokApiKey}`,
      },
      body: JSON.stringify({
        model: config.grokModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw httpError(response.status, await readErrorDetail(response));
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("Grok tidak mengembalikan teks");
    }

    return text;
  });
}

module.exports = { callGemini, callGrok, withRetry };