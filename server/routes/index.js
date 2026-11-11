const express = require("express");
const {
  createRoomHandler,
  getRoomHandler,
  getConfigHandler,
} = require("../controllers/roomController");
const createRoomLimiter = require("../middlewares/createRoomLimiter");
const { createRateLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

// Cek room lebih longgar (60 per menit), tapi tetap dibatasi
// supaya kode room tidak bisa ditebak-tebak dengan cepat.
const lookupLimiter = createRateLimiter({
  limit: 60,
  windowMs: 60000,
  message: "Terlalu banyak permintaan.",
});

router.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

router.get("/config", getConfigHandler);
router.post("/rooms", createRoomLimiter, createRoomHandler);
router.get("/rooms/:code", lookupLimiter, getRoomHandler);

module.exports = router;