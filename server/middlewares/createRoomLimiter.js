const { createRateLimiter } = require("./rateLimiter");
const {
  CREATE_ROOM_LIMIT,
  CREATE_ROOM_WINDOW_MS,
} = require("../config/constants");

module.exports = createRateLimiter({
  limit: CREATE_ROOM_LIMIT,
  windowMs: CREATE_ROOM_WINDOW_MS,
  message: "Terlalu banyak percobaan membuat room.",
});