const AppError = require("../utils/AppError");

// Pembatas sederhana: maksimal "limit" permintaan per "windowMs" untuk setiap alamat IP.
// Data disimpan di memori server (cukup untuk satu instance).
function createRateLimiter({ limit, windowMs, message }) {
  const hits = new Map(); // alamat IP -> daftar waktu permintaan

  function middleware(req, res, next) {
    const key = req.ip || "tidak-diketahui";
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((time) => now - time < windowMs);

    if (recent.length >= limit) {
      const retryAfterSeconds = Math.max(
        Math.ceil((windowMs - (now - recent[0])) / 1000),
        1
      );

      hits.set(key, recent);
      res.set("Retry-After", String(retryAfterSeconds));

      return next(
        new AppError(
          `${message} Coba lagi dalam ${retryAfterSeconds} detik.`,
          429,
          "TOO_MANY_REQUESTS"
        )
      );
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  }

  // Hanya untuk pengetesan.
  middleware.reset = () => hits.clear();

  // Membersihkan data lama tiap menit supaya memori tidak menumpuk.
  const cleaner = setInterval(() => {
    const now = Date.now();

    for (const [key, times] of hits) {
      const recent = times.filter((time) => now - time < windowMs);

      if (recent.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, recent);
      }
    }
  }, 60000);

  cleaner.unref();

  return middleware;
}

module.exports = { createRateLimiter };